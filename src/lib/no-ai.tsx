import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { kv } from "@/lib/kv";

// Le mode « Sans IA », comme la préférence de lecture du site : seuls les faits restent (pièces,
// informations du fichier, règle de certitude, annuaire) ; ce que l'IA a lu ou rédigé est masqué.
const KEY = "vyra.reading-no-ai";

type NoAi = { noAi: boolean; setNoAi: (value: boolean) => void };

const Ctx = createContext<NoAi>({ noAi: false, setNoAi: () => undefined });

export function NoAiProvider({ children }: { children: ReactNode }) {
  const [noAi, setState] = useState(false);
  useEffect(() => {
    kv.getItemAsync(KEY).then((saved) => setState(saved === "on"));
  }, []);
  const setNoAi = useCallback((value: boolean) => {
    setState(value);
    kv.setItemAsync(KEY, value ? "on" : "off");
  }, []);
  const value = useMemo(() => ({ noAi, setNoAi }), [noAi, setNoAi]);
  return <Ctx value={value}>{children}</Ctx>;
}

export const useNoAi = () => useContext(Ctx);
