import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { ApiError, type ChannelFinding, type DiffPart, formatDate, formatPhone, type ImpersonationReport, post } from "@/lib/api";
import { AddressBook, Buildings, CheckCircle, FileText, Globe, Link, MagnifyingGlass, Money, Phone, Question, ShieldWarning, TextT } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { Button, Card, Field, Notice, Step, T, ToneTag, styles } from "@/ui/ui";

const KIND = {
  domain: { label: "Adresse", icon: Globe },
  phone: { label: "Numéro", icon: Phone },
  page: { label: "Page", icon: Link },
  sender: { label: "Expéditeur", icon: TextT },
} as const;

/** Un canal relevé dans le message, comparé à l'annuaire. Un fait, pas un verdict : à l'encre. */
function Channel({ finding }: { finding: ChannelFinding }) {
  const c = useTheme();
  const { label, icon: Glyph } = KIND[finding.kind];
  const value = finding.kind === "phone" ? formatPhone(finding.value) : finding.value;
  const status =
    finding.status === "official"
      ? { icon: CheckCircle, word: "Canal officiel", text: `de ${finding.institution}`, strong: false }
      : finding.status === "lookalike"
        ? { icon: ShieldWarning, word: "Imitation", text: `ressemble à ${finding.imitates}, le canal officiel de ${finding.institution}, sans l’être.`, strong: true }
        : { icon: Question, word: "Absent de l’annuaire", text: finding.institution ? `ce n’est pas un canal connu de ${finding.institution}.` : "aucune institution de l’annuaire n’utilise ce canal.", strong: false };
  const Status = status.icon;
  return (
    <View style={{ gap: 6, padding: 12, borderRadius: 14, backgroundColor: c.background, borderWidth: status.strong ? 2 : 0, borderColor: c.foreground }}>
      <View style={[styles.row, { gap: 6, flexWrap: "wrap" }]}>
        <Glyph size={16} color={c.mutedForeground} />
        <T tone="muted">{label}</T>
        <T selectable style={{ fontFamily: fonts.semibold, flexShrink: 1 }}>
          {value}
        </T>
      </View>
      <View style={[styles.row, { gap: 6, alignItems: "flex-start" }]}>
        <Status size={17} color={c.foreground} style={{ marginTop: 3 }} />
        <T style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bold }}>{status.word}</Text> {status.text}
        </T>
      </View>
    </View>
  );
}

/** Le texte d'un communiqué mot à mot : retiré barré, ajouté surligné (jamais la couleur seule). */
function DiffText({ parts }: { parts: DiffPart[] }) {
  const c = useTheme();
  return (
    <T>
      {parts.map((part, index) => (
        <Text
          key={index}
          style={
            part.kind === "removed"
              ? { textDecorationLine: "line-through", color: c.mutedForeground }
              : part.kind === "added"
                ? { fontFamily: fonts.bold, backgroundColor: c.accent, textDecorationLine: "underline" }
                : undefined
          }
        >
          {part.text}
        </Text>
      ))}
    </T>
  );
}

