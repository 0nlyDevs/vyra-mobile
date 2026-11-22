import { useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiError, type Feed, type FeedItem, type FeedView, post } from "@/lib/api";
import { FEED_REGION_LABELS, FEED_VIEW_LABELS } from "@/lib/domain";
import { ArrowLeft, ArrowSquareOut, Graph, Info, Siren, TrendUp } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/use-api";
import { FeedRowItem, FeedStatusMark, headline, LeadCard, StoryCard } from "@/ui/feed-cards";
import { Button, Chip, Loading, Notice, Screen, T, styles } from "@/ui/ui";

type Region = "mg" | "world";

const PAGE = 10;

/** Le texte repris dans le signalement : le titre et le corps, comme reportHrefOf du site. */
function reportParams(item: FeedItem) {
  const text = (item.title ? `${item.title}. ${item.body}` : item.body).slice(0, 600);
  return { post: item.id, text, url: item.url };
}

/** Les trois gestes d'une publication, comme sur le site : voir son affaire (ouverte au besoin),
 * la signaler, lire la source. */
function useOpenCase() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function open(item: FeedItem) {
    if (item.case) {
      router.push({ pathname: "/case/[id]", params: { id: item.case.id } });
      return;
    }
    setBusy(item.id);
    setError(null);
    try {
      const { caseId } = await post<{ caseId: string }>(`/feed/${item.id}/open`);
      router.push({ pathname: "/case/[id]", params: { id: caseId } });
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(null);
    }
  }
  return { open, busy, error };
}

function PostActions({ item, onDone }: { item: FeedItem; onDone?: () => void }) {
  const router = useRouter();
  const { open, busy, error } = useOpenCase();
  return (
    <View style={{ gap: 8 }}>
      <Button
        label="Voir l’affaire"
        icon={Graph}
        busy={busy === item.id}
        onPress={async () => {
          await open(item);
          onDone?.();
        }}
      />
      <View style={[styles.row, { gap: 8 }]}>
        <Button
          label="Signaler"
          icon={Siren}
          variant="outline"
          style={{ flex: 1 }}
          onPress={() => {
            onDone?.();
            router.navigate({ pathname: "/reports", params: reportParams(item) });
          }}
        />
        <Button label="Source" icon={ArrowSquareOut} variant="outline" style={{ flex: 1 }} onPress={() => Linking.openURL(item.url)} />
      </View>
      {error && <Notice tone="error">{error}</Notice>}
    </View>
  );
}

/** Une publication touchée dans la liste : ses trois gestes, dans un panneau en bas de l'écran. */
function ActionSheet({ item, onClose }: { item: FeedItem | null; onClose: () => void }) {
  const c = useTheme();
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={item !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Fermer" onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} />
      {item && (
        <View style={{ backgroundColor: c.background, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, padding: 16, paddingBottom: 16 + bottom, gap: 12 }}>
          <T style={{ fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 }} numberOfLines={4}>
            {headline(item)}
          </T>
          <T tone="muted">{item.sourceName}</T>
          <FeedStatusMark item={item} />
          <PostActions item={item} onDone={onClose} />
        </View>
      )}
    </Modal>
  );
}

/** Le fil d'actualité, rangé par le site comme la page /feed : la région, la vue, la une, trois
 * histoires qui défilent de côté, les sujets repris et les recherches qui montent, puis le reste. */
