import { useState } from "react";
import { View } from "react-native";

import { Brand } from "@/components/brand";
import { type ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import { Button, Field, Notice, Screen, T } from "@/ui/ui";

/** La connexion : la marque, le titre, puis l'e-mail et le mot de passe du site. */
export default function SignIn() {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ gap: 20, paddingTop: 32 }}>
        <Brand />
        <View style={{ gap: 6 }}>
          <T tone="title">Se connecter</T>
          <T tone="muted">Voir d’où vient une information, et la faire juger sur pièces. Avec l’e-mail et le mot de passe du site.</T>
        </View>
      </View>
      <Field label="Adresse e-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <Field label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" onSubmitEditing={submit} />
      {error && <Notice tone="error">{error}</Notice>}
      <Button label={busy ? "Connexion…" : "Se connecter"} busy={busy} disabled={!email.trim() || password.length < 1} onPress={submit} />
    </Screen>
  );
}
