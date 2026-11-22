import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";

import { ApiError, formatSecond, type PickedFile, post, type ScanView, upload } from "@/lib/api";
import { shareDataUrl } from "@/lib/files";
import { FileText, FilmStrip, PaperPlaneTilt, ShareNetwork, Waveform } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/use-api";
import { AiReading } from "@/ui/ai-reading";
import { Button, Card, CertaintyBadge, Loading, Notice, Quote, Step, T, styles } from "@/ui/ui";

import { AddToCase, Bullets, FactStep, FilePicker, Outcome, ReverseSearch, SourceNote } from "./scan-parts";

const DEMOS = [{ label: "Vidéo reçue par message", path: "/demo/video-coupure-eau.mp4", type: "video/mp4" }];

/** Quatre images tirées de la vidéo, visages floutés, à chercher sur le web. */
function Keyframes({ scan }: { scan: ScanView }) {
  const c = useTheme();
  const [error, setError] = useState<string | null>(null);
  const frames = scan.frames ?? [];
  if (frames.length === 0) return <T tone="muted">Aucune image n’a pu être tirée de la vidéo.</T>;
  const blurred = frames.reduce((total, frame) => total + frame.facesBlurred, 0);
  const base = scan.fileName.replace(/\.[^.]+$/, "") || "video";
  return (
    <>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 }}>
        {frames.map((frame) => (
          <Pressable
            key={frame.second}
            accessibilityRole="button"
            accessibilityLabel={`Partager l’image à ${formatSecond(frame.second)}`}
            onPress={() => shareDataUrl(frame.dataUrl, `${base}-${formatSecond(frame.second).replace(":", "m")}s.jpg`).catch((e: Error) => setError(e.message))}
            style={({ pressed }) => ({ width: "48%", gap: 4, opacity: pressed ? 0.8 : 1 })}
          >
            <Image source={{ uri: frame.dataUrl }} accessibilityLabel={`La vidéo à ${formatSecond(frame.second)}, visages floutés`} style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: c.muted }} />
            <View style={[styles.row, { gap: 4 }]}>
              <ShareNetwork size={14} color={c.mutedForeground} />
              <T tone="muted" style={{ fontSize: 13 }}>
                à {formatSecond(frame.second)}
              </T>
            </View>
          </Pressable>
        ))}
      </View>
      <T tone="muted">
        Images protégées : {blurred === 0 ? "aucun visage repéré" : `${blurred} visage${blurred > 1 ? "s floutés" : " flouté"}`}, sans information cachée. Touchez-en une pour la partager, puis déposez-la sur l’un de ces services : la page la plus ancienne qui la montre dit souvent d’où vient la vidéo. Aucun résultat ne prouve rien.
      </T>
      <ReverseSearch />
      {error && <Notice tone="error">{error}</Notice>}
    </>
  );
}

/** Ce que dit le son (bande son d'une vidéo, ou vocal), transcrit par l'IA, l'affaire déjà jugée
 * qui lui ressemble, et l'enquête à ouvrir. */
