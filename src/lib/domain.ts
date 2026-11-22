// Les valeurs du domaine et leurs libellés : une copie fidèle de web/src/lib/domain.ts (dépôt vyra).
// Ne pas les réécrire à la main : `domain.test.ts` compare cette copie au site quand le dépôt vyra
// est à côté (../vyra). Seuls les libellés dont l’application a besoin sont repris.

export const REPORT_REASONS = [
  "fake",
  "misleading",
  "out_of_context",
  "generated_media",
  "scam",
] as const;
export const REPORT_DAILY_LIMIT = 10;
export const REPORT_CASE_THRESHOLD = 5;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const PROFILE_ROLE_LABELS = {
  admin: "Vérificateur",
  member: "Citoyen",
} as const;

export const CERTAINTY_LABELS = {
  established: "Établi",
  probable: "Probable",
  uncertain: "Incertain",
  contradicted: "Contredit",
  insufficient: "Informations insuffisantes",
} as const;

export const CERTAINTY_CRITERIA = {
  established: "Au moins deux pièces indépendantes concordent, aucune ne contredit.",
  probable: "Une pièce solide, rien ne contredit.",
  uncertain: "Des pièces solides se contredisent.",
  contradicted: "Au moins une pièce solide contredit l’information.",
  insufficient: "Aucune pièce solide.",
} as const;

export const CASE_KIND_LABELS = {
  real: "Réelle",
  fictional: "Fictive (exercice)",
} as const;

export const CASE_STATUS_LABELS = {
  open: "Ouverte",
  investigating: "En enquête",
  in_hearing: "En audience",
  concluded: "Conclue",
} as const;

export const CASE_STATUS_TONES = {
  open: "neutral",
  investigating: "info",
  in_hearing: "warning",
  concluded: "success",
} as const;

export const CHANGE_TYPE_LABELS = {
  shared_unchanged: "Repris sans changement",
  title_changed: "Titre changé",
  figure_changed: "Chiffre ou date modifié",
  image_added: "Image ajoutée hors sujet",
  passage_cut: "Passage coupé",
  translated: "Traduit",
  tone_hardened: "Ton durci",
  contradicts: "Dément l’information",
  related: "Même sujet, autre fait",
} as const;

export const CHANGE_TYPE_TONES = {
  shared_unchanged: "neutral",
  title_changed: "info",
  figure_changed: "danger",
  image_added: "warning",
  passage_cut: "warning",
  translated: "info",
  tone_hardened: "danger",
  contradicts: "success",
  related: "neutral",
} as const;

export const SOURCE_KIND_LABELS = {
  fact_checker: "Vérificateur de faits",
  press: "Presse reconnue",
  official: "Source officielle",
  media: "Média",
  website: "Site web",
  blog: "Blog",
  forum: "Forum",
  social: "Réseau social",
  messaging: "Messagerie",
  unknown: "Source inconnue",
} as const;

export const SOURCE_KIND_TONES = {
  fact_checker: "success",
  press: "success",
  official: "success",
  media: "info",
  website: "neutral",
  blog: "neutral",
  forum: "warning",
  social: "warning",
  messaging: "danger",
  unknown: "neutral",
} as const;

export const MATCH_KIND_LABELS = {
  ai: "Même fait, confirmé par l’IA",
  meaning: "Proche par le sens (l’IA n’a pas pu confirmer)",
  words: "Mêmes mots (IA indisponible)",
} as const;

export const EVIDENCE_STANCE_LABELS = {
  supports: "Confirme",
  contradicts: "Contredit",
  context: "Contexte",
} as const;

export const EVIDENCE_STANCE_TONES = {
  supports: "success",
  contradicts: "danger",
  context: "neutral",
} as const;

export const EVIDENCE_STRENGTH_LABELS = {
  solid: "Solide",
  weak: "Fragile",
} as const;

export const AI_SOURCE_LABELS = {
  gemini: "Réponse de l’IA",
  fallback: "Réponse préparée (hors ligne)",
} as const;

export const REPORT_REASON_LABELS = {
  fake: "Faux",
  misleading: "Trompeur",
  out_of_context: "Sorti de son contexte",
  generated_media: "Image ou voix générée",
  scam: "Arnaque",
} as const;

export const REPORT_STATE_LABELS = {
  received: "Reçu",
  grouped: "Regroupé",
  verifying: "En vérification",
  concluded: "Conclu",
} as const;

export const REPORT_STATE_TONES = {
  received: "neutral",
  grouped: "info",
  verifying: "warning",
  concluded: "success",
} as const;

export const SCAN_OUTCOME_LABELS = {
  ai_signature: "Signature IA trouvée",
  clues: "Des indices, sans certitude",
  no_clue: "Aucun indice, ce qui ne prouve rien",
} as const;

export const SCAN_OUTCOME_DESCRIPTIONS = {
  ai_signature: "Le fichier déclare lui-même avoir été produit par un outil d’IA.",
  clues: "Des éléments méritent une vérification. Aucun ne suffit à conclure seul.",
  no_clue:
    "Rien de suspect n’a été relevé. Une image peut pourtant être authentique et sortie de son contexte.",
} as const;

export const FEED_STATUS_LABELS = {
  unverified: "Non vérifié",
  reported: "Signalé",
  verifying: "En vérification",
  concluded: "Conclu",
} as const;

export const FEED_STATUS_TONES = {
  unverified: "neutral",
  reported: "warning",
  verifying: "info",
  concluded: "success",
} as const;

export const FEED_REGION_LABELS = {
  mg: "Madagascar",
  world: "Monde",
} as const;

export const FEED_KIND_LABELS = {
  press: "Presse",
  tv: "Télévision",
  facebook: "Facebook",
  social: "Réseau social",
  trend: "Tendance",
  factcheck: "Vérification",
} as const;

export const FEED_VIEW_LABELS = {
  all: "Tout",
  local: "Madagascar",
  world: "Monde",
  unofficial: "Réseaux sociaux",
  checked: "Analysées",
} as const;

export const FEED_REACH_UNITS = {
  press: null,
  tv: "vues",
  // Vidéos seulement : Facebook ne donne pas la portée d"un post écrit.
  facebook: "vues",
  social: "partages",
  trend: "recherches",
  factcheck: null,
} as const;
