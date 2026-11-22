import { ApiError, readError } from "@/lib/api-core";
import { API_URL } from "@/lib/config";

export { ApiError, caseIdFrom, readError } from "@/lib/api-core";

// Le client de l'API de Vyra (`docs/API-MOBILE.md` du dépôt vyra). Une erreur renvoyée par le site
// (`{ error: { code, message } }`) devient une ApiError ; une panne réseau devient NETWORK.

let token: string | null = null;
export const setToken = (value: string | null) => {
  token = value;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
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

