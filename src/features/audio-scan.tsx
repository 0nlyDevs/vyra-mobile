import { useState } from "react";

import { ApiError, type PickedFile, type ScanView, upload } from "@/lib/api";
import { Card, Notice, Step, T } from "@/ui/ui";

import { FilePicker } from "./scan-parts";
import { Soundtrack } from "./video-scan";

const DEMOS = [{ label: "Vocal reçu de Tantine", path: "/demo/vocal-coupure-eau.wav", type: "audio/wav" }];

/** Le scan d'un vocal, comme l'onglet « Vocal » du site : la transcription par l'IA, l'information
 * à vérifier, l'affaire déjà jugée qui lui ressemble, puis l'enquête à ouvrir. */
export function AudioScan() {
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
      setResult(await upload<ScanView>("/scan/audio", picked));
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <T tone="muted">Le vocal est transcrit, l’information principale est extraite, puis comparée aux affaires déjà jugées. On peut ensuite l’envoyer dans une enquête.</T>
      <FilePicker kind="audio" busy={busy} demos={DEMOS} onFile={analyze} />
      {busy && (
        <Card>
          <Step label={`Transcription de ${file?.name ?? "ce vocal"}…`} state="running" />
        </Card>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {result && !busy && <Soundtrack scan={result} title="Ce que dit le vocal, transcrit par l’IA" where="Dans le vocal" />}
    </>
  );
}
