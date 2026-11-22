import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { kv } from "@/lib/kv";

// Les réglages de lecture, les mêmes que le menu du compte sur le site : le thème (clair, sombre,
// comme l'appareil), la taille du texte (A− / A+), le mode éco (moins d'animations) et le mode
// « Sans IA » (seuls les faits restent : pièces, informations du fichier, règle de certitude,
// annuaire ; ce que l'IA a lu ou rédigé est masqué). Gardés sur le téléphone.

export const THEME_CHOICES = ["light", "dark", "system"] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];
export const THEME_LABELS: Record<ThemeChoice, string> = { light: "Clair", dark: "Sombre", system: "Comme l’appareil" };

/** Les quatre tailles du site (`TEXT_SIZES`), rapportées à la taille normale. */
export const TEXT_SIZES = ["small", "normal", "large", "xlarge"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
// Sur le site : 100 %, 112,5 % (normal), 125 %, 137,5 %.
export const TEXT_SCALE: Record<TextSize, number> = { small: 100 / 112.5, normal: 1, large: 125 / 112.5, xlarge: 137.5 / 112.5 };

/** Les mêmes mots que le site (READING_LABELS de ReadingControls). */
export const READING_LABELS = {
  smaller: "Réduire la taille du texte",
  larger: "Agrandir la taille du texte",
  eco: "Mode éco : moins d’animations et d’effets",
  noAi: "Sans IA : n’afficher que les faits",
} as const;

const KEYS = { theme: "vyra.theme", text: "vyra.reading-text", eco: "vyra.reading-eco", noAi: "vyra.reading-no-ai" } as const;

type Preferences = {
  theme: ThemeChoice;
  textSize: TextSize;
  eco: boolean;
  noAi: boolean;
  setTheme: (value: ThemeChoice) => void;
  setTextSize: (value: TextSize) => void;
  setEco: (value: boolean) => void;
  setNoAi: (value: boolean) => void;
};

const noop = () => undefined;
const Ctx = createContext<Preferences>({
  theme: "system",
  textSize: "normal",
  eco: false,
  noAi: false,
  setTheme: noop,
  setTextSize: noop,
  setEco: noop,
  setNoAi: noop,
});

const isTheme = (value: string | null): value is ThemeChoice => THEME_CHOICES.some((item) => item === value);
const isTextSize = (value: string | null): value is TextSize => TEXT_SIZES.some((item) => item === value);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>("system");
  const [textSize, setTextSizeState] = useState<TextSize>("normal");
  const [eco, setEcoState] = useState(false);
  const [noAi, setNoAiState] = useState(false);

  useEffect(() => {
    Promise.all([kv.getItemAsync(KEYS.theme), kv.getItemAsync(KEYS.text), kv.getItemAsync(KEYS.eco), kv.getItemAsync(KEYS.noAi)])
      .then(([savedTheme, savedText, savedEco, savedNoAi]) => {
        if (isTheme(savedTheme)) setThemeState(savedTheme);
        if (isTextSize(savedText)) setTextSizeState(savedText);
        setEcoState(savedEco === "on");
        setNoAiState(savedNoAi === "on");
      })
      .catch(() => null);
  }, []);

  const setTheme = useCallback((value: ThemeChoice) => {
    setThemeState(value);
    kv.setItemAsync(KEYS.theme, value).catch(() => null);
  }, []);
  const setTextSize = useCallback((value: TextSize) => {
    setTextSizeState(value);
    kv.setItemAsync(KEYS.text, value).catch(() => null);
  }, []);
  const setEco = useCallback((value: boolean) => {
    setEcoState(value);
    kv.setItemAsync(KEYS.eco, value ? "on" : "off").catch(() => null);
  }, []);
  const setNoAi = useCallback((value: boolean) => {
    setNoAiState(value);
    kv.setItemAsync(KEYS.noAi, value ? "on" : "off").catch(() => null);
  }, []);

  const value = useMemo(
    () => ({ theme, textSize, eco, noAi, setTheme, setTextSize, setEco, setNoAi }),
    [theme, textSize, eco, noAi, setTheme, setTextSize, setEco, setNoAi],
  );
  return <Ctx value={value}>{children}</Ctx>;
}

export const usePreferences = () => useContext(Ctx);
export const useNoAi = () => {
  const { noAi, setNoAi } = useContext(Ctx);
  return { noAi, setNoAi };
};
/** Le facteur de taille du texte choisi (1 = normal). */
export const useTextScale = () => TEXT_SCALE[useContext(Ctx).textSize];
