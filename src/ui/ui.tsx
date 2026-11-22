import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  type PressableProps,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  type TextProps,
  TextInput,
  type TextInputProps,
  View,
  type ViewProps,
} from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { type Certainty, CERTAINTY_LABELS } from "@/lib/api";
import { CASE_STATUS_LABELS } from "@/lib/domain";
import { Check, CheckCircle, CircleDashed, type Icon, Info, Question, SpinnerGap, Warning, X, XCircle } from "@/lib/icons";
import { usePreferences, useTextScale } from "@/lib/preferences";
import { fonts, radius, tracking, useTheme } from "@/lib/theme";

// Le kit d'interface « encre et papier » : l'encre est l'action, la couleur n'appartient
// qu'aux verdicts, toujours avec une icône et un mot.

/** Vrai quand l'en-tête fixe (AppHeader) est affiché : il prend déjà la zone sûre du haut. */
export const AppChromeContext = createContext(false);
export const useAppChrome = () => useContext(AppChromeContext);

type Tone = "default" | "muted" | "title" | "label" | "tabular";

/** Un texte à la taille choisie dans Compte (A− / A+, comme sur le site) : la taille et
 * l'interligne suivent le réglage. Tout le texte de l'application passe par ici. */
export function ScaledText({ style, ...rest }: TextProps) {
  const scale = useTextScale();
  if (scale === 1) return <Text style={style} {...rest} />;
  const flat = StyleSheet.flatten(style) ?? {};
  const sized = {
    ...(flat.fontSize ? { fontSize: Math.round(flat.fontSize * scale * 10) / 10 } : {}),
    ...(flat.lineHeight ? { lineHeight: Math.round(flat.lineHeight * scale) } : {}),
  };
  return <Text style={[flat, sized]} {...rest} />;
}

export function T({ tone = "default", style, ...rest }: TextProps & { tone?: Tone }) {
  const c = useTheme();
  const base = {
    default: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: c.foreground },
    muted: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.mutedForeground },
    title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 38, color: c.foreground, letterSpacing: tracking(30) },
    label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: c.mutedForeground, letterSpacing: 0.4, textTransform: "uppercase" as const },
    tabular: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20, color: c.foreground, fontVariant: ["tabular-nums" as const] },
  }[tone];
  return <ScaledText style={[base, style]} {...rest} />;
}

/** Une citation mot pour mot : le Cormorant italique, réservé aux passages cités. */
export function Quote({ children, style, ...rest }: TextProps & { children: ReactNode }) {
  const c = useTheme();
  return (
    <ScaledText style={[{ fontFamily: fonts.quote, fontSize: 19, lineHeight: 25, color: c.foreground }, style]} {...rest}>
      « {children} »
    </ScaledText>
  );
}

/** Un écran : zone sûre (sauf sous l'en-tête fixe), clavier évité, défilement, tirer pour actualiser. */
export function Screen({
  children,
  onRefresh,
  refreshing = false,
  scroll = true,
}: {
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  scroll?: boolean;
}) {
  const c = useTheme();
  const chrome = useAppChrome();
  return (
    <SafeAreaView edges={chrome ? [] : ["top"]} style={{ flex: 1, backgroundColor: c.background }}>
      {scroll ? (
        // L'application va d'un bord à l'autre : le champ en cours de saisie est remonté au-dessus du clavier.
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            // En bas, la place du bouton de l'assistant qui flotte au-dessus du contenu.
            contentContainerStyle={{ padding: 16, paddingBottom: 104, gap: 20 }}
            refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.foreground} colors={[c.foreground]} /> : undefined}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ style, ...rest }: ViewProps) {
  const c = useTheme();
  return <View style={[{ backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 10 }, style]} {...rest} />;
}

