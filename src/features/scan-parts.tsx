import { useRouter } from "expo-router";
import { type ReactNode, useState } from "react";
import { Image, Linking, Platform, Pressable, View } from "react-native";

import { AI_SOURCE_LABELS, ApiError, type CaseSummary, type PickedFile, post, SCAN_OUTCOME_DESCRIPTIONS, SCAN_OUTCOME_LABELS, type ScanOutcome } from "@/lib/api";
import { demoFile, MAX_FILE_BYTES, pickAudio, pickMedia } from "@/lib/files";
import { ArrowSquareOut, Camera, CheckCircle, type Icon, Images, Paperclip, Waveform } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/use-api";
import { Button, Card, Chip, Notice, T, ToneTag, styles } from "@/ui/ui";

// Les morceaux communs au scan d'image et au scan de vidéo, avec les mots du site.

const OUTCOME_TONES: Record<ScanOutcome, string> = { ai_signature: "danger", clues: "warning", no_clue: "neutral" };

/** Le résultat d'ensemble : relevé sur le fichier, jamais un verdict de vérité (pas de couleur). */
export function Outcome({ outcome }: { outcome: ScanOutcome }) {
  const c = useTheme();
  return (
    <View style={{ gap: 8, padding: 14, borderRadius: radius.card, backgroundColor: c.muted }}>
      <ToneTag label={SCAN_OUTCOME_LABELS[outcome]} tone={OUTCOME_TONES[outcome]} />
      <T>{SCAN_OUTCOME_DESCRIPTIONS[outcome]}</T>
    </View>
  );
}

/** Une étape de faits (trait plein) : ce que dit le fichier, déjà vue, images clés. */
export function FactStep({ icon: Glyph, title, children }: { icon: Icon; title: string; children: ReactNode }) {
  const c = useTheme();
  return (
    <Card>
      <View style={[styles.row, { gap: 8 }]}>
        <Glyph size={20} color={c.foreground} />
        <T accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 17, flex: 1 }}>
          {title}
        </T>
      </View>
      {children}
    </Card>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((item) => (
        <T key={item}>• {item}</T>
      ))}
    </View>
  );
}

/** D'où vient la lecture : l'IA, ou la réponse préparée de la démo hors ligne. */
export function SourceNote({ source }: { source: string | null }) {
  if (!source) return null;
  return (
    <T tone="muted" style={{ fontSize: 13 }}>
      {source in AI_SOURCE_LABELS ? AI_SOURCE_LABELS[source as keyof typeof AI_SOURCE_LABELS] : source}
    </T>
  );
}

// Recherche inversée : la personne y dépose la copie protégée ; Vyra n'envoie rien lui-même.
const REVERSE_SEARCH = [
  { name: "Google Lens", url: "https://lens.google.com/" },
  { name: "TinEye", url: "https://tineye.com/" },
  { name: "Yandex Images", url: "https://yandex.com/images/" },
  { name: "Bing Visual Search", url: "https://www.bing.com/visualsearch" },
];

export function ReverseSearch() {
  const c = useTheme();
  return (
    <View style={styles.wrap}>
      {REVERSE_SEARCH.map((service) => (
        <Pressable
          key={service.name}
          accessibilityRole="link"
          onPress={() => Linking.openURL(service.url)}
          style={({ pressed }) => [styles.row, { gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: radius.control, borderWidth: 1, borderColor: c.input, backgroundColor: pressed ? c.accent : "transparent" }]}
        >
          <T style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{service.name}</T>
          <ArrowSquareOut size={15} color={c.foreground} />
        </Pressable>
      ))}
    </View>
  );
}

type Demo = { label: string; path: string; type: string };

const PICK_LABELS = { images: "Choisir une photo", videos: "Choisir une vidéo", audio: "Choisir un vocal" } as const;
// Les mêmes formats que le site.
const FORMATS = {
  images: "JPEG, PNG ou WebP, 8 Mo au plus.",
  videos: "MP4, MOV, WebM ou 3GP, 8 Mo au plus.",
  audio: "WAV, MP3, OGG ou M4A, 8 Mo au plus.",
} as const;

