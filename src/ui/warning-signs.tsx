import { View } from "react-native";

import type { Signal } from "@/lib/api";
import { Warning } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { ScaledText, T, ToneTag, styles } from "@/ui/ui";

/** Les signes d'alerte d'un message, lus dans ses mots (sans IA) : son ton, et le danger s'il
 * continue de circuler. Chaque signe cite le passage. Jamais un verdict. Mêmes mots que le bloc
 * WarningSigns du site. */
export function WarningSigns({ signals, title = "Signes d’alerte dans le message" }: { signals: Signal[]; title?: string }) {
  const c = useTheme();
  const signs = signals.flatMap((signal) => signal.signs);
  return (
    <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: radius.card, backgroundColor: c.card, padding: 14, gap: 10 }}>
      <View style={[styles.row, { gap: 8 }]}>
        <Warning size={20} color={c.foreground} />
        <T accessibilityRole="header" style={{ fontFamily: fonts.semibold, fontSize: 17, flex: 1 }}>
          {title}
        </T>
      </View>
      <View style={styles.wrap}>
        {signals.map((signal) => (
          <ToneTag key={signal.label} label={signal.label} tone={signal.tone} />
        ))}
      </View>
      {signs.length === 0 ? (
        <T tone="muted">Aucun signe d’alerte dans les mots du message. Cela ne dit rien de sa vérité.</T>
      ) : (
        <View style={styles.wrap}>
          {signs.map((sign) => (
            <View key={`${sign.label}-${sign.quote}`} style={{ backgroundColor: c.muted, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
              <T style={{ fontSize: 14 }}>
                <ScaledText style={{ color: c.mutedForeground, fontSize: 14 }}>{sign.label} : </ScaledText>
                <ScaledText style={{ fontFamily: fonts.quote, fontSize: 17 }}>« {sign.quote} »</ScaledText>
              </T>
            </View>
          ))}
        </View>
      )}
      <T tone="muted" style={{ fontSize: 13 }}>
        Relevé dans les mots du message, sans IA. Un ton alarmant invite à vérifier, il ne prouve pas que l’information est fausse.
      </T>
    </View>
  );
}
