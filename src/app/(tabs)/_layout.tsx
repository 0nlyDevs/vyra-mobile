import { Tabs } from "expo-router/js-tabs";
import { type ColorValue, View } from "react-native";

import { InkTabBar } from "@/components/tab-bar";
import { ChatTeardropText, Gear, ListChecks, Newspaper, Scan } from "@/lib/icons";
import { useTheme } from "@/lib/theme";

type TabIcon = typeof Scan;

/** La barre du bas : le fil, les affaires, la vérification rapide, l'assistant, le compte. */
export default function TabsLayout() {
  const c = useTheme();
  const icon =
    (Icon: TabIcon) =>
    // eslint-disable-next-line react/display-name -- une fonction de rendu pour un onglet, pas un composant
    ({ color }: { color: ColorValue }) => <Icon size={22} color={String(color)} />;
  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Tabs tabBar={(props) => <InkTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.background } }}>
        <Tabs.Screen name="index" options={{ title: "Fil", tabBarIcon: icon(Newspaper) }} />
        <Tabs.Screen name="cases" options={{ title: "Affaires", tabBarIcon: icon(ListChecks) }} />
        <Tabs.Screen name="check" options={{ title: "Vérifier", tabBarIcon: icon(Scan) }} />
        <Tabs.Screen name="assistant" options={{ title: "Assistant", tabBarIcon: icon(ChatTeardropText) }} />
        <Tabs.Screen name="account" options={{ title: "Compte", tabBarIcon: icon(Gear) }} />
      </Tabs>
    </View>
  );
}
