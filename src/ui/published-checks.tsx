import { Linking, Pressable, View } from "react-native";

import { ArrowSquareOut, SealCheck } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { Section, T, styles } from "@/ui/ui";

type PublishedCheck = { url?: string; title?: string; publisher?: string; rating?: string | null };

/** Les vérifications déjà publiées par des vérificateurs de faits, relayées telles quelles. */
export function PublishedChecks({ checks, title = "Vérifications déjà publiées", empty }: { checks: PublishedCheck[]; title?: string; empty?: string }) {
  const c = useTheme();
  if (checks.length === 0 && !empty) return null;
  return (
    <Section title={title} note="Relayé tel quel, avec les mots du vérificateur.">
      {checks.length === 0 && <T tone="muted">{empty}</T>}
      {checks.map((check, index) => (
        <View key={`${check.url ?? ""}${index}`} style={{ borderWidth: 1, borderColor: c.border, borderRadius: radius.card, backgroundColor: c.card, padding: 14, gap: 8 }}>
          <View style={[styles.row, { gap: 8 }]}>
            <SealCheck size={20} color={c.foreground} />
            <T style={{ fontFamily: fonts.semibold, flex: 1 }}>{check.publisher ?? "Vérificateur"}</T>
          </View>
          {check.rating ? <T style={{ fontFamily: fonts.bold }}>« {check.rating} »</T> : null}
          {check.url ? (
            <Pressable accessibilityRole="link" hitSlop={8} onPress={() => check.url && Linking.openURL(check.url)} style={[styles.row, { gap: 6, alignSelf: "flex-start" }]}>
              <T style={{ fontFamily: fonts.semibold, textDecorationLine: "underline", flexShrink: 1 }}>{check.title || "Lire la vérification"}</T>
              <ArrowSquareOut size={16} color={c.foreground} />
            </Pressable>
          ) : null}
        </View>
      ))}
    </Section>
  );
}
