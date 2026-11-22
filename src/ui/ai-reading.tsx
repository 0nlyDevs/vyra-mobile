import type { ReactNode } from "react";
import { View } from "react-native";

import { EyeSlash, Sparkle } from "@/lib/icons";
import { useNoAi } from "@/lib/no-ai";
import { fonts, radius, useTheme } from "@/lib/theme";
import { T } from "@/ui/ui";

/**
 * Ce que l'IA a lu, formulé ou déduit : encadré en pointillés, quand les faits (pièces, fichier,
 * règle de certitude, annuaire) gardent un trait plein. Comme `AiReading` du site. En mode « Sans
 * IA » (écran Compte), le contenu disparaît et une ligne dit ce qui est masqué.
 */
export function AiReading({
  children,
  label = "Lecture de l’IA",
  title,
  showLabel = true,
}: {
  children: ReactNode;
  label?: string;
  /** Un titre d'étape, comme les étapes de faits ; le libellé ne sert alors qu'au mode Sans IA. */
  title?: string;
  showLabel?: boolean;
}) {
  const c = useTheme();
  const { noAi } = useNoAi();
  return (
    <View style={{ gap: 10, padding: 14, borderRadius: radius.card, borderWidth: 1, borderStyle: "dashed", borderColor: c.foreground + "73" }}>
      {noAi ? (
        <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
          <EyeSlash size={16} color={c.mutedForeground} style={{ marginTop: 2 }} />
          <T tone="muted" style={{ flex: 1 }}>
            Masqué en mode Sans IA, qui n’affiche que les faits : {label}.
          </T>
        </View>
      ) : (
        <>
          {title ? (
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Sparkle size={20} color={c.foreground} />
              <T accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 17, flex: 1 }}>
                {title}
              </T>
            </View>
          ) : showLabel && (
            <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <Sparkle size={14} color={c.mutedForeground} />
              <T tone="muted" style={{ fontSize: 13 }}>
                {label}
              </T>
            </View>
          )}
          {children}
        </>
      )}
    </View>
  );
}
