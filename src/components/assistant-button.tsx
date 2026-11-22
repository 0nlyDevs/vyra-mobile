import { usePathname, useRouter } from "expo-router";
import { Pressable } from "react-native";

import { ChatCircleDots } from "@/lib/icons";
import { usePreferences } from "@/lib/preferences";
import { useTheme } from "@/lib/theme";

/** L'assistant, comme sur le site : une pastille d'encre en bas à droite de chaque écran, qui
 * ouvre la conversation par-dessus l'écran en cours (le contexte de la question). */
export function AssistantButton({ bottom = 16 }: { bottom?: number }) {
  const c = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { eco } = usePreferences();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ouvrir l’assistant"
      onPress={() => router.push({ pathname: "/assistant", params: { from: pathname } })}
      style={({ pressed }) => ({
        position: "absolute",
        right: 16,
        bottom,
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? c.primaryPressed : c.primary,
        borderWidth: 1,
        borderColor: c.border,
        transform: [{ scale: pressed && !eco ? 0.95 : 1 }],
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      })}
    >
      <ChatCircleDots size={28} color={c.primaryForeground} />
    </Pressable>
  );
}
