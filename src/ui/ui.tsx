import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  RefreshControl,
  ScrollView,
  Text,
  type TextProps,
  TextInput,
  type TextInputProps,
  View,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { type Certainty, CERTAINTY_LABELS } from "@/lib/api";
import type { Icon } from "@/lib/icons";
import { fonts, radius, tracking, useTheme } from "@/lib/theme";

type Tone = "default" | "muted" | "title" | "label";

export function T({ tone = "default", style, ...rest }: TextProps & { tone?: Tone }) {
  const c = useTheme();
  const base = {
    default: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: c.foreground },
    muted: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.mutedForeground },
    title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 38, color: c.foreground, letterSpacing: tracking(30) },
    label: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: c.mutedForeground, letterSpacing: 0.6, textTransform: "uppercase" as const },
  }[tone];
  return <Text style={[base, style]} {...rest} />;
}

/** Un écran : zone sûre, défilement, tirer pour actualiser. `bottom` laisse la place de la barre d'onglets. */
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
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.background }}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} /> : undefined}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ style, ...rest }: ViewProps) {
  const c = useTheme();
  return <View style={[{ backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 8 }, style]} {...rest} />;
}

export function Button({
  label,
  icon: Icon,
  variant = "primary",
  busy,
  disabled,
  ...rest
}: PressableProps & { label: string; icon?: Icon; variant?: "primary" | "outline"; busy?: boolean }) {
  const c = useTheme();
  const off = !!disabled && !busy;
  const fg = off ? c.mutedForeground : variant === "primary" ? c.primaryForeground : c.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || busy, busy }}
      disabled={disabled || busy}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 20,
        borderRadius: radius.control,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: off ? c.muted : variant === "primary" ? (pressed ? c.primaryPressed : c.primary) : "transparent",
        borderWidth: variant === "outline" ? 1 : 0,
        borderColor: c.input,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
      {...rest}
    >
      {busy ? <ActivityIndicator color={fg} /> : Icon ? <Icon size={18} color={fg} /> : null}
      <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: fg }} numberOfLines={1}>
        {label}
      </Text>
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
  const bad = tone === "error";
  return (
    <View style={{ borderRadius: radius.card, padding: 14, backgroundColor: bad ? c.verdict.false.soft : c.muted }}>
      <T style={{ color: bad ? c.verdict.false.ink : c.foreground, fontSize: 15, lineHeight: 21 }}>{children}</T>
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 16,
        justifyContent: "center",
        borderRadius: radius.control,
        borderWidth: 1,
        borderColor: selected ? c.primary : c.border,
        backgroundColor: selected ? c.primary : c.card,
      }}
    >
      <Text style={{ fontFamily: selected ? fonts.semibold : fonts.medium, fontSize: 14, color: selected ? c.primaryForeground : c.foreground }}>{label}</Text>
    </Pressable>
  );
}

const CERTAINTY_VERDICT = {
  established: "true",
  probable: "unverifiable",
  uncertain: "misleading",
  contradicted: "false",
  insufficient: "unverifiable",
} as const;

/** La pastille d'une conclusion du juge : Établi, Probable, Incertain, Contredit, Informations insuffisantes. */
export function CertaintyBadge({ level }: { level: Certainty | null }) {
  const c = useTheme();
  if (!level) {
    return (
      <View style={{ alignSelf: "flex-start", borderRadius: radius.control, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: c.muted }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: c.mutedForeground }}>En cours</Text>
      </View>
    );
  }
  const tone = c.verdict[CERTAINTY_VERDICT[level]];
  return (
    <View style={{ alignSelf: "flex-start", borderRadius: radius.control, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: tone.soft }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: tone.ink }}>{CERTAINTY_LABELS[level]}</Text>
    </View>
  );
}

export function Loading() {
  const c = useTheme();
  return (
    <View style={{ paddingVertical: 32, alignItems: "center" }}>
      <ActivityIndicator color={c.primary} />
    </View>
  );
}