function Report({ report }: { report: ImpersonationReport }) {
  const c = useTheme();
  const sender = report.channels.some((item) => item.kind === "sender" && item.status === "official");
  const nevers = report.claimed.filter((item) => item.never);
  return (
    <View style={{ gap: 14 }} accessibilityLiveRegion="polite">
      <Card>
        <View style={[styles.row, { gap: 8 }]}>
          <Buildings size={20} color={c.foreground} />
          <T accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 17 }}>
            Qui le message dit-il être ?
          </T>
        </View>
        {report.claimed.length > 0 ? (
          <T>
            Il se présente comme venant de <Text style={{ fontFamily: fonts.bold }}>{report.claimed.map((item) => item.name).join(", ")}</Text>.
          </T>
        ) : (
          <T tone="muted">Il ne cite aucune institution de l’annuaire.</T>
        )}
      </Card>

      <Card>
        <T accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 17 }}>
          Les liens, numéros et pages du message
        </T>
        {report.channels.length > 0 ? report.channels.map((finding) => <Channel key={`${finding.kind}:${finding.value}`} finding={finding} />) : <T tone="muted">Aucun lien, numéro ni page relevé.</T>}
        {sender && <T tone="muted">Un nom d’expéditeur SMS peut être imité : vérifiez aussi le contenu.</T>}
      </Card>

      {report.asksForMoney.length > 0 && (
        <View style={{ gap: 8, padding: 14, borderRadius: radius.card, borderWidth: 2, borderColor: c.foreground, backgroundColor: c.card }}>
          <View style={[styles.row, { gap: 8 }]}>
            <Money size={20} color={c.foreground} />
            <T accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 17, flex: 1 }}>
              Le message demande de l’argent ou un code
            </T>
          </View>
          <T>Mots relevés : {report.asksForMoney.join(", ")}.</T>
          {nevers.map((item) => (
            <T key={item.id}>
              {item.name} déclare : « {item.never} »
            </T>
          ))}
        </View>
      )}

      {report.notice ? (
        <Card>
          <View style={[styles.row, { gap: 8 }]}>
            <FileText size={20} color={c.foreground} />
            <T accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 17 }}>
              Le communiqué d’origine
            </T>
          </View>
          <T tone="muted">
            {report.notice.institution}, « {report.notice.title} »{report.notice.publishedAt ? `, ${formatDate(report.notice.publishedAt)}` : ""}
          </T>
          <T style={{ fontFamily: fonts.semibold, fontSize: 15 }}>L’original (mots retirés barrés)</T>
          <DiffText parts={report.notice.diff.before} />
          <T style={{ fontFamily: fonts.semibold, fontSize: 15 }}>Le message reçu (mots ajoutés soulignés)</T>
          <DiffText parts={report.notice.diff.after} />
          {report.notice.changedFigures.length > 0 && (
            <View style={{ gap: 6 }}>
              <T>Chiffres absents de l’original :</T>
              <View style={styles.wrap}>
                {report.notice.changedFigures.map((figure) => (
                  <ToneTag key={figure} label={figure} tone="warning" />
                ))}
              </View>
            </View>
          )}
        </Card>
      ) : (
        <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: c.foreground, borderRadius: radius.card, padding: 14 }}>
          <T tone="muted">Aucun communiqué de l’annuaire ne ressemble à ce message.</T>
        </View>
      )}

      <T tone="muted">Des faits relevés par comparaison avec l’annuaire, sans IA, et pas un verdict : un canal absent de l’annuaire n’est pas forcément faux, et l’annuaire peut être incomplet.</T>
    </View>
  );
}

/** « Est-ce bien eux ? » : un message qui se dit d'une institution, comparé à l'annuaire officiel. */
export function Impersonation() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [sender, setSender] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImpersonationReport | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      setReport(await post<ImpersonationReport>("/impersonation", { message: message.trim(), sender: sender.trim() }));
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <T tone="muted">Un message qui se dit de la Régie, de la mairie, d’un opérateur… Vyra compare ses liens, numéros et pages à l’annuaire officiel et retrouve le communiqué d’origine. Sans IA.</T>
      <Field
        label="Message reçu"
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={5}
        placeholder="Collez le message qui se présente comme venant d’une institution, d’un opérateur, d’une administration…"
        style={{ minHeight: 120 }}
      />
      <Field label="Expéditeur (facultatif)" value={sender} onChangeText={setSender} placeholder="034 12 345 67, REGIE-EAUX, adresse e-mail…" autoCapitalize="none" />
      <Button label="Comparer avec l’annuaire" icon={MagnifyingGlass} busy={busy} disabled={message.trim().length < 10} onPress={run} />
      <Button label="Voir l’annuaire officiel" icon={AddressBook} variant="ghost" onPress={() => router.push("/directory")} />
      {busy && (
        <Card>
          <Step label="Comparaison avec l’annuaire officiel" state="running" />
        </Card>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {report && !busy && <Report report={report} />}
    </>
  );
}
