import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { ApiError, type CaseFile, post, type WhatIf } from "@/lib/api";
import { Sparkle } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/use-api";
import { Photo } from "@/ui/photo";
import { Button, Card, CertaintyBadge, Loading, Notice, Quote, Screen, Section, T, VerdictPanel, styles } from "@/ui/ui";

const STANCE = { supports: "Appuie", contradicts: "Contredit", context: "Contexte" } as const;

function stanceColors(c: ReturnType<typeof useTheme>, stance: keyof typeof STANCE) {
  if (stance === "supports") return { bg: c.verdict.true.soft, fg: c.verdict.true.ink };
  if (stance === "contradicts") return { bg: c.verdict.false.soft, fg: c.verdict.false.ink };
  return { bg: c.muted, fg: c.mutedForeground };
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
            <VerdictPanel level={data.certainty}>{data.conclusion ? <T>{data.conclusion}</T> : null}</VerdictPanel>
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
            {whatIf?.versions.map((version) => (
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
            {whatIf?.takeaway ? <T style={{ fontFamily: fonts.semibold }}>{whatIf.takeaway}</T> : null}
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
