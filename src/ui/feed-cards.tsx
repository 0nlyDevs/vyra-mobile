import { type ReactNode } from "react";
import { Pressable, View } from "react-native";

import type { Certainty, FeedItem } from "@/lib/api";
import { fonts, radius, useTheme } from "@/lib/theme";
import { Photo } from "@/ui/photo";
import { CertaintyBadge, T } from "@/ui/ui";

export function age(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `il y a ${minutes} min`;
  if (minutes < 1440) return `il y a ${Math.round(minutes / 60)} h`;
  return `il y a ${Math.round(minutes / 1440)} j`;
}

/** Le titre d'une publication ; sans titre, sa première phrase. */
export function headline(item: Pick<FeedItem, "title" | "body">) {
  if (item.title) return item.title;
  const first = item.body.split(/(?<=[.!?])\s/)[0] ?? item.body;
  return first.length > 120 ? `${first.slice(0, 117)}…` : first;
}

function Touch({ onPress, hint, style, children }: { onPress: () => void; hint: string; style?: object; children: ReactNode }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [
        { backgroundColor: c.card, borderColor: c.border, borderWidth: 1, borderRadius: radius.card, overflow: "hidden", opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** La une : la photo en grand, le titre à la taille d'un titre. */
export function LeadCard({ item, hint, onPress }: { item: FeedItem; hint: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Touch onPress={onPress} hint={hint}>
      {item.imageUrl && <Photo uri={item.imageUrl} ratio={16 / 10} />}
      <View style={{ padding: 16, gap: 10 }}>
        <T tone="tabular" style={{ color: c.mutedForeground, fontSize: 12 }} numberOfLines={1}>
          {item.sourceName}  ·  {age(item.publishedAt)}
        </T>
        <T style={{ fontFamily: fonts.bold, fontSize: 24, lineHeight: 29 }} numberOfLines={4}>
          {headline(item)}
        </T>
        {item.title && (
          <T numberOfLines={3} style={{ color: c.mutedForeground }}>
            {item.body}
          </T>
        )}
        {item.case?.certainty ? <CertaintyBadge level={item.case.certainty as Certainty} /> : null}
      </View>
    </Touch>
  );
}

/** Une histoire de la rangée qui défile de côté. */
export function StoryCard({ item, hint, onPress }: { item: FeedItem; hint: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Touch onPress={onPress} hint={hint} style={{ width: 252 }}>
      {item.imageUrl && <Photo uri={item.imageUrl} ratio={16 / 10} />}
      <View style={{ padding: 14, gap: 8 }}>
        <T tone="tabular" style={{ color: c.mutedForeground, fontSize: 12 }} numberOfLines={1}>
          {item.sourceName}  ·  {age(item.publishedAt)}
        </T>
        <T style={{ fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 }} numberOfLines={item.imageUrl ? 3 : 6}>
          {headline(item)}
        </T>
        {item.case?.certainty ? <CertaintyBadge level={item.case.certainty as Certainty} /> : null}
      </View>
    </Touch>
  );
}

/** Une ligne du reste du fil : vignette à gauche, deux lignes de titre. Une ligne n'est pas une carte. */
export function FeedRowItem({ item, hint, onPress }: { item: FeedItem; hint: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.border, opacity: pressed ? 0.7 : 1 })}
    >
      {item.imageUrl && <Photo uri={item.imageUrl} ratio={1} style={{ width: 76, borderRadius: 10 }} />}
      <View style={{ flex: 1, gap: 4, justifyContent: "center" }}>
        <T tone="tabular" style={{ color: c.mutedForeground, fontSize: 12 }} numberOfLines={1}>
          {item.sourceName}  ·  {age(item.publishedAt)}
        </T>
        <T style={{ fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 }} numberOfLines={2}>
          {headline(item)}
        </T>
        {item.case?.certainty ? <CertaintyBadge level={item.case.certainty as Certainty} /> : null}
      </View>
    </Pressable>
  );
}
