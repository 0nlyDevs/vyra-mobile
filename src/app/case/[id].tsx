import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Share, View } from "react-native";

import { ApiError, type CaseFile, CERTAINTY_LABELS, post, type Seal, type WhatIf } from "@/lib/api";
import { SealCheck, ShareNetwork, Sparkle } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/use-api";
import { AiReading } from "@/ui/ai-reading";
import { Photo } from "@/ui/photo";
import { QrCode } from "@/ui/qr-code";
import { Button, Card, CertaintyBadge, Loading, Notice, Quote, Screen, Section, T, VerdictPanel, styles } from "@/ui/ui";

const STANCE = { supports: "Appuie", contradicts: "Contredit", context: "Contexte" } as const;

function stanceColors(c: ReturnType<typeof useTheme>, stance: keyof typeof STANCE) {
  if (stance === "supports") return { bg: c.verdict.true.soft, fg: c.verdict.true.ink };
  if (stance === "contradicts") return { bg: c.verdict.false.soft, fg: c.verdict.false.ink };
  return { bg: c.muted, fg: c.mutedForeground };
}

/** Le sceau de la conclusion : un code et un QR qui renvoient à la conclusion signée. Celui qui
 * reçoit la carte vérifie qu'elle n'a pas été retouchée (Vérifier, puis Sceau, ou le site). */
function SealCard({ file }: { file: CaseFile }) {
  const router = useRouter();
  const c = useTheme();
  const { data: seal } = useApi<Seal | null>(`/cases/${file.id}/seal`);
  if (!seal || !file.certainty) return null;
  const certainty = file.certainty;
  function share() {
    const text = [`« ${file.claim} »`, `Conclusion du tribunal Vyra : ${CERTAINTY_LABELS[certainty]}.`, file.conclusion ?? "", `Sceau ${seal?.code}, à vérifier : ${seal?.url}`].filter(Boolean).join("\n\n");
    Share.share({ message: text, url: seal?.url, title: "Conclusion du tribunal Vyra" }).catch(() => null);
  }
  return (
    <Card>
      <View style={[styles.row, { gap: 8 }]}>
        <SealCheck size={20} color={c.foreground} />
        <T accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 17, flex: 1 }}>
          Sceau de la conclusion
        </T>
      </View>
      <View style={{ flexDirection: "row", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <View style={{ borderRadius: 12, overflow: "hidden" }}>
          <QrCode value={seal.url} size={132} label={`QR du sceau ${seal.code}`} />
        </View>
        <View style={{ flex: 1, minWidth: 150, gap: 6 }}>
          <T selectable tone="tabular" style={{ fontSize: 20, letterSpacing: 1 }}>
            {seal.code}
          </T>
          <T tone="muted">Partagée avec ce code, la conclusion se vérifie mot pour mot : une carte retouchée ne le passe pas.</T>
        </View>
      </View>
      <Button label="Partager la conclusion scellée" icon={ShareNetwork} variant="outline" onPress={share} />
      <Button label="Vérifier un sceau reçu" variant="ghost" onPress={() => router.push({ pathname: "/check", params: { mode: "seal" } })} />
    </Card>
  );
}

