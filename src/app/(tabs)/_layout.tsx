import { Tabs } from "expo-router/js-tabs";
import { type ColorValue, View } from "react-native";

import { AssistantButton } from "@/components/assistant-button";
import { InkTabBar, TAB_BAR_HEIGHT } from "@/components/tab-bar";
import { Gear, Graph, Newspaper, Scan, Siren } from "@/lib/icons";
import { useTheme } from "@/lib/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabIcon = typeof Scan;

/** La barre du bas, dans l'ordre et avec les noms du site (sans tribunal ni jeu) : le fil, les
 * enquêtes, le scan, les alertes, le compte. L'assistant flotte au-dessus, comme sur le site. */
export default function TabsLayout() {
  const c = useTheme();
  const { bottom } = useSafeAreaInsets();
  const icon =
    (Icon: TabIcon) =>
    // eslint-disable-next-line react/display-name -- une fonction de rendu pour un onglet, pas un composant
    ({ color }: { color: ColorValue }) => <Icon size={22} color={String(color)} />;
  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Tabs tabBar={(props) => <InkTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.background } }}>
        <Tabs.Screen name="index" options={{ title: "Fil", tabBarIcon: icon(Newspaper) }} />
        <Tabs.Screen name="cases" options={{ title: "Enquêtes", tabBarIcon: icon(Graph) }} />
        <Tabs.Screen name="scan" options={{ title: "Scan", tabBarIcon: icon(Scan) }} />
        <Tabs.Screen name="reports" options={{ title: "Alertes", tabBarIcon: icon(Siren) }} />
        <Tabs.Screen name="account" options={{ title: "Compte", tabBarIcon: icon(Gear) }} />
      </Tabs>
      <AssistantButton bottom={TAB_BAR_HEIGHT + bottom + 14} />
    </View>
  );
}