/** Choisir le fichier : la galerie, l'appareil photo (image, sur téléphone), ou une démo du site. */
export function FilePicker({ kind, busy, demos, onFile }: { kind: "images" | "videos" | "audio"; busy: boolean; demos: Demo[]; onFile: (file: PickedFile) => void }) {
  const [error, setError] = useState<string | null>(null);

  async function choose(camera: boolean) {
    setError(null);
    try {
      const picked = kind === "audio" ? await pickAudio() : await pickMedia(kind, camera);
      if (!picked) return;
      if (picked.size && picked.size > MAX_FILE_BYTES) {
        setError("Fichier trop lourd : 8 Mo au plus.");
        return;
      }
      onFile(picked.file);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function demo(item: Demo) {
    setError(null);
    try {
      onFile(await demoFile(item.path, item.type));
    } catch {
      setError("La démo n’a pas pu être téléchargée depuis le serveur.");
    }
  }

  return (
    <View style={{ gap: 12 }}>
      <Button label={PICK_LABELS[kind]} icon={kind === "images" ? Images : kind === "audio" ? Waveform : Paperclip} busy={busy} onPress={() => choose(false)} />
      {kind === "images" && Platform.OS !== "web" && <Button label="Prendre une photo" icon={Camera} variant="outline" disabled={busy} onPress={() => choose(true)} />}
      <T tone="muted">{FORMATS[kind]}</T>
      <View style={{ gap: 8 }}>
        <T style={{ fontFamily: fonts.medium, fontSize: 15 }}>Essayer avec :</T>
        <View style={styles.wrap}>
          {demos.map((item) => (
            <Chip key={item.path} label={item.label} onPress={busy ? undefined : () => demo(item)} />
          ))}
        </View>
      </View>
      {error && <Notice tone="error">{error}</Notice>}
    </View>
  );
}

/** Le fichier choisi, en petit, pour savoir ce qu'on examine. */
export function PickedPreview({ uri }: { uri: string }) {
  const c = useTheme();
  return <Image source={{ uri }} accessibilityLabel="L’image choisie" resizeMode="contain" style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: radius.card, backgroundColor: c.muted }} />;
}

/** Verser les indices du scan au dossier d'une affaire. */
export function AddToCase({ scanId }: { scanId: string }) {
  const router = useRouter();
  const c = useTheme();
  const { data } = useApi<{ cases: CaseSummary[] }>("/cases");
  const [caseId, setCaseId] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ caseId: string; added: number } | null>(null);
  const cases = data?.cases ?? [];
  if (cases.length === 0) return null;
  const shown = all ? cases : cases.slice(0, 5);

  async function add() {
    if (!caseId) return;
    setBusy(true);
    setError(null);
    try {
      setDone(await post<{ caseId: string; added: number }>(`/scans/${scanId}/case`, { caseId }));
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const plural = done.added > 1 ? "s" : "";
    return (
      <Card>
        <View style={[styles.row, { gap: 8 }]}>
          <CheckCircle size={20} color={c.foreground} />
          <T style={{ fontFamily: fonts.semibold, flex: 1 }}>
            {done.added} pièce{plural} versée{plural} au dossier
          </T>
        </View>
        <Button label="Voir le dossier" variant="outline" onPress={() => router.push({ pathname: "/case/[id]", params: { id: done.caseId } })} />
      </Card>
    );
  }

  return (
    <Card>
      <T style={{ fontFamily: fonts.bold, fontSize: 17 }}>Verser les indices au dossier de</T>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {shown.map((item) => (
          <Chip key={item.id} label={item.title} selected={item.id === caseId} onPress={() => setCaseId(item.id)} />
        ))}
      </View>
      {!all && cases.length > 5 && <Button label={`Voir les ${cases.length} affaires`} variant="ghost" onPress={() => setAll(true)} />}
      {error && <Notice tone="error">{error}</Notice>}
      <Button label="Verser au dossier" variant="outline" icon={Paperclip} busy={busy} disabled={!caseId} onPress={add} />
    </Card>
  );
}
