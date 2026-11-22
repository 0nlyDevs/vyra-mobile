import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";

import { ApiError, caseIdFrom, type Check, post } from "@/lib/api";
import { MagnifyingGlass } from "@/lib/icons";
import { Button, Card, Field, Notice, Screen, T } from "@/ui/ui";

/** La vérification rapide : un texte ou un lien reçu. Jamais de verdict nouveau, seulement ce qui existe déjà. */
export default function CheckScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Check | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    const value = input.trim();
    const isLink = /^https?:\/\/\S+$/i.test(value);
    try {
      setResult(await post<Check>("/check", isLink ? { url: value } : { text: value }));
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  const judgedId = result?.judged ? caseIdFrom(result.judged.url) : null;
  const flagged = result?.signals.filter((signal) => signal.signs.length > 0) ?? [];

  return (
    <Screen>
      <T tone="title">Vérifier</T>
      <T tone="muted">Collez un texte reçu ou un lien : Vyra cherche s’il a déjà été jugé et relève les signes d’alerte.</T>
      <Field value={input} onChangeText={setInput} multiline numberOfLines={5} placeholder="« URGENT : inondation ce matin… »" style={{ minHeight: 120 }} />
      <Button label="Vérifier" icon={MagnifyingGlass} busy={busy} disabled={input.trim().length < 10} onPress={run} />
      {error && <Notice tone="error">{error}</Notice>}
      {result && (
        <View style={{ gap: 12 }}>
          {result.judged ? (
            <Pressable disabled={!judgedId} onPress={() => judgedId && router.push({ pathname: "/case/[id]", params: { id: judgedId } })}>
              <Card>
                <T tone="label">Déjà jugé · {result.judged.label}</T>
                <T style={{ fontFamily: "BricolageGrotesque_700Bold", fontSize: 18 }}>{result.judged.title}</T>
                {result.judged.conclusion && <T tone="muted">{result.judged.conclusion}</T>}
              </Card>
            </Pressable>
          ) : (
            <Notice>Aucune affaire jugée ne ressemble à ce texte. Ouvrez une enquête depuis le site pour le faire juger.</Notice>
          )}
          {flagged.map((signal) => (
            <Card key={signal.label}>
              <T tone="label">{signal.label}</T>
              {signal.signs.map((sign) => (
                <T key={`${sign.label}-${sign.quote}`}>
                  {sign.label} : « {sign.quote} »
                </T>
              ))}
            </Card>
          ))}
          {result.factChecks.map((check, index) => (
            <Pressable key={`${check.url ?? ""}${index}`} disabled={!check.url} onPress={() => check.url && Linking.openURL(check.url)}>
              <Card>
                <T tone="label">Vérification publiée{check.publisher ? ` · ${check.publisher}` : ""}</T>
                <T>{check.title ?? check.rating ?? "Voir la vérification"}</T>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
