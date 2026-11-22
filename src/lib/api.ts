import { Platform } from "react-native";

import { ApiError, readError } from "@/lib/api-core";
import { API_URL } from "@/lib/config";

export { ApiError, caseIdFrom, formatDate, formatPhone, formatSecond, readError, sealQuery, splitDataUrl } from "@/lib/api-core";

// Le client de l'API de Vyra (`docs/API-MOBILE.md` du dépôt vyra). Une erreur renvoyée par le site
// (`{ error: { code, message } }`) devient une ApiError ; une panne réseau devient NETWORK.

let token: string | null = null;
export const setToken = (value: string | null) => {
  token = value;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  // Un envoi de fichier : fetch choisit lui-même l'en-tête multipart et sa limite.
  const json = !(init.body instanceof FormData);
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      ...init,
      headers: {
        ...(json ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("NETWORK", "Le serveur est injoignable. Vérifiez la connexion.", 0);
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) throw readError(res.status, body);
  return body as T;
}

export const get = <T>(path: string) => request<T>(path);
export const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
export const del = <T>(path: string) => request<T>(path, { method: "DELETE" });

/** Un fichier choisi sur le téléphone (photo, vidéo) : son adresse locale, son nom, son type. */
export type PickedFile = { uri: string; name: string; type: string };

/** Envoie un fichier au champ `file` d'une route (scan d'image ou de vidéo). */
export async function upload<T>(path: string, file: PickedFile): Promise<T> {
  const form = new FormData();
  if (Platform.OS === "web") {
    // Dans le navigateur, l'adresse est un blob: ou une data URL : on envoie le contenu lui-même.
    let blob: Blob;
    try {
      blob = await (await fetch(file.uri)).blob();
    } catch {
      throw new ApiError("FILE_UNREADABLE", "Le fichier n’a pas pu être lu.", 0);
    }
    form.append("file", new Blob([blob], { type: file.type }), file.name);
  } else {
    // React Native lit le fichier depuis son adresse locale au moment de l'envoi.
    form.append("file", { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  }
  return request<T>(path, { method: "POST", body: form });
}

// ---------- Formes des réponses ----------

export type Profile = { id: string; name: string; role: string; headline: string };
export type Login = { token: string; expiresAt: string; profile: Profile };

export type Certainty = "established" | "probable" | "uncertain" | "contradicted" | "insufficient";

export type FeedItem = {
  id: string;
  url: string;
  sourceName: string;
  author: string | null;
  title: string | null;
  body: string;
  imageUrl: string | null;
  publishedAt: string;
  case: { id: string; status: string; certainty: Certainty | null; conclusion: string | null } | null;
  reporterCount: number;
};

export type CaseSummary = {
  id: string;
  title: string;
  claim: string;
  kind: "real" | "fictional";
  status: string;
  certainty: Certainty | null;
  conclusion: string | null;
  createdAt: string;
  /** Première image trouvée pour l'affaire : adresse complète ou chemin du site. */
  imageUrl?: string | null;
};

export type CaseFile = CaseSummary & {
  versions: { id: string; position: number; content: string; sourceName: string; publishedAt: string | null; imagePath?: string | null }[];
  evidence: {
    id: string;
    number: number;
    title: string;
    content: string;
    sourceName: string;
    publishedAt: string | null;
    stance: "supports" | "contradicts" | "context";
    strength: string;
  }[];
};

export type WhatIf = {
  kind: "real" | "fictional";
  versions: { id: string; label: string; text: string; changes: string[] }[];
  takeaway: string;
  source: "gemini" | "fallback";
};

export type Answer = {
  answer: string;
  citations: { number: number; title: string; href: string; certainty: Certainty | null }[];
  /** Actions que l'assistant propose : la personne les confirme d'un toucher, il n'exécute rien. */
  proposals?: { type: string; label: string; href: string }[];
  source: "gemini" | "fallback";
};

export type Check = {
  text: string;
  judged: { url: string; title: string; label: string; tone: string; conclusion: string | null } | null;
  signals: { label: string; tone: string; signs: { label: string; quote: string }[] }[];
  factChecks: { title?: string; publisher?: string; url?: string; rating?: string }[];
};

export const CERTAINTY_LABELS: Record<Certainty, string> = {
  established: "Établi",
  probable: "Probable",
  uncertain: "Incertain",
  contradicted: "Contredit",
  insufficient: "Informations insuffisantes",
};


// ---------- Sceau de la conclusion ----------

export type Seal = { code: string; url: string };
export type SealedContent = { id: string; claim: string; certainty: Certainty; conclusion: string };
export type SealCheck =
  | { status: "genuine"; content: SealedContent; code: string }
  | { status: "mismatch"; content: SealedContent; code: string | null }
  | { status: "unknown" };

// ---------- « Est-ce bien eux ? » ----------

export type ChannelKind = "domain" | "phone" | "page" | "sender";
export type ChannelFinding = {
  kind: ChannelKind;
  value: string;
  status: "official" | "lookalike" | "not_listed";
  institution: string | null;
  imitates?: string;
};
export type DiffPart = { kind: "same" | "removed" | "added"; text: string };
export type ImpersonationReport = {
  claimed: { id: string; name: string; never: string }[];
  channels: ChannelFinding[];
  asksForMoney: string[];
  notice: {
    institution: string;
    title: string;
    content: string;
    publishedAt: string | null;
    diff: { before: DiffPart[]; after: DiffPart[] };
    changedFigures: string[];
  } | null;
};
export type DirectoryEntry = {
  id: string;
  name: string;
  aliases: string[];
  channels: { domains: string[]; phones: string[]; pages: string[]; senders: string[] };
  never: string;
  notices: { id: string; title: string; content: string; publishedAt: string | null }[];
};
export type Directory = { entries: DirectoryEntry[]; canEdit: boolean };

// ---------- Scan d'image et de vidéo ----------

export type ScanOutcome = "ai_signature" | "clues" | "no_clue";
export type ScanView = {
  id: string;
  kind: "image" | "audio" | "video";
  fileName: string;
  report: { format: string; aiSignature: boolean; generator: string | null; findings: string[] } | null;
  alreadySeen: { caseId: string; caseTitle: string; sourceName: string; publishedAt: string | null; distance: number } | null;
  reading: { description: string; observations: string[]; textInImage: string } | null;
  transcript: { transcript: string; language: string; translation: string; claim: string } | null;
  outcome: ScanOutcome | null;
  aiSource: "gemini" | "fallback" | string | null;
  caseId: string | null;
  judged?: { id: string; title: string; certainty: Certainty | null } | null;
  safeCopy?: { dataUrl: string; facesBlurred: number; metadataRemoved: boolean; firstFrameOnly: boolean } | null;
  frames?: { second: number; dataUrl: string; facesBlurred: number }[];
};

/** Les mêmes mots que le site (SCAN_OUTCOME_LABELS de web/src/lib/domain.ts). */
export const SCAN_OUTCOME_LABELS: Record<ScanOutcome, string> = {
  ai_signature: "Signature IA trouvée",
  clues: "Des indices, sans certitude",
  no_clue: "Aucun indice, ce qui ne prouve rien",
};
export const SCAN_OUTCOME_DESCRIPTIONS: Record<ScanOutcome, string> = {
  ai_signature: "Le fichier déclare lui-même avoir été produit par un outil d’IA.",
  clues: "Des éléments méritent une vérification. Aucun ne suffit à conclure seul.",
  no_clue: "Rien de suspect n’a été relevé. Une image peut pourtant être authentique et sortie de son contexte.",
};

export const AI_SOURCE_LABELS: Record<string, string> = {
  gemini: "Réponse de l’IA",
  fallback: "Réponse préparée (hors ligne)",
};
