import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { ApiError, formatDate, post, type ReportGroup, type ReportOutcome, type Reports } from "@/lib/api";
import { REPORT_CASE_THRESHOLD, REPORT_REASON_LABELS, REPORT_REASONS, REPORT_STATE_LABELS, REPORT_STATE_TONES, type ReportReason } from "@/lib/domain";
import { CaretRight, Info, Siren } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/use-api";
import { Button, Card, Chip, Field, Loading, Notice, Screen, Section, T, ToneTag, styles } from "@/ui/ui";

function reportedBy(count: number) {
  return count > 1 ? `${count} personnes ont signalé` : `${count} personne a signalé`;
}

/** L'avancement vers le seuil qui ouvre une vérification. */
function Progress({ count }: { count: number }) {
  const c = useTheme();
  const reached = Math.min(count, REPORT_CASE_THRESHOLD);
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: c.muted, overflow: "hidden" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ width: `${(reached / REPORT_CASE_THRESHOLD) * 100}%`, height: "100%", backgroundColor: c.foreground }} />
    </View>
  );
}

function OpenCaseLink({ caseId }: { caseId: string }) {
  const router = useRouter();
  const c = useTheme();
  return (
    <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push({ pathname: "/case/[id]", params: { id: caseId } })} style={[styles.row, { gap: 6, alignSelf: "flex-start" }]}>
      <T style={{ fontFamily: fonts.semibold, textDecorationLine: "underline" }}>Voir l’affaire</T>
      <CaretRight size={16} color={c.foreground} />
    </Pressable>
  );
}

/** Signaler un contenu, comme le formulaire du site. Le fil et l'assistant le pré-remplissent. */
function ReportForm({ text, url: initialUrl, post: feedPostId, onSent }: { text?: string; url?: string; post?: string; onSent: () => void }) {
  const [content, setContent] = useState(text ?? "");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ReportOutcome | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const result = await post<ReportOutcome>("/reports", { content: content.trim(), url: url.trim(), feedPostId: feedPostId ?? "", reason: reason ?? "", description: description.trim() });
      setOutcome(result);
      setDescription("");
      onSent();
    } catch (e) {
      const failure = e as ApiError;
      setError(failure.fieldErrors ? Object.values(failure.fieldErrors).flat().filter(Boolean)[0] ?? failure.message : failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ padding: 16, gap: 12 }}>
      <T accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 20 }}>
        Signaler un contenu
      </T>
      <Field label="Le contenu" value={content} onChangeText={setContent} multiline numberOfLines={4} style={{ minHeight: 100 }} />
      <T tone="muted">{feedPostId ? "Repris de la publication du fil d’actualité." : "Collez le texte tel que vous l’avez reçu."}</T>
      <Field label="Ou son lien (facultatif)" value={url} onChangeText={setUrl} placeholder="https://" keyboardType="url" autoCapitalize="none" autoCorrect={false} />
      <T style={{ fontFamily: fonts.medium, fontSize: 15 }}>Motif</T>
      <View style={styles.wrap} accessibilityRole="radiogroup">
        {REPORT_REASONS.map((value) => (
          <Chip key={value} label={REPORT_REASON_LABELS[value]} selected={reason === value} onPress={() => setReason(value)} />
        ))}
      </View>
      <Field label="Pourquoi il vous semble suspect (facultatif)" value={description} onChangeText={setDescription} multiline numberOfLines={3} style={{ minHeight: 80 }} />
      <Button label="Envoyer le signalement" icon={Siren} busy={busy} disabled={!reason || (content.trim().length < 10 && !url.trim())} onPress={send} />
      {error && <Notice tone="error">{error}</Notice>}
      {outcome && (
        <View accessibilityLiveRegion="polite" style={{ gap: 8 }}>
          <T style={{ fontFamily: fonts.bold }}>{outcome.caseId ? "Une vérification commence." : "Merci, votre signalement est enregistré."}</T>
          <Progress count={outcome.reporterCount} />
          <T tone="muted">
            {reportedBy(outcome.reporterCount)} ce contenu
            {outcome.caseId ? " : une affaire est ouverte pour le vérifier." : `. À ${REPORT_CASE_THRESHOLD}, une vérification commence.`}
          </T>
          {outcome.caseId && <OpenCaseLink caseId={outcome.caseId} />}
        </View>
      )}
    </Card>
  );
}

/** « Mes signalements » : chaque contenu signalé, où il en est, et son affaire quand elle existe. */
function MyReports({ data }: { data: Reports }) {
  const c = useTheme();
  return (
    <Section title="Mes signalements">
      {data.mine.length === 0 ? (
        <Notice>Aucun signalement pour l’instant. Vos signalements apparaîtront ici, avec leur avancement.</Notice>
      ) : (
        data.mine.map((item) => (
          <View key={item.id} style={{ gap: 6, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.border }}>
            <View style={[styles.row, { justifyContent: "space-between", alignItems: "flex-start" }]}>
              <T style={{ fontFamily: fonts.semibold, flex: 1 }} numberOfLines={3}>
                {item.groupTitle}
              </T>
              <ToneTag label={REPORT_STATE_LABELS[item.state]} tone={REPORT_STATE_TONES[item.state]} />
            </View>
            <T tone="muted">
              {REPORT_REASON_LABELS[item.reason]} · {formatDate(item.createdAt)} · {item.reporterCount} signaleur{item.reporterCount > 1 ? "s" : ""}
            </T>
            {item.caseId && <OpenCaseLink caseId={item.caseId} />}
          </View>
        ))
      )}
    </Section>
  );
}

