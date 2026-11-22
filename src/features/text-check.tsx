import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { ApiError, caseIdFrom, type Certainty, CERTAINTY_LABELS, type Check, post } from "@/lib/api";
import { CERTAINTY_CRITERIA } from "@/lib/domain";
import { CaretRight, Graph, MagnifyingGlass } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { AiReading } from "@/ui/ai-reading";
import { PublishedChecks } from "@/ui/published-checks";
import { Button, Field, Notice, Section, Step, T, VerdictPanel, styles } from "@/ui/ui";
import { WarningSigns } from "@/ui/warning-signs";

const LONE_URL = /^https?:\/\/\S+$/i;
/** Les trois endroits où Vyra cherche, dans l'ordre. */
const LAYERS = ["Affaires jugées par le tribunal", "Signes d’alerte dans les mots", "Vérifications déjà publiées"];

/** Le libellé renvoyé par la plateforme, retrouvé parmi les conclusions du juge (pour la couleur et l'icône). */
function certaintyOf(label: string): Certainty | null {
  const found = (Object.entries(CERTAINTY_LABELS) as [Certainty, string][]).find(([, word]) => word === label);
  return found ? found[0] : null;
}

/** La vérification rapide : un texte ou un lien reçu. Jamais de verdict nouveau, seulement ce qui existe déjà. */
export function TextCheck() {
  const router = useRouter();
  const c = useTheme();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Check | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    const value = input.trim();
    try {
      setResult(await post<Check>("/check", LONE_URL.test(value) ? { url: value } : { text: value }));
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  const judgedId = result?.judged ? caseIdFrom(result.judged.url) : null;
  const level = result?.judged ? certaintyOf(result.judged.label) : null;
  
  return (
    <>
      <T tone="muted">Un message ou un lien reçu : Vyra cherche s’il a déjà été jugé, relève les signes d’alerte et les vérifications publiées. Jamais de verdict nouveau.</T>
      <Field
        label="Le message ou le lien"
        value={input}
        onChangeText={setInput}
        multiline
        numberOfLines={5}
        placeholder="« URGENT : inondation ce matin… » ou https://…"
        style={{ minHeight: 120 }}
      />
      <Button label="Vérifier" icon={MagnifyingGlass} busy={busy} disabled={input.trim().length < 10} onPress={run} />

      {busy && (
        // Les trois endroits où Vyra cherche, dans l'ordre : pas de faux progrès.
        <View style={{ backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 10 }}>
          {LAYERS.map((layer, i) => (
            <Step key={layer} label={`${String(i + 1).padStart(2, "0")}  ${layer}`} state={i === 0 ? "running" : "waiting"} />
          ))}
        </View>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      {result && (
        <>
          {result.judged ? (
            <Section title="Déjà jugée par le tribunal">
              {level ? (
                <VerdictPanel level={level}>
                  <T style={{ fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 }}>{result.judged.title}</T>
                  <T tone="muted">Règle appliquée : {CERTAINTY_CRITERIA[level]}</T>
                  {result.judged.conclusion && (
                    <AiReading label="Conclusion rédigée par l’IA">
                      <T>{result.judged.conclusion}</T>
                    </AiReading>
                  )}
                  {judgedId && (
                    <Pressable
                      accessibilityRole="link"
                      hitSlop={8}
                      onPress={() => router.push({ pathname: "/case/[id]", params: { id: judgedId } })}
                      style={[styles.row, { gap: 6, alignSelf: "flex-start" }]}
                    >
                      <T style={{ fontFamily: fonts.semibold, textDecorationLine: "underline" }}>Voir les preuves</T>
                      <CaretRight size={16} color={c.foreground} />
                    </Pressable>
                  )}
                </VerdictPanel>
              ) : (
                <T>{result.judged.title}</T>
              )}
            </Section>
          ) : (
            <View style={{ borderWidth: 1, borderColor: c.border, backgroundColor: c.card, borderRadius: radius.card, padding: 14 }}>
              <T tone="muted">Aucune affaire jugée ne ressemble à ce message. Cela ne veut dire ni vrai ni faux : ouvrez une enquête pour retrouver ses versions.</T>
            </View>
          )}

          <WarningSigns signals={result.signals} />
          <PublishedChecks checks={result.factChecks} />
          <Button
            label="Envoyer dans une enquête"
            icon={Graph}
            variant="outline"
            onPress={() => router.navigate({ pathname: "/cases", params: { information: result.text } })}
          />
        </>
      )}
    </>
  );
}