export function Soundtrack({ scan, title = "4. La bande son, transcrite par l’IA", where = "Dans la vidéo" }: { scan: ScanView; title?: string; where?: string }) {
  const router = useRouter();
  const c = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { transcript, judged } = scan;
  if (!transcript) {
    return (
      <FactStep icon={Waveform} title={title}>
        <T tone="muted">{scan.kind === "audio" ? "L’IA ne répond pas et ce vocal n’a pas de réponse préparée. Vérifiez l’IA, puis réessayez." : "Pas de parole transcrite dans cette vidéo."}</T>
      </FactStep>
    );
  }

  async function openCase() {
    setBusy(true);
    setError(null);
    try {
      const { caseId } = await post<{ caseId: string }>(`/scans/${scan.id}/open-case`);
      router.push({ pathname: "/case/[id]", params: { id: caseId } });
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AiReading title={title} label="Transcription par l’IA">
        <T tone="muted" style={{ fontSize: 13 }}>
          {where}{transcript.language ? ` · ${transcript.language}` : ""}
        </T>
        <Quote>{transcript.transcript}</Quote>
        {transcript.translation ? <T tone="muted">Traduction : {transcript.translation}</T> : null}
        <View style={{ gap: 4, padding: 12, borderRadius: 14, backgroundColor: c.muted }}>
          <T style={{ fontFamily: fonts.semibold }}>L’information à vérifier</T>
          <T>{transcript.claim || transcript.transcript}</T>
        </View>
      </AiReading>
      {judged && (
        <Card style={{ borderWidth: 2 }}>
          <T style={{ fontFamily: fonts.semibold, fontSize: 14 }}>Déjà jugé</T>
          <T style={{ fontFamily: fonts.bold, fontSize: 17 }}>{judged.title}</T>
          <CertaintyBadge level={judged.certainty} />
          <Button label="Voir le dossier" variant="outline" onPress={() => router.push({ pathname: "/case/[id]", params: { id: judged.id } })} />
        </Card>
      )}
      <Button label="Envoyer dans une enquête" icon={PaperPlaneTilt} variant={judged ? "outline" : "primary"} busy={busy} onPress={openCase} />
      {error && <Notice tone="error">{error}</Notice>}
    </>
  );
}

function Result({ scan }: { scan: ScanView }) {
  const { report, reading, outcome } = scan;
  return (
    <View style={{ gap: 14 }} accessibilityLiveRegion="polite">
      {outcome && <Outcome outcome={outcome} />}
      <FactStep icon={FileText} title="1. Ce que dit le fichier">
        {report ? <Bullets items={report.findings} /> : <T tone="muted">Le fichier n’a pas pu être lu.</T>}
      </FactStep>
      <FactStep icon={FilmStrip} title="2. Images clés">
        <Keyframes scan={scan} />
      </FactStep>
      <AiReading title="3. Lecture par l’IA" label="Lecture des images par l’IA">
        {reading?.description ? <T>{reading.description}</T> : null}
        {reading && reading.observations.length > 0 ? <Bullets items={reading.observations} /> : <T tone="muted">{reading ? "Aucune bizarrerie visible relevée." : "L’IA n’a pas lu ces images."}</T>}
        {reading?.textInImage ? <T>Texte dans la vidéo : « {reading.textInImage} »</T> : null}
        <T tone="muted" style={{ fontSize: 13 }}>
          L’IA a lu les images protégées et la bande son, jamais la vidéo d’origine.
        </T>
        <SourceNote source={scan.aiSource} />
      </AiReading>
      <Soundtrack scan={scan} />
      <AddToCase scanId={scan.id} />
    </View>
  );
}

/** Le scan d'une vidéo : ce qu'elle déclare, quatre images clés protégées, leur lecture, la bande son. */
export function VideoScan() {
  const c = useTheme();
  const caps = useApi<{ video: boolean }>("/scan/capabilities");
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
      setResult(await upload<ScanView>("/scan/video", picked));
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  if (caps.isLoading) return <Loading />;
  if (caps.data && !caps.data.video) {
    return (
      <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: c.foreground, borderRadius: radius.card, padding: 14 }}>
        <T tone="muted">L’examen des vidéos n’est pas disponible sur ce serveur : il demande ffmpeg à côté du service d’analyse. Les autres examens fonctionnent normalement.</T>
      </View>
    );
  }

  return (
    <>
      <T tone="muted">Ce que le fichier déclare, quatre images clés (visages floutés) à chercher sur le web, la lecture de ces images par l’IA et la transcription de la bande son. La vidéo d’origine ne part nulle part ailleurs.</T>
      <FilePicker kind="videos" busy={busy} demos={DEMOS} onFile={analyze} />
      {file && !busy && !result && !error && <T tone="muted">{file.name}</T>}
      {busy && (
        <Card>
          <Step label={`Examen de ${file?.name ?? "la vidéo"} : images clés, lecture, bande son`} state="running" />
        </Card>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {result && !busy && <Result scan={result} />}
    </>
  );
}
