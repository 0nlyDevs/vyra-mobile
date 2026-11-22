import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, ScrollView, View } from "react-native";

import type { FeedItem } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { fonts } from "@/lib/theme";
import { Button, Chip, Loading, Notice, Screen, T, styles } from "@/ui/ui";
import { FeedRowItem, LeadCard, StoryCard } from "@/ui/feed-cards";

type Region = "mg" | "world";

const STORIES = 3;
const PAGE = 8;

/** La une : parmi les premières publications, une affaire en cours d'abord, puis celle qui a une image. */
function arrange(items: FeedItem[]) {
  const score = (item: FeedItem) => (item.case && item.case.certainty === null ? 3 : item.reporterCount > 0 ? 2 : 0) + (item.imageUrl ? 2.5 : 0);
  const ranked = items
    .slice(0, 16)
    .map((item, index) => ({ item, index, value: score(item) }))
    .sort((a, b) => b.value - a.value || a.index - b.index);
  const lead = ranked[0]?.item ?? null;
  const stories = ranked
    .slice(1, 1 + STORIES)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.item);
  const taken = new Set([lead, ...stories]);
  return { lead, stories, rest: items.filter((item) => !taken.has(item)) };
}

/** Le fil d'actualité : une grande, trois histoires qui défilent de côté, puis le reste en lignes. */
export default function Feed() {
  const router = useRouter();
  const [region, setRegion] = useState<Region>("mg");
  const [shown, setShown] = useState(PAGE);
  const { data, error, isLoading, isValidating, mutate } = useApi<{ items: FeedItem[] }>(`/feed?region=${region}`);
  const { lead, stories, rest } = useMemo(() => arrange(data?.items ?? []), [data]);

  const open = (item: FeedItem) => () => (item.case ? router.push({ pathname: "/case/[id]", params: { id: item.case.id } }) : Linking.openURL(item.url));
  const hint = (item: FeedItem) => (item.case ? "Ouvre l’affaire" : "Ouvre la publication");

  return (
    <Screen onRefresh={() => mutate()} refreshing={isValidating && !isLoading}>
      <View style={{ gap: 6 }}>
        <T tone="title">Fil d’actualité</T>
        <T tone="muted">Ce qui circule vraiment, avec l’état de vérification.</T>
      </View>
      <View style={styles.row}>
        <Chip label="Madagascar" selected={region === "mg"} onPress={() => setRegion("mg")} />
        <Chip label="Monde" selected={region === "world"} onPress={() => setRegion("world")} />
      </View>
      {error && <Notice tone="error">{error.message}</Notice>}
      {isLoading && <Loading />}
      {data && data.items.length === 0 && <Notice>Aucune publication pour l’instant. Tirez pour actualiser.</Notice>}
      {lead && <LeadCard item={lead} hint={hint(lead)} onPress={open(lead)} />}
      {stories.length > 0 && (
        // La rangée sort des marges de l'écran : elle défile de côté, la page ne s'allonge pas.
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {stories.map((item) => (
            <StoryCard key={item.id} item={item} hint={hint(item)} onPress={open(item)} />
          ))}
        </ScrollView>
      )}
      {rest.length > 0 && (
        <View>
          <T style={{ fontFamily: fonts.bold, fontSize: 20, marginBottom: 2 }}>Le reste du fil</T>
          {rest.slice(0, shown).map((item) => (
            <FeedRowItem key={item.id} item={item} hint={hint(item)} onPress={open(item)} />
          ))}
          {rest.length > shown && (
            <View style={{ marginTop: 16 }}>
              <Button label={`Afficher ${Math.min(PAGE, rest.length - shown)} de plus`} variant="outline" onPress={() => setShown((n) => n + PAGE)} />
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}
