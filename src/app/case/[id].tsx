import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Share, View } from "react-native";

import { AssistantButton } from "@/components/assistant-button";
import { FactCheckPanel, WebSearch } from "@/features/case-tools";
import { ApiError, type CaseFile, CERTAINTY_LABELS, formatDate, post, type Seal, type WhatIf } from "@/lib/api";
import {
  CASE_KIND_LABELS,
  CERTAINTY_CRITERIA,
  CHANGE_TYPE_LABELS,
  EVIDENCE_STANCE_LABELS,
  EVIDENCE_STRENGTH_LABELS,
  MATCH_KIND_LABELS,
  SOURCE_KIND_LABELS,
  SOURCE_KIND_TONES,
} from "@/lib/domain";
import { SealCheck, ShareNetwork, Sparkle } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/use-api";
import { AiReading } from "@/ui/ai-reading";
import { Photo } from "@/ui/photo";
import { QrCode } from "@/ui/qr-code";
import { Button, Card, CertaintyBadge, Loading, Notice, Quote, Screen, Section, T, ToneTag, VerdictPanel, styles } from "@/ui/ui";
import { WarningSigns } from "@/ui/warning-signs";

type Stance = keyof typeof EVIDENCE_STANCE_LABELS;
type SourceKind = keyof typeof SOURCE_KIND_LABELS;

/** Comme sur le site (EVIDENCE_STANCE_TONES) : confirme en vert, contredit en rouge, contexte neutre. */
function stanceColors(c: ReturnType<typeof useTheme>, stance: Stance) {
  if (stance === "supports") return { bg: c.verdict.true.soft, fg: c.verdict.true.ink };
  if (stance === "contradicts") return { bg: c.verdict.false.soft, fg: c.verdict.false.ink };
  return { bg: c.muted, fg: c.mutedForeground };
}

/** Le type de la source (vérificateur, presse, réseau social…) : un indice, pas un verdict. */
function SourceKindTag({ kind }: { kind?: SourceKind }) {
  if (!kind || kind === "unknown") return null;
  return <ToneTag label={SOURCE_KIND_LABELS[kind]} tone={SOURCE_KIND_TONES[kind]} />;
}

