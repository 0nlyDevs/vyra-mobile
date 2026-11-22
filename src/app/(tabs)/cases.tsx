import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import type { CaseSummary } from "@/lib/api";
import { fonts, radius, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/use-api";
import { Photo } from "@/ui/photo";
import { CertaintyBadge, Loading, Notice, Quote, Screen, T } from "@/ui/ui";

/** Les affaires : la plus marquante en grand avec sa photo, les autres en lignes serrées. */
export default function Cases() {
  const router = useRouter();
  const c = useTheme();
  const { data, error, isLoading, isValidating, mutate } = useApi<{ cases: CaseSummary[] }>("/cases");
  const open = (id: string) => () => router.push({ pathname: "/case/[id]", params: { id } });

  // La une : une affaire avec image et conclusion d'abord, sinon la plus récente.
  const cases = data?.cases ?? [];
  const lead = cases.find((item) => item.imageUrl && item.certainty) ?? cases.find((item) => item.imageUrl) ?? cases[0] ?? null;
  const rest = cases.filter((item) => item !== lead);

  return (
    <Screen onRefresh={() => mutate()} refreshing={isValidating && !isLoading}>
      <View style={{ gap: 6 }}>
        <T tone="title">Affaires</T>
        <T tone="muted">Une information suspecte, ses versions, ses pièces, puis la conclusion.</T>
      </View>
      {error && <Notice tone="error">{error.message}</Notice>}
      {isLoading && <Loading />}
      {data && cases.length === 0 && <Notice>Aucune affaire pour l’instant.</Notice>}
      {lead && (
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Ouvre le dossier"
          onPress={open(lead.id)}
          style={({ pressed }) => ({ backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: radius.card, overflow: "hidden", opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
        >
          {lead.imageUrl && <Photo uri={lead.imageUrl} ratio={16 / 10} />}
          <View style={{ padding: 16, gap: 10 }}>
            <CertaintyBadge level={lead.certainty} />
            <T style={{ fontFamily: fonts.bold, fontSize: 24, lineHeight: 29 }} numberOfLines={3}>
              {lead.title}
            </T>
            <Quote numberOfLines={3} style={{ fontSize: 17, lineHeight: 23, color: c.mutedForeground }}>
              {lead.claim}
            </Quote>
          </View>
        </Pressable>
      )}
      {rest.length > 0 && (
        <View>
          {rest.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityHint="Ouvre le dossier"
              onPress={open(item.id)}
              style={({ pressed }) => ({ flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border, opacity: pressed ? 0.7 : 1 })}
            >
              {item.imageUrl && <Photo uri={item.imageUrl} ratio={1} style={{ width: 84, borderRadius: 10 }} />}
              <View style={{ flex: 1, gap: 5, justifyContent: "center" }}>
                <CertaintyBadge level={item.certainty} />
                <T style={{ fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 }} numberOfLines={2}>
                  {item.title}
                </T>
                {item.kind === "fictional" && <T tone="muted" style={{ fontSize: 12 }}>Affaire d’exercice</T>}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