/** Vue du vérificateur : un groupe par contenu signalé, l'avancement vers le seuil, les
 * formulations reçues ; il peut ouvrir l'affaire sans attendre le seuil. */
function Group({ group, onOpened }: { group: ReportGroup; onOpened: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shown, setShown] = useState(false);

  async function openNow() {
    setBusy(true);
    setError(null);
    try {
      const { caseId } = await post<{ caseId: string }>(`/reports/groups/${group.id}/open-case`);
      onOpened();
      router.push({ pathname: "/case/[id]", params: { id: caseId } });
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <View style={[styles.row, { justifyContent: "space-between", alignItems: "flex-start" }]}>
        <T style={{ fontFamily: fonts.bold, flex: 1 }}>{group.title}</T>
        <ToneTag label={REPORT_STATE_LABELS[group.state]} tone={REPORT_STATE_TONES[group.state]} />
      </View>
      {group.summary ? <T tone="muted">{group.summary}</T> : null}
      <T tone="tabular" style={{ fontSize: 14 }}>
        {group.reporterCount} / {REPORT_CASE_THRESHOLD} signaleurs
      </T>
      <Progress count={group.reporterCount} />
      {group.caseId ? (
        <Button label="Voir l’affaire" onPress={() => router.push({ pathname: "/case/[id]", params: { id: group.caseId as string } })} />
      ) : (
        <Button label="Ouvrir l’affaire maintenant" variant="outline" busy={busy} onPress={openNow} />
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <Button
        label={shown ? "Masquer les signalements" : `Voir les ${group.reports.length} signalement${group.reports.length > 1 ? "s" : ""}`}
        variant="ghost"
        onPress={() => setShown((value) => !value)}
      />
      {shown &&
        group.reports.map((report) => (
          <View key={report.id} style={{ gap: 2, paddingTop: 8 }}>
            <T>{report.content || report.url}</T>
            <T tone="muted" style={{ fontSize: 13 }}>
              {report.reporterName ?? "Sans compte"} · {REPORT_REASON_LABELS[report.reason]} · {formatDate(report.createdAt)}
              {report.description ? ` · ${report.description}` : ""}
            </T>
          </View>
        ))}
    </Card>
  );
}

/** La boîte d'alertes, comme la page /reports du site : le citoyen signale et suit ses
 * signalements ; le vérificateur voit aussi les groupes d'alertes. `?text=&url=&post=` pré-remplit. */
export default function ReportsScreen() {
  const c = useTheme();
  const params = useLocalSearchParams<{ text?: string; url?: string; post?: string }>();
  const { data, error, isLoading, isValidating, mutate } = useApi<Reports>("/reports");
  const [tab, setTab] = useState<"groups" | "report">("groups");
  const prefilled = Boolean(params.text || params.url || params.post);
  const showGroups = data?.isVerifier && tab === "groups" && !prefilled;

  return (
    <Screen onRefresh={() => mutate()} refreshing={isValidating && !isLoading}>
      <View style={{ gap: 6 }}>
        <T tone="title">Boîte d’alertes</T>
        <T tone="muted">Signaler un contenu suspect. Plusieurs signalements déclenchent une vérification, jamais un verdict.</T>
      </View>
      <View style={[styles.row, { backgroundColor: c.muted, borderRadius: radius.card, padding: 12, alignItems: "flex-start" }]}>
        <Info size={18} color={c.foreground} />
        <T style={{ flex: 1, fontSize: 15 }}>Un signalement déclenche une vérification. Il ne dit pas que c’est faux.</T>
      </View>
      {error && <Notice tone="error">{error.message}</Notice>}
      {isLoading && <Loading />}
      {data?.isVerifier && !prefilled && (
        <View style={styles.row}>
          <Chip label={`Groupes d’alertes (${data.groups.length})`} selected={tab === "groups"} onPress={() => setTab("groups")} />
          <Chip label="Signaler" selected={tab === "report"} onPress={() => setTab("report")} />
        </View>
      )}
      {data && showGroups && (
        <View style={{ gap: 12 }}>
          {data.groups.length === 0 ? (
            <Notice>Aucune alerte pour l’instant. Les contenus signalés apparaîtront ici, regroupés par contenu.</Notice>
          ) : (
            data.groups.map((group) => <Group key={group.id} group={group} onOpened={() => mutate()} />)
          )}
        </View>
      )}
      {data && !showGroups && (
        <>
          {/* La clé recrée le formulaire quand on arrive d'une autre publication, comme sur le site. */}
          <ReportForm key={`${params.post ?? ""}|${params.text ?? ""}|${params.url ?? ""}`} text={params.text} url={params.url} post={params.post} onSent={() => mutate()} />
          <MyReports data={data} />
        </>
      )}
    </Screen>
  );
}
