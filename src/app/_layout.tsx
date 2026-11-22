import { BricolageGrotesque_400Regular, BricolageGrotesque_500Medium, BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import { CormorantGaramond_500Medium_Italic } from "@expo-google-fonts/cormorant-garamond";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppHeader } from "@/components/app-header";
import { SessionProvider, useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { AppChromeContext } from "@/ui/ui";

SplashScreen.preventAutoHideAsync().catch(() => null);

export default function RootLayout() {
  const [loaded] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    CormorantGaramond_500Medium_Italic,
  });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <Routes />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

// Connecté : les onglets et le dossier d'une affaire. Sinon : seulement l'écran de connexion.
function Routes() {
  const { status } = useSession();
  const c = useTheme();
  useEffect(() => {
    if (status !== "loading") SplashScreen.hideAsync().catch(() => null);
  }, [status]);
  if (status === "loading") return null;
  return (
    <>
      <StatusBar style="auto" />
      {/* Connecté : l'en-tête fixe au-dessus de chaque écran (il prend la zone sûre du haut). */}
      <AppChromeContext value={status === "in"}>
        <Stack screenOptions={{ headerShown: status === "in", header: () => <AppHeader />, contentStyle: { backgroundColor: c.background } }}>
          <Stack.Protected guard={status === "in"}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="case/[id]" />
          </Stack.Protected>
          <Stack.Protected guard={status === "out"}>
            <Stack.Screen name="sign-in" />
          </Stack.Protected>
        </Stack>
      </AppChromeContext>
    </>
  );
}
