import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";

import { ApiError, formatDate, type LinkView, type Opened, post, type Signal } from "@/lib/api";
import { ArrowSquareOut, Clock, FileText, Graph, Link } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { AiReading } from "@/ui/ai-reading";
import { PublishedChecks } from "@/ui/published-checks";
import { Button, Card, Field, Notice, Step, T, ToneTag, styles } from "@/ui/ui";
import { WarningSigns } from "@/ui/warning-signs";

import { SourceNote } from "./scan-parts";

// Au-delà, une publication qui circule de nouveau est un piège courant (OLD_CONTENT_DAYS du site).
const OLD_CONTENT_DAYS = 30;

type LinkResult = LinkView & { signals?: Signal[] };

function Age({ view }: { view: LinkView }) {
  if (!view.publishedAt || view.daysOld === null) {
    return <T tone="muted">Date de publication introuvable : vérifiez-la sur la page elle-même.</T>;
  }
  const old = view.daysOld > OLD_CONTENT_DAYS;
  return (
    <View style={{ gap: 6 }}>
      <ToneTag label={`Publié le ${formatDate(view.publishedAt)}`} tone={old ? "warning" : "neutral"} />
      {old && <T tone="muted">Il y a {view.daysOld} jours : une vieille publication qui circule de nouveau est un piège courant.</T>}
    </View>
  );
}

/** Ce que dit la page : son âge, ses affirmations (relevées par l'IA, mot pour mot), son ton, ce
 * qu'en disent déjà les vérificateurs, puis l'enquête à ouvrir. Jamais de verdict. */
function Result({ view }: { view: LinkResult }) {
  const router = useRouter();
  const c = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openCase() {
    setBusy(true);
    setError(null);
    try {
      const { caseId } = await post<Opened>("/cases", { claim: view.mainClaim, sourceUrl: view.url, sourceName: view.site });
      router.push({ pathname: "/case/[id]", params: { id: caseId } });
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 16 }} accessibilityLiveRegion="polite">
      <Card>
        <T tone="muted" style={{ fontSize: 13 }}>
          {view.site}
        </T>
        <T style={{ fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 }}>{view.title || view.url}</T>
        <View style={[styles.row, { gap: 6 }]}>
          <Clock size={16} color={c.mutedForeground} />
          <View style={{ flex: 1 }}>
            <Age view={view} />
          </View>
        </View>
        <Pressable accessibilityRole="link" hitSlop={8} onPress={() => Linking.openURL(view.url)} style={[styles.row, { gap: 6, alignSelf: "flex-start" }]}>
          <T style={{ fontFamily: fonts.semibold, textDecorationLine: "underline" }}>Ouvrir la page</T>
          <ArrowSquareOut size={16} color={c.foreground} />
        </Pressable>
      </Card>

      <AiReading label="Ce que la page affirme, relevé par l’IA">
        <View style={[styles.row, { gap: 8 }]}>
          <FileText size={20} color={c.foreground} />
          <T style={{ fontFamily: fonts.semibold, fontSize: 17 }}>Ce que la page affirme</T>
        </View>
        {view.mainClaim ? <T>{view.mainClaim}</T> : null}
        {view.claims.length > 0 ? (
          view.claims.map((claim) => (
            <T key={claim} style={{ fontFamily: fonts.quote, fontSize: 18, lineHeight: 24 }}>
              « {claim} »
            </T>
          ))
        ) : (
          <T tone="muted">Aucune phrase vérifiable relevée mot pour mot dans la page.</T>
        )}
        <SourceNote source={view.aiSource} />
      </AiReading>

      {view.signals && <WarningSigns signals={view.signals} title="Signes d’alerte dans la page" />}

      {view.searched ? (
        <PublishedChecks checks={view.factChecks} title="Déjà vérifiée ailleurs ?" empty="Aucune vérification publiée trouvée. Cela ne prouve rien." />
      ) : (
        <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: radius.card, padding: 14 }}>
          <T tone="muted">Recherche impossible pour le moment.</T>
        </View>
      )}

      {view.mainClaim.length >= 15 && <Button label="Ouvrir l’enquête sur cette information" icon={Graph} busy={busy} onPress={openCase} />}
      {error && <Notice tone="error">{error}</Notice>}
    </View>
  );
}

/** Le scan d'un lien reçu, comme l'onglet « Lien » du site. */
export function LinkScan() {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [askText, setAskText] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<LinkResult | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setView(null);
    try {
      const result = await post<LinkResult>("/scan/link", { url: url.trim(), text: text.trim() || undefined });
      if (result.needsText) setAskText(true);
      else setView(result);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!view && !busy && (
        <T tone="muted">
          Collez le lien d’un article ou d’une publication : ce qu’il affirme, sa date, son ton, et si des vérificateurs l’ont déjà traité. Le scan relève des indices, il ne rend jamais de verdict.
        </T>
      )}
      <Field label="Lien reçu" value={url} onChangeText={setUrl} placeholder="https://…" keyboardType="url" autoCapitalize="none" autoCorrect={false} />
      {askText && (
        <>
          <T tone="muted">Cette page ne se lit pas de l’extérieur (Facebook, TikTok, site protégé…). Collez ici le texte de la publication.</T>
          <Field label="Texte de la publication" value={text} onChangeText={setText} multiline numberOfLines={5} style={{ minHeight: 120 }} />
        </>
      )}
      <Button label={busy ? "Lecture du lien…" : "Analyser le lien"} icon={Link} busy={busy} disabled={!/^https?:\/\/\S+/i.test(url.trim())} onPress={run} />
      {busy && (
        <Card>
          <Step label="Lecture de la page, puis recherche…" state="running" />
        </Card>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {view && !busy && <Result view={view} />}
    </>
  );
}
