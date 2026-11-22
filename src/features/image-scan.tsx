import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";

import { ApiError, formatDate, type PickedFile, type ScanView, upload } from "@/lib/api";
import { shareDataUrl } from "@/lib/files";
import { CaretRight, Clock, FileText, ShareNetwork, SealCheck } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { AiReading } from "@/ui/ai-reading";
import { Button, Card, Notice, Step, T, styles } from "@/ui/ui";

import { AddToCase, Bullets, FactStep, FilePicker, Outcome, PickedPreview, ReverseSearch, SourceNote } from "./scan-parts";

const DEMOS = [
  { label: "Photo reçue par message", path: "/demo/inondation-virale.jpg", type: "image/jpeg" },
  { label: "Photo d’origine", path: "/demo/inondation-2019.png", type: "image/png" },
  { label: "Image qui se déclare générée", path: "/demo/image-generee.png", type: "image/png" },
];

function protection(copy: NonNullable<ScanView["safeCopy"]>): string {
  const parts = [
    copy.facesBlurred === 0 ? "aucun visage repéré" : `${copy.facesBlurred} visage${copy.facesBlurred > 1 ? "s floutés" : " flouté"}`,
    copy.metadataRemoved ? "informations cachées retirées (appareil, date, lieu)" : "aucune information cachée à retirer",
  ];
  if (copy.firstFrameOnly) parts.push("première image seulement");
  return parts.join(", ");
}

/** La copie protégée : ce que l'IA a lu, et ce qu'il vaut mieux déposer sur un service de recherche. */
function SafeCopy({ scan }: { scan: ScanView }) {
  const c = useTheme();
  const [error, setError] = useState<string | null>(null);
  const copy = scan.safeCopy;
  if (!copy) return null;
  const name = `${scan.fileName.replace(/\.[^.]+$/, "") || "image"}-protegee.jpg`;
  return (
    <View style={{ gap: 10 }}>
      <Image source={{ uri: copy.dataUrl }} accessibilityLabel="Copie protégée de l’image" resizeMode="contain" style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: radius.card, backgroundColor: c.muted }} />
      <View style={[styles.row, { gap: 6 }]}>
        <SealCheck size={18} color={c.foreground} />
        <T style={{ fontFamily: fonts.semibold }}>Copie protégée</T>
      </View>
      <T tone="muted">{protection(copy)}. Déposez-la plutôt que l’original : les personnes de la photo ne sont pas exposées, et votre téléphone ne se trahit pas.</T>
      <Button
        label="Partager la copie protégée"
        icon={ShareNetwork}
        variant="outline"
        onPress={() => shareDataUrl(copy.dataUrl, name).catch((e: Error) => setError(e.message))}
      />
      {error && <Notice tone="error">{error}</Notice>}
    </View>
  );
}

function Result({ scan }: { scan: ScanView }) {
  const router = useRouter();
  const c = useTheme();
  const { report, alreadySeen, reading, outcome } = scan;
  return (
    <View style={{ gap: 14 }} accessibilityLiveRegion="polite">
      {outcome && <Outcome outcome={outcome} />}

      <FactStep icon={FileText} title="1. Ce que dit le fichier">
        {report ? <Bullets items={report.findings} /> : <T tone="muted">Le fichier n’a pas pu être lu.</T>}
      </FactStep>

      <FactStep icon={Clock} title="2. Déjà vue ?">
        {alreadySeen ? (
          <>
            <T>
              <T style={{ fontFamily: fonts.semibold }}>Oui.</T> Cette image a été publiée le{" "}
              <T style={{ fontFamily: fonts.semibold }}>{alreadySeen.publishedAt ? formatDate(alreadySeen.publishedAt) : "à une date inconnue"}</T> par {alreadySeen.sourceName}, dans l’affaire « {alreadySeen.caseTitle} ».
            </T>
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => router.push({ pathname: "/case/[id]", params: { id: alreadySeen.caseId } })}
              style={[styles.row, { gap: 6, alignSelf: "flex-start" }]}
            >
              <T style={{ fontFamily: fonts.semibold, textDecorationLine: "underline" }}>Ouvrir l’affaire</T>
              <CaretRight size={16} color={c.foreground} />
            </Pressable>
          </>
        ) : (
          <T tone="muted">Pas retrouvée parmi les images de nos affaires.</T>
        )}
        <T tone="muted">
          Chercher ailleurs sur le web : déposez {scan.safeCopy ? "la copie protégée" : "l’image"} sur l’un de ces services. La page la plus ancienne qui la montre dit souvent d’où elle vient. Aucun résultat ne prouve rien.
        </T>
        <ReverseSearch />
        <SafeCopy scan={scan} />
      </FactStep>

      <AiReading title="3. Lecture par l’IA" label="Lecture de la copie par l’IA">
        {reading?.description ? <T>{reading.description}</T> : null}
        {reading && reading.observations.length > 0 ? <Bullets items={reading.observations} /> : <T tone="muted">{reading ? "Aucune bizarrerie visible relevée." : "L’IA n’a pas lu cette image."}</T>}
        {reading?.textInImage ? <T>Texte dans l’image : « {reading.textInImage} »</T> : null}
        <T tone="muted" style={{ fontSize: 13 }}>
          {scan.safeCopy ? "L’IA a lu la copie protégée, pas l’original." : "Pas de copie protégée : l’image n’a pas été envoyée à l’IA."}
        </T>
        <SourceNote source={scan.aiSource} />
      </AiReading>

      <AddToCase scanId={scan.id} />
    </View>
  );
}

/** Le scan d'une image : ce que dit le fichier, déjà vue, copie protégée, lecture par l'IA. */
export function ImageScan() {
  const [file, setFile] = useState<PickedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanView | null>(null);

  async function analyze(picked: PickedFile) {
    setFile(picked);
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await upload<ScanView>("/scan/image", picked));
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <T tone="muted">Ce que la photo déclare, si elle a déjà circulé dans nos affaires, une copie protégée (visages floutés, rien de caché) et la lecture de cette copie par l’IA.</T>
      <FilePicker kind="images" busy={busy} demos={DEMOS} onFile={analyze} />
      {file && <PickedPreview uri={file.uri} />}
      {busy && (
        <Card>
          <Step label="Examen du fichier, copie protégée, lecture par l’IA" state="running" />
        </Card>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {result && !busy && <Result scan={result} />}
    </>
  );
}
