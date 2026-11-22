import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

import { ApiError, caseIdFrom, type Certainty, CERTAINTY_LABELS, type Check, post } from "@/lib/api";
import { ArrowSquareOut, CaretRight, MagnifyingGlass, SealCheck } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { Button, Field, Notice, Screen, Section, Step, T, ToneTag, VerdictPanel, styles } from "@/ui/ui";

const LONE_URL = /^https?:\/\/\S+$/i;
/** Les trois endroits où Vyra cherche, dans l'ordre. */
const LAYERS = ["Affaires jugées par le tribunal", "Signes d’alerte dans les mots", "Vérifications déjà publiées"];

/** Le libellé renvoyé par la plateforme, retrouvé parmi les conclusions du juge (pour la couleur et l'icône). */
function certaintyOf(label: string): Certainty | null {
  const found = (Object.entries(CERTAINTY_LABELS) as [Certainty, string][]).find(([, word]) => word === label);
  return found ? found[0] : null;
}

/** La vérification rapide : un texte ou un lien reçu. Jamais de verdict nouveau, seulement ce qui existe déjà. */
export default function CheckScreen() {
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
  const flagged = result?.signals.filter((signal) => signal.signs.length > 0) ?? [];

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <T tone="title">Vérifier</T>
        <T tone="muted">Un texte reçu ou un lien : Vyra cherche s’il a déjà été jugé et relève les signes d’alerte. Jamais de nouveau verdict.</T>
      </View>
      <Field
        label="Le message ou le lien"
        value={input}
        onChangeText={setInput}
        multiline
        numberOfLines={5}
        placeholder="« URGENT : inondation ce matin… »"
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
            <Section title="Déjà jugée">
              {level ? (
                <VerdictPanel level={level}>
                  <T style={{ fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 }}>{result.judged.title}</T>
                  {result.judged.conclusion && <T>{result.judged.conclusion}</T>}
                  {judgedId && (
                    <Pressable
                      accessibilityRole="link"
                      hitSlop={8}
                      onPress={() => router.push({ pathname: "/case/[id]", params: { id: judgedId } })}
                      style={[styles.row, { gap: 6, alignSelf: "flex-start" }]}
                    >
                      <T style={{ fontFamily: fonts.semibold, textDecorationLine: "underline" }}>Voir le dossier</T>
                      <CaretRight size={16} color={c.foreground} />
                    </Pressable>
                  )}
                </VerdictPanel>
              ) : (
                <T>{result.judged.title}</T>
              )}
            </Section>
          ) : (
            <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: c.foreground, borderRadius: radius.card, padding: 14, gap: 4 }}>
              <T style={{ fontFamily: fonts.bold, fontSize: 17 }}>Pas encore de verdict</T>
              <T tone="muted">Aucune affaire jugée ne ressemble à ce texte. Cela ne veut pas dire qu’il est vrai : ouvrez une enquête depuis le site pour le faire juger.</T>
            </View>
          )}

          {/* « Ce qui doit vous alerter » : relevé dans les mots, sans IA ; cela ne dit rien de la vérité. */}
          <View style={{ borderWidth: 2, borderColor: c.foreground, borderRadius: radius.card, backgroundColor: c.card, padding: 14, gap: 10 }}>
            <T style={{ fontFamily: fonts.bold, fontSize: 18 }}>Ce qui doit vous alerter</T>
            <View style={styles.wrap}>
              {result.signals.map((signal) => (
                <ToneTag key={signal.label} label={signal.label} tone={signal.tone} />
              ))}
            </View>
            {flagged.length === 0 ? (
              <T tone="muted">Aucun signe relevé dans les mots.</T>
            ) : (
              flagged.flatMap((signal) =>
                signal.signs.map((sign) => (
                  <T key={`${signal.label}-${sign.label}-${sign.quote}`}>
                    <Text style={{ fontFamily: fonts.semibold }}>{sign.label}</Text>
                    {"  "}
                    <Text style={{ fontFamily: fonts.quote, fontSize: 18 }}>« {sign.quote} »</Text>
                  </T>
                )),
              )
            )}
            <T tone="muted" style={{ fontSize: 13 }}>
              Relevé dans les mots, sans IA : ces signes ne disent pas si l’information est vraie.
            </T>
          </View>

          {result.factChecks.length > 0 && (
            <Section title="Déjà vérifiée ailleurs" note="Relayé tel quel, avec les mots du vérificateur.">
              {result.factChecks.map((check, index) => (
                <View key={`${check.url ?? ""}${index}`} style={{ borderWidth: 2, borderColor: c.foreground, borderRadius: radius.card, backgroundColor: c.card, padding: 14, gap: 8 }}>
                  <View style={[styles.row, { gap: 8 }]}>
                    <SealCheck size={20} color={c.foreground} />
                    <T style={{ fontFamily: fonts.semibold, flex: 1 }}>{check.publisher ?? "Vérificateur"}</T>
                  </View>
                  {check.title && <T style={{ fontSize: 17, lineHeight: 24 }}>{check.title}</T>}
                  {check.rating && <T style={{ fontFamily: fonts.bold, fontSize: 17 }}>« {check.rating} »</T>}
                  {check.url && (
                    <Pressable accessibilityRole="link" hitSlop={8} onPress={() => check.url && Linking.openURL(check.url)} style={[styles.row, { gap: 6, alignSelf: "flex-start" }]}>
                      <T style={{ fontFamily: fonts.semibold, textDecorationLine: "underline" }}>Lire la vérification</T>
                      <ArrowSquareOut size={16} color={c.foreground} />
                    </Pressable>
                  )}
                </View>
              ))}
            </Section>
          )}
        </>
      )}
    </Screen>
  );
}
