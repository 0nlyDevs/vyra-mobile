import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, View } from "react-native";

import type { FeedItem } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { fonts, useTheme } from "@/lib/theme";
import { CertaintyBadge, Chip, Loading, Notice, PressCard, Screen, T, styles } from "@/ui/ui";

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
  const c = useTheme();
  const [region, setRegion] = useState<Region>("mg");
  const { data, error, isLoading, isValidating, mutate } = useApi<{ items: FeedItem[] }>(`/feed?region=${region}`);

  return (
    <Screen onRefresh={() => mutate()} refreshing={isValidating && !isLoading}>
      <View style={{ gap: 6 }}>
        <T tone="title">Fil d’actualité</T>
        <T tone="muted">Ce qui circule vraiment, avec l’état de vérification de chaque publication.</T>
      </View>
      <View style={styles.row}>
        <Chip label="Madagascar" selected={region === "mg"} onPress={() => setRegion("mg")} />
        <Chip label="Monde" selected={region === "world"} onPress={() => setRegion("world")} />
      </View>
      {error && <Notice tone="error">{error.message}</Notice>}
      {isLoading && <Loading />}
      {data && data.items.length === 0 && <Notice>Aucune publication pour l’instant. Tirez pour actualiser.</Notice>}
      {data?.items.map((item) => (
        <PressCard
          key={item.id}
          accessibilityHint={item.case ? "Ouvre l’affaire" : "Ouvre la publication"}
          onPress={() => (item.case ? router.push({ pathname: "/case/[id]", params: { id: item.case.id } }) : Linking.openURL(item.url))}
        >
          <T tone="tabular" style={{ color: c.mutedForeground, fontSize: 12 }} numberOfLines={1}>
            {item.sourceName}  ·  {age(item.publishedAt)}
          </T>
          {item.title && (
            <T style={{ fontFamily: fonts.bold, fontSize: 18, lineHeight: 25 }} numberOfLines={3}>
              {item.title}
            </T>
          )}
          <T numberOfLines={4} style={{ color: item.title ? c.mutedForeground : c.foreground }}>
            {item.body}
          </T>
          <View style={[styles.row, { gap: 10, flexWrap: "wrap" }]}>
            <CertaintyBadge level={item.case?.certainty ?? null} />
            {item.reporterCount > 0 && (
              <T tone="muted">
                {item.reporterCount} signalement{item.reporterCount > 1 ? "s" : ""}
              </T>
            )}
          </View>
        </PressCard>
      ))}
    </Screen>
  );
}
