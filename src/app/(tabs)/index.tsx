import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";

import type { FeedItem } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { CertaintyBadge, Chip, Card, Loading, Notice, Screen, T } from "@/ui/ui";

type Region = "mg" | "world";

function age(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 1440) return `il y a ${Math.round(minutes / 60)} h`;
  return `il y a ${Math.round(minutes / 1440)} j`;
}

/** Le fil d'actualité : ce qui circule vraiment, avec l'état de vérification de chaque publication. */
export default function Feed() {
  const router = useRouter();
  const [region, setRegion] = useState<Region>("mg");
  const { data, error, isLoading, isValidating, mutate } = useApi<{ items: FeedItem[] }>(`/feed?region=${region}`);

  return (
    <Screen onRefresh={() => mutate()} refreshing={isValidating && !isLoading}>
      <T tone="title">Fil d’actualité</T>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Chip label="Madagascar" selected={region === "mg"} onPress={() => setRegion("mg")} />
        <Chip label="Monde" selected={region === "world"} onPress={() => setRegion("world")} />
      </View>
      {error && <Notice tone="error">{error.message}</Notice>}
      {isLoading && <Loading />}
      {data && data.items.length === 0 && <Notice>Aucune publication pour l’instant. Tirez pour actualiser.</Notice>}
      {data?.items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          onPress={() => (item.case ? router.push({ pathname: "/case/[id]", params: { id: item.case.id } }) : Linking.openURL(item.url))}
        >
          <Card>
            <T tone="label">
              {item.sourceName} · {age(item.publishedAt)}
            </T>
            {item.title && <T style={{ fontFamily: "BricolageGrotesque_700Bold", fontSize: 18, lineHeight: 24 }}>{item.title}</T>}
            <T numberOfLines={4}>{item.body}</T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <CertaintyBadge level={item.case?.certainty ?? null} />
              {item.reporterCount > 0 && <T tone="muted">{item.reporterCount} signalement{item.reporterCount > 1 ? "s" : ""}</T>}
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
