import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, View } from "react-native";

import { ApiError, type FactChecks, formatDate, post, type WebSearchResult } from "@/lib/api";
import { ArrowSquareOut, Paperclip, SealCheck } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { Button, Card, Notice, Section, Step, T, ToneTag, styles } from "@/ui/ui";

// Les deux recherches du dossier d'une affaire, comme sur le site : les autres versions dans la
// presse (WebSearchPanel), et ce qu'en disent déjà les vérificateurs (FactCheckPanel).

const STEPS = ["Recherche sur le web", "Lecture des sources", "Comparaison du sens"];
// Passage indicatif aux étapes suivantes, comme sur le site.
const STEP_AT_MS = [3_000, 8_000];

/** La recherche web d'une nouvelle affaire, lancée toute seule à l'ouverture de son dossier (une
 * seule version : rien n'a encore été cherché). Les sources retenues deviennent des versions. */
export function WebSearch({ caseId, autoStart, onFound }: { caseId: string; autoStart: boolean; onFound: () => void }) {
  const c = useTheme();
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<WebSearchResult | null>(null);
  const started = useRef(false);

  async function run() {
    setRunning(true);
    setError(null);
    setStep(0);
    const handles = STEP_AT_MS.map((at, index) => setTimeout(() => setStep(index + 1), at));
    try {
      const result = await post<WebSearchResult>(`/cases/${caseId}/web-search`);
      if (result.status !== "prepared") setDone(result);
      if (result.kept > 0) onFound();
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      handles.forEach(clearTimeout);
      setRunning(false);
    }
  }

  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule fois, à l'ouverture du dossier
  }, [autoStart]);

  if (running) {
    return (
      <Card accessibilityLiveRegion="polite">
        <T style={{ fontFamily: fonts.semibold }}>Recherche de cette information sur le web…</T>
        {STEPS.map((label, index) => (
          <Step key={label} label={label} state={index < step ? "done" : index === step ? "running" : "waiting"} />
        ))}
        <T tone="muted">Presse, forums, Reddit et pages publiques des réseaux sociaux. Quelques secondes.</T>
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <Notice tone="error">{error}</Notice>
        <Button label="Relancer la recherche" variant="outline" onPress={run} />
      </Card>
    );
  }
  if (!done) return null;
  return (
    <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: radius.card, backgroundColor: c.card, padding: 14, gap: 6 }}>
      {done.status === "found" ? (
        <T>
          <T style={{ fontFamily: fonts.bold }}>
            {done.kept} {done.kept > 1 ? "sources retrouvées" : "source retrouvée"}
          </T>{" "}
          sur le web. Chacune est rangée dans les versions retrouvées, avec ce qu’elle change.
        </T>
      ) : (
        <T>
          <T style={{ fontFamily: fonts.bold }}>Aucune source publique</T> ne rapporte cette information. Cette absence ne prouve rien : elle circule peut-être dans des groupes privés (WhatsApp, Facebook), que personne ne peut fouiller.
        </T>
      )}
      {done.contradicting > 0 && (
        <T>
          <T style={{ fontFamily: fonts.bold }}>
            {done.contradicting} {done.contradicting > 1 ? "sources démentent" : "source dément"}
          </T>{" "}
          cette information, selon l’IA : leur version porte la mention « Dément l’information ».
        </T>
      )}
    </View>
  );
}

const LANGUAGE_LABELS: Record<string, string> = { fr: "Français", mg: "Malagasy", en: "English" };

type Reference = { kind: "fact_check" | "wikipedia"; url: string; title: string; content: string; sourceName: string; publishedAt: string | null };

/** Verser une vérification ou un article au dossier, comme pièce : une fois, puis « Versée ». */
function AddButton({ caseId, reference, onAdded }: { caseId: string; reference: Reference; onAdded: () => void }) {
  const [state, setState] = useState<"idle" | "busy" | "added">("idle");
  const [error, setError] = useState<string | null>(null);
  async function add() {
    setState("busy");
    setError(null);
    try {
      await post(`/cases/${caseId}/references`, reference);
      setState("added");
      onAdded();
    } catch (e) {
      setState("idle");
      setError((e as ApiError).message);
    }
  }
  return (
    <>
      <Button
        label={state === "added" ? "Versée au dossier" : state === "busy" ? "Versement…" : "Verser au dossier"}
        icon={Paperclip}
        variant="outline"
        busy={state === "busy"}
        disabled={state === "added"}
        onPress={add}
      />
      {error && <Notice tone="error">{error}</Notice>}
    </>
  );
}

