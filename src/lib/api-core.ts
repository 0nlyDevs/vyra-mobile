// La partie pure du client (sans réseau, sans alias de chemin) : testée sous `node --test`.

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  /** Les messages par champ d'un formulaire refusé (VALIDATION_FAILED), comme sur le site. */
  readonly fieldErrors?: Record<string, string[] | undefined>;

  constructor(code: string, message: string, status: number, fieldErrors?: Record<string, string[] | undefined>) {
    super(message);
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Lit le message d'une réponse en erreur, quelle qu'en soit la forme. */
export function readError(status: number, body: unknown): ApiError {
  const error = (body as { error?: { code?: string; message?: string; fieldErrors?: Record<string, string[] | undefined> } } | null)?.error;
  return new ApiError(error?.code ?? "ERROR", error?.message ?? "Une erreur est survenue.", status, error?.fieldErrors);
}


/** L'identifiant d'une affaire dans un lien du site (`/court/<id>`, `/cases/<id>`, `/check/<id>`). */
export function caseIdFrom(href: string): string | null {
  return href.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] ?? null;
}

/** Ce qu'on a tapé ou collé pour vérifier un sceau : le lien du QR (`?c=…&s=…`) ou le code
 * (`VY-XXXX-XXXX`, avec ou sans tirets). La requête à envoyer à `/seal/check`, ou null. */
export function sealQuery(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  const c = value.match(/[?&]c=([0-9a-f-]{36})/i)?.[1];
  const s = value.match(/[?&]s=([^&\s#]+)/)?.[1];
  if (c && s) return `c=${encodeURIComponent(c)}&s=${encodeURIComponent(decodeURIComponent(s))}`;
  return `code=${encodeURIComponent(value)}`;
}

/** Une seconde de vidéo en « m:ss ». */
export function formatSecond(second: number): string {
  const whole = Math.round(second);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** Un numéro malgache en groupes lisibles (« 034 12 345 67 ») ; un autre numéro reste tel quel. */
export function formatPhone(digits: string): string {
  const local = digits.startsWith("261") && digits.length === 12 ? `0${digits.slice(3)}` : digits.length === 9 ? `0${digits}` : digits;
  if (local.length !== 10) return digits;
  return `${local.slice(0, 3)} ${local.slice(3, 5)} ${local.slice(5, 8)} ${local.slice(8)}`;
}

/** Le contenu base64 et le type d'une data URL (copie protégée, image clé). */
export function splitDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const found = dataUrl.match(/^data:([^;,]+);base64,(.*)$/s);
  return found ? { mimeType: found[1], base64: found[2] } : null;
}

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** Une date ISO en français (« 12 mars 2019 »), sans dépendre de l'Intl du téléphone. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
