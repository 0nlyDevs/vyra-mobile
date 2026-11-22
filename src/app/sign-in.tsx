import { useState } from "react";
import { View } from "react-native";

import { type ApiError } from "@/lib/api";
import { fonts, tracking } from "@/lib/theme";
import { useSession } from "@/lib/session";
import { Button, Field, Notice, Screen, T } from "@/ui/ui";

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
      <View style={{ gap: 6, marginTop: 40, marginBottom: 12 }}>
        <T style={{ fontFamily: fonts.display, fontSize: 56, lineHeight: 60, letterSpacing: tracking(56) }}>VYRA</T>
        <T tone="muted">Voir d’où vient une information, et la faire juger sur pièces.</T>
      </View>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Adresse e-mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
      <Field label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={submit} />
      <Button label="Se connecter" busy={busy} disabled={!email.trim() || password.length < 1} onPress={submit} />
    </Screen>
  );
}
