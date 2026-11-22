import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { ApiError, type CaseFile, post, type WhatIf } from "@/lib/api";
import { ArrowLeft, Sparkle } from "@/lib/icons";
import { fonts, useTheme } from "@/lib/theme";
import { useApi } from "@/lib/use-api";
import { Button, CertaintyBadge, Card, Loading, Notice, Screen, T } from "@/ui/ui";

const STANCE = { supports: "Appuie", contradicts: "Contredit", context: "Contexte" } as const;

/** Le dossier d'une affaire : la conclusion, What If ?, les versions retrouvées, les pièces. */
export default function CaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const c = useTheme();
  const { data, error, isLoading } = useApi<CaseFile>(`/cases/${id}`);
  const [whatIf, setWhatIf] = useState<WhatIf | null>(null);
  const [busy, setBusy] = useState(false);
  const [whatIfError, setWhatIfError] = useState<string | null>(null);

  async function runWhatIf() {
    setBusy(true);
    setWhatIfError(null);
    try {
      setWhatIf(await post<WhatIf>(`/cases/${id}/what-if`));
    } catch (e) {
      setWhatIfError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 }}>
        <ArrowLeft size={20} color={c.foreground} />
        <T>Retour</T>
      </Pressable>
      {isLoading && <Loading />}
      {error && <Notice tone="error">{error.message}</Notice>}
      {data && (
        <>
          <CertaintyBadge level={data.certainty} />
          <T tone="title">{data.title}</T>
          <T tone="muted">« {data.claim} »</T>
          {data.conclusion && (
            <Card>
              <T tone="label">Conclusion du juge</T>
              <T>{data.conclusion}</T>
            </Card>
          )}

          <Card>
            <T tone="label">What If ?</T>
            <T tone="muted">
              {data.kind === "fictional"
                ? "La même histoire racontée de trois façons : fidèle, alarmiste, trompeuse."
                : "Et si cette information avait été dite calmement ? Les mêmes faits, sans l’alarme."}
            </T>
            <Button label={whatIf ? "Réécrire autrement" : data.kind === "fictional" ? "Voir les trois versions" : "Voir la version calme"} icon={Sparkle} busy={busy} onPress={runWhatIf} />
            {whatIfError && <Notice tone="error">{whatIfError}</Notice>}
          </Card>
          {whatIf?.versions.map((version) => (
            <Card key={version.id}>
              <T tone="label">{version.label}</T>
              <T>{version.text}</T>
              {version.changes.map((change) => (
                <T key={change} tone="muted">
                  • {change}
                </T>
              ))}
            </Card>
          ))}
          {whatIf?.takeaway ? <T style={{ fontFamily: fonts.semibold }}>{whatIf.takeaway}</T> : null}

          <T tone="label">Versions retrouvées</T>
          {data.versions.map((version) => (
            <Card key={version.id}>
              <T tone="label">
                {version.position}. {version.sourceName}
              </T>
              <T numberOfLines={5}>{version.content}</T>
            </Card>
          ))}

          <T tone="label">Pièces du dossier</T>
          {data.evidence.map((piece) => (
            <Card key={piece.id}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <T tone="label">Pièce n° {piece.number}</T>
                <T tone="label">{STANCE[piece.stance]}</T>
              </View>
              <T style={{ fontFamily: fonts.bold }}>{piece.title}</T>
              <T>{piece.content}</T>
              <T tone="muted">{piece.sourceName}</T>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
