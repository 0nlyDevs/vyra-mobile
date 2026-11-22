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

export type FeedStatus = "unverified" | "reported" | "verifying" | "concluded";
export type FeedView = "all" | "local" | "world" | "unofficial" | "checked";
export type FeedTopic = { id: string; label: string; sources: number };

export type FeedItem = {
  id: string;
  url: string;
  kind: "press" | "tv" | "facebook" | "social" | "trend" | "factcheck";
  region: "mg" | "world";
  sourceName: string;
  author: string | null;
  title: string | null;
  body: string;
  imageUrl: string | null;
  publishedAt: string;
  case: { id: string; status: string; certainty: Certainty | null; conclusion: string | null } | null;
  reporterCount: number;
  /** L'état de vérification, calculé par le site comme sur /feed. */
  status?: FeedStatus;
  /** Le sujet repris par plusieurs sources dont la publication fait partie. */
  topic?: FeedTopic | null;
};

/** Le fil rangé comme la page /feed du site : la une, trois histoires, le reste. */
export type Feed = {
  region: "mg" | "world";
  view: FeedView;
  views: FeedView[];
  focus: FeedTopic | null;
  lead: FeedItem | null;
  sides: FeedItem[];
  rest: FeedItem[];
  items: FeedItem[];
  topics: FeedTopic[];
  trends: FeedItem[];
  empty: boolean;
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

export type SourceKind = keyof typeof import("@/lib/domain").SOURCE_KIND_LABELS;
export type ChangeType = keyof typeof import("@/lib/domain").CHANGE_TYPE_LABELS;
export type Signal = { label: string; tone: string; signs: { label: string; quote: string }[] };

export type CaseFile = CaseSummary & {
  versions: {
    id: string;
    position: number;
    content: string;
    sourceName: string;
    sourceUrl: string | null;
    publishedAt: string | null;
    imagePath?: string | null;
    sourceKind?: SourceKind;
  }[];
  links: { id: string; fromVersionId: string; toVersionId: string; changeType: ChangeType; note: string; confidence: string }[];
  evidence: {
    id: string;
    number: number;
    title: string;
    content: string;
    sourceName: string;
    sourceUrl: string | null;
    publishedAt: string | null;
    stance: "supports" | "contradicts" | "context";
    strength: "solid" | "weak";
    sourceKind?: SourceKind;
  }[];
  /** Les signes d'alerte de l'information, relevés sans IA. */
  signals?: Signal[];
};

/** Nouvelle analyse : l'affaire retrouvée (et comment) ou créée. */
export type Opened = { caseId: string; matchedBy: "ai" | "meaning" | "words" | null; reason: string | null };

export type WebSearchResult = { status: "found" | "nothing_found" | "prepared"; kept: number; contradicting: number };
export type FactCheck = { url: string; title: string; publisher: string; rating: string | null; claim: string | null; excerpt: string; published_at: string | null };
export type WikipediaArticle = { url: string; title: string; language: string; summary: string };
export type FactChecks = { factChecks: FactCheck[]; wikipedia: WikipediaArticle[]; searched: boolean };

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
  judged: { id?: string; url: string; title: string; certainty?: Certainty; label: string; tone: string; conclusion: string | null } | null;
  signals: Signal[];
  factChecks: { title?: string; publisher?: string; url?: string; rating?: string | null }[];
};

// ---------- Alertes ----------

export type ReportState = "received" | "grouped" | "verifying" | "concluded";
export type ReportReasonKey = import("@/lib/domain").ReportReason;
export type MyReport = {
  id: string;
  content: string;
  url: string | null;
  reason: ReportReasonKey;
  createdAt: string;
  groupTitle: string;
  caseId: string | null;
  reporterCount: number;
  state: ReportState;
};
export type ReportGroup = {
  id: string;
  title: string;
  summary: string | null;
  caseId: string | null;
  reporterCount: number;
  state: ReportState;
  reports: { id: string; content: string; url: string | null; reason: ReportReasonKey; description: string | null; createdAt: string; reporterName: string | null }[];
};
export type Reports = { mine: MyReport[]; groups: ReportGroup[]; isVerifier: boolean };
export type ReportOutcome = { reporterCount: number; caseId: string | null };

// ---------- Scan d'un lien ----------

export type LinkView = {
  url: string;
  site: string;
  title: string;
  publishedAt: string | null;
  daysOld: number | null;
  text: string;
  claims: string[];
  mainClaim: string;
  needsText: boolean;
  aiSource: "gemini" | "fallback";
  factChecks: FactCheck[];
  searched: boolean;
};

export type DemoProfile = { id: string; name: string; role: string; headline: string };

export { AI_SOURCE_LABELS, CERTAINTY_LABELS, SCAN_OUTCOME_DESCRIPTIONS, SCAN_OUTCOME_LABELS } from "@/lib/domain";


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