/** Une carte qu'on touche : elle s'enfonce un peu sous le doigt. */
export function PressCard({ style, children, ...rest }: PressableProps & { style?: ViewProps["style"]; children: ReactNode }) {
  const c = useTheme();
  const { eco } = usePreferences();
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        { backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: radius.card, padding: 18, gap: 14, transform: [{ scale: pressed && !eco ? 0.97 : 1 }], opacity: pressed ? 0.9 : 1 },
        style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

type ButtonProps = PressableProps & { label: string; icon?: Icon; variant?: "primary" | "outline" | "ghost"; busy?: boolean };

export function Button({ label, icon: Glyph, variant = "primary", busy, disabled, style, ...rest }: ButtonProps) {
  const c = useTheme();
  const { eco } = usePreferences();
  const off = !!disabled && !busy;
  const fg = off ? c.mutedForeground : variant === "primary" ? c.primaryForeground : c.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || busy, busy }}
      disabled={disabled || busy}
      style={(state) => [
        {
          minHeight: 48,
          paddingHorizontal: 20,
          borderRadius: radius.control,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: off ? c.muted : variant === "primary" ? (state.pressed ? c.primaryPressed : c.primary) : state.pressed ? c.accent : "transparent",
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: c.input,
          transform: [{ scale: state.pressed && !eco ? 0.97 : 1 }],
        },
        typeof style === "function" ? style(state) : style,
      ]}
      {...rest}
    >
      {busy ? <ActivityIndicator color={fg} /> : Glyph ? <Glyph size={18} color={fg} style={{ flexShrink: 0 }} /> : null}
      {!!label && (
        <ScaledText style={{ fontFamily: fonts.semibold, fontSize: 16, color: fg, flexShrink: 1, textAlign: "center" }} numberOfLines={1}>
          {label}
        </ScaledText>
      )}
    </Pressable>
  );
}

export function Field({ label, style, ...rest }: TextInputProps & { label?: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label && <T style={{ fontFamily: fonts.medium, fontSize: 15 }}>{label}</T>}
      <TextInput
        placeholderTextColor={c.mutedForeground}
        selectionColor={c.primary + "59"}
        cursorColor={c.primary}
        style={[
          {
            minHeight: 48,
            borderWidth: 1,
            borderColor: c.input,
            borderRadius: rest.multiline ? radius.card : radius.control,
            paddingHorizontal: 18,
            paddingVertical: 10,
            fontFamily: fonts.regular,
            fontSize: 16,
            color: c.foreground,
            backgroundColor: c.card,
            textAlignVertical: rest.multiline ? "top" : "center",
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
}

export function Notice({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "error" }) {
  const c = useTheme();
  return (
    <View
      accessibilityRole={tone === "error" ? "alert" : undefined}
      style={{
        flexDirection: "row",
        gap: 8,
        padding: 14,
        borderRadius: radius.card,
        backgroundColor: tone === "error" ? c.card : c.muted,
        borderWidth: tone === "error" ? 1 : 0,
        borderColor: c.destructive,
      }}
    >
      {tone === "error" && <Warning size={16} color={c.destructive} style={{ marginTop: 3 }} />}
      <T style={{ flex: 1, color: tone === "error" ? c.destructive : c.foreground, fontSize: 15 }}>{children}</T>
    </View>
  );
}

type Family = "true" | "misleading" | "false" | "unverifiable";

/** Chaque conclusion du juge dans une famille de verdict, comme sur le site (CERTAINTY_TONES de
 * web/src/lib/domain.ts) et dans l'extension. « Informations insuffisantes » reste neutre. */
const CERTAINTY_FAMILY: Record<Certainty, Family | "neutral"> = {
  established: "true",
  probable: "unverifiable",
  uncertain: "misleading",
  contradicted: "false",
  insufficient: "neutral",
};

const FAMILY_ICON: Record<Family | "neutral", Icon> = { true: Check, misleading: Warning, false: X, unverifiable: Question, neutral: Info };

/** La famille d'une conclusion, en couleurs : le neutre prend le gris et l'encre. */
function verdictColors(c: ReturnType<typeof useTheme>, level: Certainty) {
  const family = CERTAINTY_FAMILY[level];
  return family === "neutral" ? { fill: c.muted, on: c.foreground, soft: c.muted, ink: c.foreground } : c.verdict[family];
}

/** Jamais la couleur seule : l'icône et le mot. Un verdict du juge est plein (étiquette de 6 px). */
export function VerdictBadge({ level, large, bare }: { level: Certainty; large?: boolean; bare?: boolean }) {
  const c = useTheme();
  const v = verdictColors(c, level);
  const Glyph = FAMILY_ICON[CERTAINTY_FAMILY[level]];
  const fg = bare ? v.ink : v.on;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
        paddingHorizontal: bare ? 0 : large ? 12 : 8,
        paddingVertical: large ? 7 : 3,
        borderRadius: radius.tag,
        backgroundColor: bare ? "transparent" : v.fill,
      }}
    >
      <Glyph size={large ? 20 : 15} color={fg} />
      <ScaledText style={{ fontFamily: fonts.semibold, fontSize: large ? 18 : 14, color: fg }}>{CERTAINTY_LABELS[level]}</ScaledText>
    </View>
  );
}

/** Une affaire sans conclusion : son état (Ouverte, En enquête, En audience…), comme le badge du
 * site, à l'encre, jamais une couleur de vérité. Sans état connu : « Pas encore jugée ». */
