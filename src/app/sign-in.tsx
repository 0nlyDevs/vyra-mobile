import { useState } from "react";
import { Pressable, View } from "react-native";

import { Brand } from "@/components/brand";
import { type ApiError, type DemoProfile, type Login, post } from "@/lib/api";
import { PROFILE_ROLE_LABELS } from "@/lib/domain";
import { ArrowRight } from "@/lib/icons";
import { useSession } from "@/lib/session";
import { fonts, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/use-api";
import { Button, Card, Field, Notice, Screen, T } from "@/ui/ui";

type Mode = "login" | "signup" | "forgot";

const HEADINGS: Record<Mode, { title: string; intro: string }> = {
  login: { title: "Se connecter", intro: "Voir d’où vient une information, et la faire juger sur pièces. Avec l’e-mail et le mot de passe du site." },
  signup: { title: "Votre compte", intro: "Un nom, une adresse, un mot de passe : vous pouvez utiliser Vyra tout de suite." },
  forgot: { title: "Mot de passe oublié", intro: "Indiquez votre adresse : vous recevrez un lien pour en choisir un nouveau." },
};

function errorOf(e: unknown) {
  const failure = e as ApiError;
  const field = failure.fieldErrors ? Object.values(failure.fieldErrors).flat().find(Boolean) : undefined;
  return field ?? failure.message;
}

function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" hitSlop={8} onPress={onPress} style={{ alignSelf: "flex-start" }}>
      <T style={{ fontFamily: fonts.semibold, textDecorationLine: "underline" }}>{label}</T>
    </Pressable>
  );
}

/** Accès en un clic aux comptes de démo, comme sur la page de connexion du site (mode démo seulement :
 * hors démo, la liste est vide et rien ne s'affiche). */
function DemoAccounts() {
  const c = useTheme();
  const { startSession } = useSession();
  const { data } = useApi<DemoProfile[] | { profiles: DemoProfile[] }>("/auth/demo");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const profiles = Array.isArray(data) ? data : (data?.profiles ?? []);
  if (profiles.length === 0) return null;

  async function enter(profileId: string) {
    setBusy(profileId);
    setError(null);
    try {
      await startSession(await post<Login>("/auth/demo", { profileId }));
    } catch (e) {
      setError(errorOf(e));
      setBusy(null);
    }
  }

  return (
    <View style={{ gap: 10 }}>
      <T style={{ fontFamily: fonts.bold, fontSize: 17 }}>Comptes de démo</T>
      {profiles.map((profile) => (
        <Pressable
          key={profile.id}
          accessibilityRole="button"
          disabled={busy !== null}
          onPress={() => enter(profile.id)}
          style={({ pressed }) => ({ opacity: pressed || busy === profile.id ? 0.6 : 1 })}
        >
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <T style={{ fontFamily: fonts.semibold }}>{profile.name}</T>
              <T tone="muted" style={{ fontSize: 14 }}>
                {profile.role in PROFILE_ROLE_LABELS ? PROFILE_ROLE_LABELS[profile.role as keyof typeof PROFILE_ROLE_LABELS] : profile.role} · {profile.headline}
              </T>
            </View>
            <ArrowRight size={18} color={c.foreground} />
          </Card>
        </Pressable>
      ))}
      {error && <Notice tone="error">{error}</Notice>}
    </View>
  );
}

/** La connexion, l'inscription et le mot de passe oublié, comme les pages du site, puis les comptes
 * de démo. Le lien de réinitialisation s'ouvre sur le site. */
export default function SignIn() {
  const { signIn, startSession } = useSession();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function go(next: Mode) {
    setMode(next);
    setError(null);
    setSent(false);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await signIn(email.trim(), password);
      else if (mode === "signup") await startSession(await post<Login>("/auth/signup", { name: name.trim(), email: email.trim(), password }));
      else {
        await post("/auth/forgot-password", { email: email.trim() });
        setSent(true);
      }
    } catch (e) {
      setError(errorOf(e));
    } finally {
      setBusy(false);
    }
  }

  const heading = HEADINGS[mode];
  const label = mode === "login" ? (busy ? "Connexion…" : "Se connecter") : mode === "signup" ? (busy ? "Création du compte…" : "Créer un compte") : busy ? "Envoi…" : "Recevoir un lien";
  const ready = mode === "forgot" ? !!email.trim() : mode === "signup" ? !!name.trim() && !!email.trim() && password.length >= 8 : !!email.trim() && password.length > 0;

  return (
    <Screen>
      <View style={{ gap: 20, paddingTop: 32 }}>
        <Brand />
        <View style={{ gap: 6 }}>
          <T tone="title">{heading.title}</T>
          <T tone="muted">{heading.intro}</T>
        </View>
      </View>
      {mode === "forgot" && sent ? (
        <Notice>Vérifiez votre boîte de réception. Si un compte utilise cette adresse, un e-mail vient de partir avec un lien valable 1 heure.</Notice>
      ) : (
        <>
          {mode === "signup" && <Field label="Votre nom" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />}
          <Field label="Adresse e-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
          {mode !== "forgot" && (
            <Field
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              textContentType={mode === "signup" ? "newPassword" : "password"}
              onSubmitEditing={submit}
            />
          )}
          {error && <Notice tone="error">{error}</Notice>}
          <Button label={label} busy={busy} disabled={!ready} onPress={submit} />
        </>
      )}
      {mode === "login" && (
        <View style={{ gap: 12 }}>
          <TextLink label="Mot de passe oublié ?" onPress={() => go("forgot")} />
          <T tone="muted">
            Pas encore de compte ? <T style={{ fontFamily: fonts.semibold, textDecorationLine: "underline" }} onPress={() => go("signup")}>Créer un compte</T>
          </T>
        </View>
      )}
      {mode === "signup" && (
        <T tone="muted">
          Un e-mail de confirmation vous est envoyé. Déjà inscrit ? <T style={{ fontFamily: fonts.semibold, textDecorationLine: "underline" }} onPress={() => go("login")}>Se connecter</T>
        </T>
      )}
      {mode === "forgot" && <TextLink label="Retour à la connexion" onPress={() => go("login")} />}
      {mode === "login" && <DemoAccounts />}
    </Screen>
  );
}