/** Le dossier d'une affaire : la conclusion, What If ?, les versions retrouvées, les pièces. */
export default function CaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useTheme();
  const { data, error, isLoading } = useApi<CaseFile>(`/cases/${id}`);
  const [whatIf, setWhatIf] = useState<WhatIf | null>(null);
  const [busy, setBusy] = useState(false);
  const [whatIfError, setWhatIfError] = useState<string | null>(null);

  async function runWhatIf() {
    setBusy(true);
    setWhatIfError(null);
    try {
      setWhatIf(await post<WhatIf>(`/cases/${id}/what-if`));
    } catch (e) {
      setWhatIfError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      {isLoading && <Loading />}
      {error && <Notice tone="error">{error.message}</Notice>}
      {data && (
        <>
          <View style={{ gap: 12 }}>
            {!data.certainty && <CertaintyBadge level={null} />}
            <T tone="title">{data.title}</T>
            <Quote>{data.claim}</Quote>
            {data.kind === "fictional" && <T tone="muted">Affaire d’exercice</T>}
          </View>

          {data.certainty && (
            <>
              <VerdictPanel level={data.certainty}>
                <T tone="muted">Règle appliquée, calculée sur les pièces sans IA.</T>
                {data.conclusion ? (
                  <AiReading label="Conclusion rédigée par l’IA">
                    <T>{data.conclusion}</T>
                  </AiReading>
                ) : null}
              </VerdictPanel>
              <SealCard file={data} />
            </>
          )}

          <Section
            title="What If ?"
            note={
              data.kind === "fictional"
                ? "La même histoire racontée de trois façons : fidèle, alarmiste, trompeuse."
                : "Et si cette information avait été dite calmement ? Les mêmes faits, sans l’alarme."
            }
          >
            <Button
              label={whatIf ? "Réécrire autrement" : data.kind === "fictional" ? "Voir les trois versions" : "Voir la version calme"}
              icon={Sparkle}
              variant="outline"
              busy={busy}
              onPress={runWhatIf}
            />
            {whatIfError && <Notice tone="error">{whatIfError}</Notice>}
            {whatIf && (
              <AiReading label="Versions réécrites par l’IA">
                {whatIf.versions.map((version) => (
                  <Card key={version.id}>
                    <T style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{version.label}</T>
                    <T>{version.text}</T>
                    {version.changes.map((change) => (
                      <T key={change} tone="muted">
                        • {change}
                      </T>
                    ))}
                  </Card>
                ))}
                {whatIf.takeaway ? <T style={{ fontFamily: fonts.semibold }}>{whatIf.takeaway}</T> : null}
              </AiReading>
            )}
          </Section>

          {data.versions.length > 0 && (
            <Section title="Versions retrouvées" note="Dans l’ordre où elles ont circulé. Faites défiler de côté.">
              {/* Les versions se lisent côte à côte : une rangée qui défile, pas une pile. */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                {data.versions.map((version) => (
                  <View key={version.id} style={{ width: 268, backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: radius.card, overflow: "hidden" }}>
                    {version.imagePath ? <Photo uri={version.imagePath} ratio={16 / 10} /> : null}
                    <View style={{ padding: 14, gap: 6 }}>
                      <T tone="tabular" style={{ fontSize: 12, color: c.mutedForeground }}>
                        Version {String(version.position).padStart(2, "0")}
                      </T>
                      <T style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{version.sourceName}</T>
                      <T numberOfLines={version.imagePath ? 4 : 8}>{version.content}</T>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </Section>
          )}

          {data.evidence.length > 0 && (
            <Section title="Pièces du dossier">
              {data.evidence.map((piece) => (
                <Card key={piece.id}>
                  <View style={[styles.row, { justifyContent: "space-between" }]}>
                    <T tone="tabular" style={{ fontSize: 13, color: c.mutedForeground }}>
                      Pièce n° {piece.number}
                    </T>
                    {/* Comme sur le site (EVIDENCE_STANCE_TONES) : appuie en vert, contredit en rouge, contexte neutre. */}
                    <View style={{ borderRadius: radius.tag, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: stanceColors(c, piece.stance).bg }}>
                      <T style={{ fontFamily: fonts.semibold, fontSize: 13, color: stanceColors(c, piece.stance).fg }}>{STANCE[piece.stance]}</T>
                    </View>
                  </View>
                  <T style={{ fontFamily: fonts.bold }}>{piece.title}</T>
                  <T>{piece.content}</T>
                  <T tone="muted">{piece.sourceName}</T>
                </Card>
              ))}
            </Section>
          )}
        </>
      )}
    </Screen>
  );
}