export function CertaintyBadge({ level, status }: { level: Certainty | null; status?: string | null }) {
  const c = useTheme();
  if (level) return <VerdictBadge level={level} />;
  const label = status && status in CASE_STATUS_LABELS ? CASE_STATUS_LABELS[status as keyof typeof CASE_STATUS_LABELS] : "Pas encore jugée";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <CircleDashed size={15} color={c.mutedForeground} />
      <T tone="muted">{label}</T>
    </View>
  );
}

/** La conclusion du juge : cadre plein de 2 px à l'encre du verdict, sur sa teinte. */
export function VerdictPanel({ level, children }: { level: Certainty; children?: ReactNode }) {
  const c = useTheme();
  const v = verdictColors(c, level);
  return (
    <View style={{ gap: 10, padding: 14, borderRadius: radius.card, borderWidth: 2, borderColor: v.ink, backgroundColor: v.soft }}>
      <VerdictBadge level={level} large bare />
      <T style={{ fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: v.ink }}>Conclusion du juge, sur pièces</T>
      {children}
    </View>
  );
}

/** Le niveau d'alerte relevé dans les mots : à l'encre, jamais une couleur ni une icône de verdict
 * (cela ne dit rien de la vérité). Un avertissement quand des signes ont été trouvés. */
export function ToneTag({ label, tone }: { label: string; tone: string }) {
  const c = useTheme();
  const alert = tone === "warning" || tone === "danger";
  const Glyph = alert ? Warning : CircleDashed;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.tag,
        backgroundColor: alert ? c.card : c.muted,
        borderWidth: alert ? 1 : 0,
        borderColor: c.foreground,
      }}
    >
      <Glyph size={15} color={alert ? c.foreground : c.mutedForeground} />
      <ScaledText style={{ fontFamily: fonts.semibold, fontSize: 14, color: alert ? c.foreground : c.mutedForeground }}>{label}</ScaledText>
    </View>
  );
}

/** L'étape en cours tourne ; en mode éco, elle reste immobile. */
function Spinner({ color }: { color: string }) {
  const { eco } = usePreferences();
  const turn = useSharedValue(0);
  useEffect(() => {
    if (eco) return;
    turn.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1);
    return () => cancelAnimation(turn);
  }, [turn, eco]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value}deg` }] }));
  return (
    <Animated.View style={style}>
      <SpinnerGap size={18} color={color} />
    </Animated.View>
  );
}

export type StepState = "waiting" | "running" | "done" | "failed";

/** Une étape réelle d'une vérification : en attente, en cours, faite, échouée. Pas de faux progrès. */
export function Step({ label, state, detail }: { label: string; state: StepState; detail?: string }) {
  const c = useTheme();
  const color = state === "waiting" ? c.mutedForeground : c.foreground;
  return (
    <View accessible accessibilityLabel={`${label}${detail ? `, ${detail}` : ""}`} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <View style={{ width: 18, marginTop: 2 }}>
        {state === "running" ? (
          <Spinner color={c.foreground} />
        ) : state === "done" ? (
          <CheckCircle size={18} color={c.foreground} />
        ) : state === "failed" ? (
          <XCircle size={18} color={c.destructive} />
        ) : (
          <CircleDashed size={18} color={c.mutedForeground} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <T style={{ color, fontFamily: state === "running" ? fonts.semibold : fonts.regular }}>{label}</T>
        {!!detail && <T tone="muted">{detail}</T>}
      </View>
    </View>
  );
}

export function Section({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return (
    <View style={{ gap: 14, marginTop: 12, marginBottom: 8 }}>
      <View>
        <T accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 22, lineHeight: 29 }}>
          {title}
        </T>
        {note && <T tone="muted">{note}</T>}
      </View>
      {children}
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const c = useTheme();
  const { eco } = usePreferences();
  const [pressed, setPressed] = useState(false);
  const on = selected || pressed;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{
        minHeight: 44,
        paddingHorizontal: 16,
        justifyContent: "center",
        borderRadius: radius.control,
        borderWidth: 1,
        // Choisi : l'encre et son libellé apparié ; appuyé : primaryPressed.
        borderColor: on ? c.primary : c.border,
        backgroundColor: pressed ? c.primaryPressed : selected ? c.primary : c.card,
        transform: [{ scale: pressed && !eco ? 0.97 : 1 }],
      }}
    >
      <ScaledText style={{ fontFamily: selected ? fonts.semibold : fonts.medium, fontSize: 14, color: on ? c.primaryForeground : c.foreground }}>{label}</ScaledText>
    </Pressable>
  );
}

export function Loading() {
  const c = useTheme();
  return (
    <View style={{ paddingVertical: 32, alignItems: "center" }}>
      <ActivityIndicator color={c.foreground} />
    </View>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
