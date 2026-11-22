// La partie pure du client (sans réseau, sans alias de chemin) : testée sous `node --test`.

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** Lit le message d'une réponse en erreur, quelle qu'en soit la forme. */
export function readError(status: number, body: unknown): ApiError {
  const error = (body as { error?: { code?: string; message?: string } } | null)?.error;
  return new ApiError(error?.code ?? "ERROR", error?.message ?? "Une erreur est survenue.", status);
}


/** L'identifiant d'une affaire dans un lien du site (`/court/<id>`, `/cases/<id>`, `/verifier/<id>`). */
export function caseIdFrom(href: string): string | null {
  return href.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] ?? null;
}
