import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ArrowLeft } from "@/lib/icons";
import { useSession } from "@/lib/session";
import { fonts, useTheme } from "@/lib/theme";

/** Les onglets ont chacun leur place dans la barre du bas ; ailleurs, l'en-tête offre le retour. */
const ROOTS = ["/", "/cases", "/check", "/assistant", "/account"];

/** L'en-tête fixe de Checky, hors de la zone qui défile : la marque, le nom de la personne, le retour. */
export function AppHeader() {
  const c = useTheme();
  const router = useRouter();
  const path = usePathname();
  const { profile } = useSession();
  const root = ROOTS.includes(path);
  const control = { minHeight: 44, minWidth: 44, paddingHorizontal: 10, flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, borderRadius: 99 };
  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: c.card }}>
      <View style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: c.border }}>
        {!root && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={({ pressed }) => [control, { backgroundColor: pressed ? c.accent : "transparent" }]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          >
            <ArrowLeft size={22} color={c.foreground} />
          </Pressable>
        )}
        <Pressable accessibilityRole="button" accessibilityLabel="Accueil" onPress={() => router.navigate("/")} style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6 }}>
          <Text allowFontScaling={false} style={{ fontFamily: fonts.display, fontSize: 25, letterSpacing: -1, color: c.foreground }}>
            Vyra<Text style={{ fontFamily: fonts.quote }}>.</Text>
          </Text>
          <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.medium, fontSize: 11, color: c.mutedForeground }}>
            {profile ? profile.name : "Vérifier sur pièces"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
