import { useRouter } from "expo-router";
import { View } from "react-native";

import type { CaseSummary } from "@/lib/api";
import { fonts, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/use-api";
import { CertaintyBadge, Loading, Notice, PressCard, Quote, Screen, T, styles } from "@/ui/ui";

/** Les affaires : une information suspecte et tout ce qu'on a trouvé sur elle. */
export default function Cases() {
  const router = useRouter();
  const c = useTheme();
  const { data, error, isLoading, isValidating, mutate } = useApi<{ cases: CaseSummary[] }>("/cases");
  return (
    <Screen onRefresh={() => mutate()} refreshing={isValidating && !isLoading}>
      <View style={{ gap: 6 }}>
        <T tone="title">Affaires</T>
        <T tone="muted">Une information suspecte, ses versions retrouvées, ses pièces, puis la conclusion du juge.</T>
      </View>
      {error && <Notice tone="error">{error.message}</Notice>}
      {isLoading && <Loading />}
      {data && data.cases.length === 0 && <Notice>Aucune affaire pour l’instant.</Notice>}
      {data?.cases.map((item) => (
        <PressCard key={item.id} accessibilityHint="Ouvre le dossier" onPress={() => router.push({ pathname: "/case/[id]", params: { id: item.id } })}>
          <View style={[styles.row, { justifyContent: "space-between" }]}>
            <CertaintyBadge level={item.certainty} />
            {item.kind === "fictional" && <T tone="muted" style={{ fontSize: 12 }}>Affaire d’exercice</T>}
          </View>
          <T style={{ fontFamily: fonts.bold, fontSize: 18, lineHeight: 25 }} numberOfLines={3}>
            {item.title}
          </T>
          <Quote numberOfLines={3} style={{ fontSize: 17, lineHeight: 23, color: c.mutedForeground }}>
            {item.claim}
          </Quote>
        </PressCard>
      ))}
    </Screen>
  );
}
