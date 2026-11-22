import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { NewCase } from "@/features/new-case";
import type { CaseSummary } from "@/lib/api";
import { CASE_KIND_LABELS } from "@/lib/domain";
import { fonts, radius, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/use-api";
import { Photo } from "@/ui/photo";
import { CertaintyBadge, Loading, Notice, Quote, Screen, T } from "@/ui/ui";

/** Enquêtes : une nouvelle analyse, puis les affaires (la plus marquante en grand avec sa photo,
 * les autres en lignes serrées). `?information=…&lien=…` pré-remplit l'analyse, comme sur le site. */
export default function Cases() {
  const router = useRouter();
  const params = useLocalSearchParams<{ information?: string; lien?: string }>();
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
        <T tone="title">Enquêtes</T>
        <T tone="muted">Retracer l’histoire d’une information : ses versions retrouvées et ce qui a changé de l’une à l’autre.</T>
      </View>
      <NewCase key={`${params.information ?? ""}|${params.lien ?? ""}`} initial={params.information} initialUrl={params.lien?.startsWith("http") ? params.lien : undefined} />
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
            <CertaintyBadge level={lead.certainty} status={lead.status} />
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
                <CertaintyBadge level={item.certainty} status={item.status} />
                <T style={{ fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 }} numberOfLines={2}>
                  {item.title}
                </T>
                {item.kind === "fictional" && <T tone="muted" style={{ fontSize: 12 }}>{CASE_KIND_LABELS.fictional}</T>}
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