/** Le texte partagé avec la carte : le même que celui du site (shareText de ShareCard). */
function shareText(file: CaseFile, seal: Seal | null) {
  if (!file.certainty) return "";
  return [
    `Information vérifiée : « ${file.claim} »`,
    `Conclusion : ${CERTAINTY_LABELS[file.certainty]}.`,
    file.conclusion ?? "",
    "Analyse assistée par IA, à partir des pièces du dossier. Vérifiez avant de partager.",
    ...(seal ? [`Sceau ${seal.code} · vérifier l’authenticité : ${seal.url}`] : []),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Le sceau de la conclusion : un code et un QR qui renvoient à la conclusion signée. Celui qui
 * reçoit la carte vérifie qu'elle n'a pas été retouchée (Scan, puis Sceau, ou le site). Le même
 * bloc que le dossier sur le site. */
function SealCard({ file }: { file: CaseFile }) {
  const router = useRouter();
  const c = useTheme();
  const { data: seal } = useApi<Seal | null>(`/cases/${file.id}/seal`);
  if (!seal || !file.certainty) return null;
  function share() {
    Share.share({ message: shareText(file, seal ?? null), url: seal?.url, title: "Conclusion Vyra" }).catch(() => null);
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
      <Button label="Vérifier un sceau reçu" variant="ghost" onPress={() => router.push({ pathname: "/scan", params: { onglet: "sceau" } })} />
    </Card>
  );
}

/** Le dossier d'une affaire, dans l'ordre de la page du site : la conclusion et son sceau, les
 * signes d'alerte, la recherche presse, les versions retrouvées, les vérifications publiées,
 * What If ?, les pièces. Sans le tribunal, qui reste sur le site. */
export default function CaseScreen() {
  const { id, retrouvee, pourquoi, nouvelle } = useLocalSearchParams<{ id: string; retrouvee?: string; pourquoi?: string; nouvelle?: string }>();
  const c = useTheme();
  const { data, error, isLoading, mutate } = useApi<CaseFile>(`/cases/${id}`);
  const [whatIf, setWhatIf] = useState<WhatIf | null>(null);
  const [busy, setBusy] = useState(false);
  const [whatIfError, setWhatIfError] = useState<string | null>(null);
  const matchKind = retrouvee && retrouvee in MATCH_KIND_LABELS ? (retrouvee as keyof typeof MATCH_KIND_LABELS) : null;

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
    <View style={{ flex: 1 }}>
      <Screen>
        {isLoading && <Loading />}
        {error && <Notice tone="error">{error.message}</Notice>}
        {data && (
          <>
            <View style={{ gap: 12 }}>
              <T tone="label">Affaire</T>
              <T tone="title">{data.title}</T>
              <Quote>{data.claim}</Quote>
              <CertaintyBadge level={data.certainty} status={data.status} />
              {data.kind === "fictional" && <T tone="muted">{CASE_KIND_LABELS.fictional}</T>}
            </View>

            {retrouvee && (
              <Card>
                <T style={{ fontFamily: fonts.bold }}>Cette information est déjà dans un dossier</T>
                <T>Le texte analysé rejoint une affaire connue. Voici ses versions retrouvées.</T>
                {matchKind && <ToneTag label={MATCH_KIND_LABELS[matchKind]} tone={matchKind === "ai" ? "success" : "neutral"} />}
                {pourquoi ? <T>« {pourquoi} »</T> : null}
              </Card>
            )}
            {nouvelle && (
              <Card>
                <T style={{ fontFamily: fonts.bold }}>Nouvelle affaire ouverte</T>
                <T>Aucune affaire proche dans la base : le texte reçu est la première version du dossier. La plateforme cherche maintenant d’autres versions dans la presse.</T>
              </Card>
            )}

            {data.certainty && (
              <>
                <VerdictPanel level={data.certainty}>
                  <T tone="muted">Règle appliquée, calculée sur les pièces sans IA : {CERTAINTY_CRITERIA[data.certainty]}</T>
                  {data.conclusion ? (
                    <AiReading label="Conclusion rédigée par l’IA">
                      <T>{data.conclusion}</T>
                    </AiReading>
                  ) : null}
                </VerdictPanel>
                {data.conclusion ? <SealCard file={data} /> : null}
              </>
            )}

            {data.signals && <WarningSigns signals={data.signals} />}

            <WebSearch caseId={data.id} autoStart={data.versions.length === 1} onFound={() => mutate()} />

            {data.versions.length > 0 && (
              <Section
                title={`Propagation : ${data.versions.length - 1} ${data.versions.length - 1 > 1 ? "sources retrouvées" : "source retrouvée"}`}
                note="Dans l’ordre où elles ont circulé, avec ce que chacune change. Faites défiler de côté."
              >
                {/* Les versions se lisent côte à côte : une rangée qui défile, pas une pile. */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                  {data.versions.map((version) => {
                    const link = data.links?.find((item) => item.toVersionId === version.id);
                    return (
                      <View key={version.id} style={{ width: 268, backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: radius.card, overflow: "hidden" }}>
                        {version.imagePath ? <Photo uri={version.imagePath} ratio={16 / 10} /> : null}
                        <View style={{ padding: 14, gap: 6 }}>
                          <T tone="tabular" style={{ fontSize: 12, color: c.mutedForeground }}>
                            Version {String(version.position).padStart(2, "0")}
                            {version.publishedAt ? ` · ${formatDate(version.publishedAt)}` : ""}
                          </T>
                          <T style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{version.sourceName}</T>
                          <SourceKindTag kind={version.sourceKind} />
                          {link && <ToneTag label={CHANGE_TYPE_LABELS[link.changeType]} tone={link.changeType === "contradicts" || link.changeType === "figure_changed" || link.changeType === "tone_hardened" ? "warning" : "neutral"} />}
                          <T numberOfLines={version.imagePath ? 4 : 8}>{version.content}</T>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </Section>
            )}

            <FactCheckPanel caseId={data.id} onAdded={() => mutate()} />

            <Section
              title="What If ?"
              note={
                data.kind === "fictional"
                  ? "Une même histoire racontée de trois façons : fidèle, alarmiste, trompeuse. À vous de repérer ce qui change."
                  : "Et si cette information avait été dite calmement ? Les mêmes faits, sans l’alarme ni l’appel à partager."
              }
            >
              <Button
                label={busy ? "L’IA réécrit…" : whatIf ? "Réécrire autrement" : data.kind === "fictional" ? "Voir les trois versions" : "Voir la version calme"}
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

            {data.evidence.length > 0 && (
              <Section title="Pièces du dossier">
                {data.evidence.map((piece) => (
                  <Card key={piece.id}>
                    <T style={{ fontFamily: fonts.bold }}>
                      Pièce n° {piece.number} · {piece.title}
                    </T>
                    <View style={styles.wrap}>
                      <View style={{ borderRadius: radius.tag, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: stanceColors(c, piece.stance).bg }}>
                        <T style={{ fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: stanceColors(c, piece.stance).fg }}>{EVIDENCE_STANCE_LABELS[piece.stance]}</T>
                      </View>
                      <ToneTag label={EVIDENCE_STRENGTH_LABELS[piece.strength]} tone="neutral" />
                      <SourceKindTag kind={piece.sourceKind} />
                    </View>
                    <T>{piece.content}</T>
                    <T tone="muted">
                      {piece.sourceName}
                      {piece.publishedAt ? ` · ${formatDate(piece.publishedAt)}` : ""}
                    </T>
                  </Card>
                ))}
              </Section>
            )}
          </>
        )}
      </Screen>
      <AssistantButton />
    </View>
  );
}