function OpenLink({ url, label }: { url: string; label: string }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="link" hitSlop={8} onPress={() => Linking.openURL(url)} style={[styles.row, { gap: 6, alignSelf: "flex-start" }]}>
      <T style={{ fontFamily: fonts.semibold, textDecorationLine: "underline", flexShrink: 1 }}>{label}</T>
      <ArrowSquareOut size={16} color={c.foreground} />
    </Pressable>
  );
}

/** Ce qu'en disent déjà les vérificateurs de faits, et Wikipédia. Leur conclusion est relayée sous
 * leur nom, mot pour mot ; la personne choisit ce qu'elle verse au dossier. */
export function FactCheckPanel({ caseId, onAdded }: { caseId: string; onAdded: () => void }) {
  const c = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FactChecks | null>(null);

  async function search() {
    setBusy(true);
    setError(null);
    try {
      setResult(await post<FactChecks>(`/cases/${caseId}/fact-checks`));
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Déjà vérifiée ailleurs ?">
      {!result && !busy && !error && (
        <T tone="muted">Les rubriques de vérification (AFP Factuel, Africa Check, Les Observateurs…) ont peut-être déjà traité cette information. Wikipédia donne le contexte, en français, en malgache et en anglais.</T>
      )}
      <Button label={result ? "Relancer la recherche" : "Chercher chez les vérificateurs"} icon={SealCheck} variant={result ? "outline" : "primary"} busy={busy} onPress={search} />
      {error && <Notice tone="error">{error}</Notice>}
      {result && !result.searched && <T tone="muted">Recherche impossible pour le moment (pas de réseau). Réessayez plus tard.</T>}
      {result?.searched && result.factChecks.length === 0 && <T tone="muted">Aucune vérification publiée trouvée. Cela ne prouve rien : le sujet est peut-être trop récent ou trop local.</T>}
      {result?.searched &&
        result.factChecks.map((check) => (
          <Card key={check.url}>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              <T style={{ fontFamily: fonts.semibold }}>{check.publisher}</T>
              {check.rating ? <ToneTag label={`« ${check.rating} »`} tone="info" /> : null}
              {check.published_at ? <T tone="muted">{formatDate(check.published_at)}</T> : null}
            </View>
            <OpenLink url={check.url} label={check.title || check.url} />
            {check.claim ? <T>Affirmation vérifiée : « {check.claim} »</T> : null}
            {check.excerpt ? <T tone="muted">{check.excerpt}</T> : null}
            <AddButton
              caseId={caseId}
              onAdded={onAdded}
              reference={{
                kind: "fact_check",
                url: check.url,
                title: check.title || "Vérification publiée",
                content: check.rating ? `${check.publisher} conclut : « ${check.rating} ».${check.claim ? ` Affirmation vérifiée : « ${check.claim} ».` : ""}` : check.excerpt || check.title,
                sourceName: check.publisher,
                publishedAt: check.published_at,
              }}
            />
          </Card>
        ))}
      {result?.searched && result.wikipedia.length > 0 && (
        <View style={{ gap: 10 }}>
          <T style={{ fontFamily: fonts.semibold, fontSize: 17 }}>Wikipédia</T>
          {result.wikipedia.map((article) => (
            <Card key={article.url} style={{ backgroundColor: c.muted }}>
              <View style={[styles.row, { flexWrap: "wrap" }]}>
                <OpenLink url={article.url} label={article.title} />
                <ToneTag label={LANGUAGE_LABELS[article.language] ?? article.language} tone="neutral" />
              </View>
              <T tone="muted" numberOfLines={6}>
                {article.summary}
              </T>
              <AddButton
                caseId={caseId}
                onAdded={onAdded}
                reference={{ kind: "wikipedia", url: article.url, title: `Wikipédia · ${article.title}`, content: article.summary.slice(0, 1500) || article.title, sourceName: "Wikipédia", publishedAt: null }}
              />
            </Card>
          ))}
        </View>
      )}
    </Section>
  );
}
