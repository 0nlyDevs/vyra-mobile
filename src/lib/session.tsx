import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { get, type Login, type Profile, post, setToken } from "@/lib/api";
import { kv } from "@/lib/kv";

const KEY = "vyra.token";

type Session = {
  status: "loading" | "out" | "in";
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<Session | null>(null);

/** La session : le jeton est gardé sur le téléphone, le profil relu au démarrage. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Session["status"]>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await kv.getItemAsync(KEY);
      if (!saved) return alive && setStatus("out");
      setToken(saved);
      try {
        const me = await get<Profile>("/me");
        if (!alive) return;
        setProfile(me);
        setStatus("in");
      } catch (error) {
        // Jeton refusé : on l'oublie. Réseau coupé : on reste dehors sans effacer le jeton.
        if ((error as { status?: number }).status === 401) {
          setToken(null);
          await kv.setItemAsync(KEY, "");
        }
        if (alive) setStatus("out");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const login = await post<Login>("/auth/login", { email, password });
    setToken(login.token);
    await kv.setItemAsync(KEY, login.token);
    setProfile(login.profile);
    setStatus("in");
  }, []);

  const signOut = useCallback(async () => {
    await post("/auth/logout").catch(() => null);
    setToken(null);
    await kv.setItemAsync(KEY, "");
    setProfile(null);
    setStatus("out");
  }, []);

  const value = useMemo(() => ({ status, profile, signIn, signOut }), [status, profile, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const value = useContext(Ctx);
  if (!value) throw new Error("useSession doit être appelé sous SessionProvider.");
  return value;
}
