import { useState } from "react";
import { View } from "react-native";

import { AssistantButton } from "@/components/assistant-button";
import { ApiError, del, type Directory, type DirectoryEntry, formatDate, formatPhone, post } from "@/lib/api";
import { Buildings, FileText, Plus, Trash } from "@/lib/icons";
import { fonts, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/use-api";
import { Button, Card, Field, Loading, Notice, Screen, Section, T, styles } from "@/ui/ui";

// L'annuaire officiel de « Est-ce bien eux ? » : les canaux de chaque institution et ses
// communiqués. Lisible par tous ; un vérificateur le tient à jour, comme sur le site.

type FieldErrors = Record<string, string[] | undefined>;

/** Le premier message d'erreur d'un champ renvoyé par le site. */
function fieldError(errors: FieldErrors | null, name: string) {
  return errors?.[name]?.[0];
}

function readFieldErrors(error: unknown): FieldErrors | null {
  return error instanceof ApiError ? (error.fieldErrors ?? null) : null;
}

/** Retirer, en deux temps : un premier appui demande la confirmation (pas de boîte de dialogue). */
function RemoveButton({ label, path, onDone }: { label: string; path: string; onDone: () => void }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await del(path);
      onDone();
    } catch (e) {
      setError((e as ApiError).message);
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 8 }}>
      {armed ? (
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          <Button label={`Oui, retirer ${label}`} icon={Trash} variant="outline" busy={busy} onPress={remove} />
          <Button label="Annuler" variant="ghost" disabled={busy} onPress={() => setArmed(false)} />
        </View>
      ) : (
        <Button label={`Retirer ${label}`} icon={Trash} variant="ghost" onPress={() => setArmed(true)} style={{ alignSelf: "flex-start" }} />
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </View>
  );
}

