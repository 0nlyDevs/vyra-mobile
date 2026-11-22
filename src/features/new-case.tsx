import { useRouter } from "expo-router";
import { useState } from "react";

import { ApiError, type Opened, post } from "@/lib/api";
import { Graph } from "@/lib/icons";
import { fonts } from "@/lib/theme";
import { Button, Card, Field, Notice, T } from "@/ui/ui";

/** « Nouvelle analyse », comme sur la page Enquêtes du site : l'information reçue (et son lien),
 * puis le dossier, retrouvé s'il existe déjà, ouvert sinon. `initial` : un texte envoyé par le
 * scan, l'assistant ou le fil ; l'écran donne une `key` qui recrée le formulaire à chaque nouveau texte. */
export function NewCase({ initial = "", initialUrl = "" }: { initial?: string; initialUrl?: string }) {
  const router = useRouter();
  const [claim, setClaim] = useState(initial.slice(0, 2000));
  const [url, setUrl] = useState(initialUrl.slice(0, 2000));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const opened = await post<Opened>("/cases", { claim: claim.trim(), sourceUrl: url.trim() });
      // Comme le site : le dossier dit s'il a été retrouvé (et comment) ou ouvert.
      const params: { id: string } & Record<string, string> = opened.matchedBy
        ? { id: opened.caseId, retrouvee: opened.matchedBy, ...(opened.reason ? { pourquoi: opened.reason } : {}) }
        : { id: opened.caseId, nouvelle: "1" };
      setClaim("");
      setUrl("");
      router.push({ pathname: "/case/[id]", params });
    } catch (e) {
      const failure = e as ApiError;
      setError(failure.fieldErrors?.claim?.[0] ?? failure.fieldErrors?.sourceUrl?.[0] ?? failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ padding: 16, gap: 12 }}>
      <T accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 20 }}>
        Nouvelle analyse
      </T>
      <Field label="L’information à analyser" value={claim} onChangeText={setClaim} multiline numberOfLines={5} placeholder="Collez ici le message, la publication ou l’article reçu." style={{ minHeight: 120 }} />
      <Field label="Lien où vous l’avez vue (facultatif)" value={url} onChangeText={setUrl} placeholder="https://…" keyboardType="url" autoCapitalize="none" autoCorrect={false} />
      <Button label={busy ? "Recherche des versions…" : "Lancer l’enquête"} icon={Graph} busy={busy} disabled={claim.trim().length < 15} onPress={run} />
      {error && <Notice tone="error">{error}</Notice>}
    </Card>
  );
}
