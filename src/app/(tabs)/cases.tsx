import { useRouter } from "expo-router";
import { Pressable } from "react-native";

import type { CaseSummary } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { CertaintyBadge, Card, Loading, Notice, Screen, T } from "@/ui/ui";

/** Les affaires : une information suspecte et tout ce qu'on a trouvé sur elle. */
export default function Cases() {
  const router = useRouter();
  const { data, error, isLoading, isValidating, mutate } = useApi<{ cases: CaseSummary[] }>("/cases");
  return (
    <Screen onRefresh={() => mutate()} refreshing={isValidating && !isLoading}>
      <T tone="title">Affaires</T>
      {error && <Notice tone="error">{error.message}</Notice>}
      {isLoading && <Loading />}
      {data?.cases.map((item) => (
        <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/case/[id]", params: { id: item.id } })}>
          <Card>
            <CertaintyBadge level={item.certainty} />
            <T style={{ fontFamily: "BricolageGrotesque_700Bold", fontSize: 19, lineHeight: 25 }}>{item.title}</T>
            <T tone="muted" numberOfLines={3}>
              « {item.claim} »
            </T>
            {item.kind === "fictional" && <T tone="label">Affaire d’exercice</T>}
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