function NoticeForm({ institutionId, onDone }: { institutionId: string; onDone: () => void }) {
  const [form, setForm] = useState({ title: "", content: "", sourceUrl: "", publishedAt: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors | null>(null);
  const set = (key: keyof typeof form) => (value: string) => setForm((all) => ({ ...all, [key]: value }));
  async function save() {
    setBusy(true);
    setError(null);
    setFields(null);
    try {
      await post("/directory/notices", { institutionId, ...form });
      onDone();
    } catch (e) {
      setError((e as ApiError).message);
      setFields(readFieldErrors(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={{ gap: 12 }}>
      <Field label="Titre du communiqué" value={form.title} onChangeText={set("title")} />
      {fieldError(fields, "title") && <Notice tone="error">{fieldError(fields, "title")}</Notice>}
      <Field label="Texte, recopié en entier" value={form.content} onChangeText={set("content")} multiline numberOfLines={5} style={{ minHeight: 110 }} />
      {fieldError(fields, "content") && <Notice tone="error">{fieldError(fields, "content")}</Notice>}
      <Field label="Lien de la source (facultatif)" value={form.sourceUrl} onChangeText={set("sourceUrl")} autoCapitalize="none" keyboardType="url" placeholder="https://…" />
      <Field label="Date de publication (facultatif)" value={form.publishedAt} onChangeText={set("publishedAt")} placeholder="AAAA-MM-JJ" />
      {error && !fields && <Notice tone="error">{error}</Notice>}
      <Button label="Ajouter le communiqué" icon={Plus} busy={busy} onPress={save} />
    </View>
  );
}

const INSTITUTION_FIELDS = [
  { key: "name", label: "Nom de l’institution" },
  { key: "aliases", label: "Autres noms, séparés par des virgules" },
  { key: "domains", label: "Sites et domaines e-mail officiels", placeholder: "regie-eaux.mg" },
  { key: "phones", label: "Numéros officiels", placeholder: "034 00 001 01" },
  { key: "pages", label: "Pages officielles", placeholder: "facebook.com/regieeaux" },
  { key: "senders", label: "Noms d’expéditeur SMS", placeholder: "REGIE-EAUX" },
  { key: "never", label: "Ce que l’institution ne demande jamais", placeholder: "La Régie ne demande jamais de paiement par MVola." },
] as const;

type InstitutionForm = Record<(typeof INSTITUTION_FIELDS)[number]["key"], string>;

function InstitutionFormView({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState<InstitutionForm>({ name: "", aliases: "", domains: "", phones: "", pages: "", senders: "", never: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldErrors | null>(null);
  async function save() {
    setBusy(true);
    setError(null);
    setFields(null);
    try {
      await post("/directory/institutions", form);
      onDone();
    } catch (e) {
      setError((e as ApiError).message);
      setFields(readFieldErrors(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      {INSTITUTION_FIELDS.map((item) => (
        <View key={item.key} style={{ gap: 6 }}>
          <Field
            label={item.label}
            value={form[item.key]}
            onChangeText={(value) => setForm((all) => ({ ...all, [item.key]: value }))}
            placeholder={"placeholder" in item ? item.placeholder : undefined}
            autoCapitalize={item.key === "domains" || item.key === "pages" ? "none" : "sentences"}
          />
          {fieldError(fields, item.key) && <Notice tone="error">{fieldError(fields, item.key)}</Notice>}
        </View>
      ))}
      {error && !fields && <Notice tone="error">{error}</Notice>}
      <Button label="Ajouter l’institution" icon={Plus} busy={busy} onPress={save} />
    </Card>
  );
}

function ChannelList({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <T>
      <T style={{ fontFamily: fonts.semibold }}>{label} : </T>
      {values.join(", ")}
    </T>
  );
}

function Entry({ entry, canEdit, refresh }: { entry: DirectoryEntry; canEdit: boolean; refresh: () => void }) {
  const c = useTheme();
  const [adding, setAdding] = useState(false);
  return (
    <Card>
      <View style={[styles.row, { gap: 8 }]}>
        <Buildings size={20} color={c.foreground} />
        <T accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 18, flex: 1 }}>
          {entry.name}
        </T>
      </View>
      {entry.aliases.length > 0 && <T tone="muted">Aussi : {entry.aliases.join(", ")}</T>}
      <ChannelList label="Sites" values={entry.channels.domains} />
      <ChannelList label="Numéros" values={entry.channels.phones.map(formatPhone)} />
      <ChannelList label="Pages" values={entry.channels.pages} />
      <ChannelList label="Expéditeurs SMS" values={entry.channels.senders} />
      {!!entry.never && <T>« {entry.never} »</T>}
      {entry.notices.map((notice) => (
        <View key={notice.id} style={{ gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border }}>
          <View style={[styles.row, { gap: 6 }]}>
            <FileText size={16} color={c.foreground} />
            <T style={{ fontFamily: fonts.semibold, flex: 1 }}>{notice.title}</T>
          </View>
          {notice.publishedAt && <T tone="muted">{formatDate(notice.publishedAt)}</T>}
          <T numberOfLines={4}>{notice.content}</T>
          {canEdit && <RemoveButton label="ce communiqué" path={`/directory/notice/${notice.id}`} onDone={refresh} />}
        </View>
      ))}
      {canEdit && (
        <View style={{ gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border }}>
          {adding ? (
            <NoticeForm
              institutionId={entry.id}
              onDone={() => {
                setAdding(false);
                refresh();
              }}
            />
          ) : (
            <Button label="Ajouter un communiqué" icon={Plus} variant="outline" onPress={() => setAdding(true)} />
          )}
          <RemoveButton label="l’institution" path={`/directory/institution/${entry.id}`} onDone={refresh} />
        </View>
      )}
    </Card>
  );
}

export default function DirectoryScreen() {
  const { data, error, isLoading, mutate, isValidating } = useApi<Directory>("/directory");
  const [adding, setAdding] = useState(false);
  const refresh = () => void mutate();
  return (
    <View style={{ flex: 1 }}>
      <Screen onRefresh={refresh} refreshing={isValidating && !isLoading}>
        <View style={{ gap: 6 }}>
          <T tone="title">Annuaire officiel</T>
          <T tone="muted">Les canaux officiels de chaque institution et leurs communiqués : « Est-ce bien eux ? » compare chaque message à cette liste.</T>
        </View>
        {isLoading && <Loading />}
        {error && <Notice tone="error">{error.message}</Notice>}
        {data?.canEdit && (
          <Section title="Tenir l’annuaire à jour" note="Réservé aux vérificateurs.">
            {adding ? (
              <InstitutionFormView
                onDone={() => {
                  setAdding(false);
                  refresh();
                }}
              />
            ) : (
              <Button label="Ajouter une institution" icon={Plus} variant="outline" onPress={() => setAdding(true)} />
            )}
          </Section>
        )}
        {data?.entries.length === 0 && <T tone="muted">L’annuaire est vide.</T>}
        {data?.entries.map((entry) => <Entry key={entry.id} entry={entry} canEdit={data.canEdit} refresh={refresh} />)}
      </Screen>
      <AssistantButton />
    </View>
  );
}