export default function FeedScreen() {
  const c = useTheme();
  const [region, setRegion] = useState<Region>("mg");
  const [view, setView] = useState<FeedView>("all");
  const [topic, setTopic] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  const [selected, setSelected] = useState<FeedItem | null>(null);
  const query = `/feed?region=${region}&vue=${view}${topic ? `&sujet=${topic}` : ""}`;
  const { data, error, isLoading, isValidating, mutate } = useApi<Feed>(query);
  const views: FeedView[] = data?.views ?? (region === "world" ? ["all", "unofficial", "checked"] : ["all", "local", "world", "unofficial", "checked"]);

  function chooseRegion(next: Region) {
    setRegion(next);
    setView("all");
    setTopic(null);
    setShown(PAGE);
  }

  return (
    <Screen onRefresh={() => mutate()} refreshing={isValidating && !isLoading}>
      <View style={{ gap: 6 }}>
        <View style={[styles.row, { gap: 8 }]}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary }} />
          <T tone="label">En direct · {FEED_REGION_LABELS[region]}</T>
        </View>
        <T tone="title">Fil d’actualité</T>
        <T tone="muted">Ce qui circule vraiment, officiel ou non, avec son état de vérification.</T>
      </View>
      {/* Une seule rangée de commandes : la région, puis la vue. Elle défile de côté. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        <Chip label="Madagascar" selected={region === "mg"} onPress={() => chooseRegion("mg")} />
        <Chip label="Monde" selected={region === "world"} onPress={() => chooseRegion("world")} />
        <View style={{ width: 1, backgroundColor: c.border, marginHorizontal: 4 }} />
        {views.map((option) => (
          <Chip
            key={option}
            label={option === "local" ? FEED_REGION_LABELS[region] : FEED_VIEW_LABELS[option]}
            selected={view === option && !topic}
            onPress={() => {
              setView(option);
              setTopic(null);
              setShown(PAGE);
            }}
          />
        ))}
      </ScrollView>
      {data?.focus && (
        <View style={{ gap: 6, padding: 14, borderRadius: radius.card, backgroundColor: c.muted }}>
          <T style={{ fontFamily: fonts.medium }}>
            Sujet repris par {data.focus.sources} sources : {data.focus.label}
          </T>
          <Pressable accessibilityRole="button" onPress={() => setTopic(null)} style={[styles.row, { gap: 6, alignSelf: "flex-start" }]}>
            <ArrowLeft size={16} color={c.foreground} />
            <T style={{ textDecorationLine: "underline" }}>Retour au fil</T>
          </Pressable>
        </View>
      )}
      {error && <Notice tone="error">{error.message}</Notice>}
      {isLoading && <Loading />}
      {data && !data.lead && (
        <Notice>{data.empty ? "Première lecture des sources en cours… Les publications apparaissent ici dès que les sources ont répondu." : "Aucune publication dans cette vue. Revenez à « Tout » pour en choisir une à vérifier."}</Notice>
      )}
      {data?.lead && (
        <LeadCard item={data.lead} hint="Ouvre les gestes de la publication" onPress={() => setSelected(data.lead)}>
          {data.lead.topic && !topic && (
            <Pressable accessibilityRole="button" onPress={() => setTopic(data.lead?.topic?.id ?? null)} style={{ alignSelf: "flex-start" }}>
              <T style={{ fontFamily: fonts.semibold, textDecorationLine: "underline" }}>Repris par {data.lead.topic.sources} sources</T>
            </Pressable>
          )}
          <PostActions item={data.lead} />
        </LeadCard>
      )}
      {data && data.sides.length > 0 && (
        // La rangée sort des marges de l'écran : elle défile de côté, la page ne s'allonge pas.
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {data.sides.map((item) => (
            <StoryCard key={item.id} item={item} hint="Ouvre les gestes de la publication" onPress={() => setSelected(item)} />
          ))}
        </ScrollView>
      )}
      {data && !topic && (data.topics.length > 0 || data.trends.length > 0) && (
        <View style={{ gap: 10 }}>
          {data.topics.length > 0 && (
            <>
              <T style={{ fontFamily: fonts.bold, fontSize: 18 }}>Sujets repris</T>
              {data.topics.map((item) => (
                <Pressable key={item.id} accessibilityRole="button" onPress={() => setTopic(item.id)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, paddingVertical: 6 })}>
                  <T numberOfLines={2} style={{ fontFamily: fonts.medium }}>
                    {item.label}
                  </T>
                  <T tone="muted">{item.sources} sources</T>
                </Pressable>
              ))}
            </>
          )}
          {data.trends.length > 0 && (
            <>
              <View style={[styles.row, { gap: 6 }]}>
                <TrendUp size={18} color={c.foreground} />
                <T style={{ fontFamily: fonts.bold, fontSize: 18 }}>Recherches qui montent</T>
              </View>
              <View style={styles.wrap}>
                {data.trends.map((item) => (
                  <Chip key={item.id} label={headline(item)} onPress={() => setSelected(item)} />
                ))}
              </View>
            </>
          )}
        </View>
      )}
      {data && data.rest.length > 0 && (
        <View>
          <T style={{ fontFamily: fonts.bold, fontSize: 20, marginBottom: 2 }}>
            Le reste du fil{"  "}
            <T tone="muted">{data.rest.length} publications</T>
          </T>
          {data.rest.slice(0, shown).map((item) => (
            <FeedRowItem key={item.id} item={item} hint="Ouvre les gestes de la publication" onPress={() => setSelected(item)} />
          ))}
          {data.rest.length > shown && (
            <View style={{ marginTop: 16 }}>
              <Button label={`Afficher ${Math.min(PAGE, data.rest.length - shown)} de plus`} variant="outline" onPress={() => setShown((n) => n + PAGE)} />
            </View>
          )}
        </View>
      )}
      {data?.lead && (
        <View style={[styles.row, { alignItems: "flex-start" }]}>
          <Info size={16} color={c.mutedForeground} style={{ marginTop: 2 }} />
          <T tone="muted" style={{ flex: 1 }}>
            Non vérifié ne veut pas dire faux : une publication sans pastille n’a simplement pas encore été examinée.
          </T>
        </View>
      )}
      <ActionSheet item={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}
