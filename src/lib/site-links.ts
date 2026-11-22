// Un chemin du site (`/cases/<id>`, `/reports?text=…`) traduit en écran de l'application. Les
// propositions de l'assistant et les liens renvoyés par l'API sont des chemins du site : chacun a
// son écran ici, sauf le tribunal et le jeu, qui n'existent que sur le site (null : ouvrir le site).

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
// `/verifier/…` : les anciennes adresses du site, encore dans les QR des cartes déjà imprimées.
const CASE = new RegExp(`^/(?:cases|court|check|verifier)/(${UUID})$`, "i");

export type AppRoute = { pathname: string; params?: Record<string, string> };

function paramsOf(search: string, keys: string[]): Record<string, string> {
  const query = new URLSearchParams(search);
  const params: Record<string, string> = {};
  for (const key of keys) {
    const value = query.get(key);
    if (value) params[key] = value;
  }
  return params;
}

export function appRoute(href: string): AppRoute | null {
  const [path = "", search = ""] = href.replace(/^https?:\/\/[^/]+/i, "").split("?");
  const caseId = CASE.exec(path)?.[1];
  if (caseId) return { pathname: "/case/[id]", params: { id: caseId } };
  if (path === "/feed" || path === "/dashboard" || path === "/") return { pathname: "/" };
  if (path === "/cases") return { pathname: "/cases", params: paramsOf(search, ["information", "lien"]) };
  if (path === "/reports") return { pathname: "/reports", params: paramsOf(search, ["text", "url", "post"]) };
  if (path === "/scan") return { pathname: "/scan", params: paramsOf(search, ["tab", "q", "code"]) };
  if (path === "/check/seal" || path === "/verifier/sceau") {
    const params = paramsOf(search, ["code", "c", "s"]);
    return { pathname: "/scan", params: { tab: "seal", ...params } };
  }
  return null;
}
