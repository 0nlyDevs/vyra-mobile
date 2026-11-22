import { useRouter } from "expo-router";
import { type ReactNode, useState } from "react";
import { View } from "react-native";

import { ApiError, get, type SealCheck as SealResult, sealQuery } from "@/lib/api";
import { type Icon, Question, SealCheck as SealIcon, ShieldWarning } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { Button, Field, Notice, Quote, T, VerdictBadge } from "@/ui/ui";

/** Comme la page /check/seal du site : vert pour authentique, rouge pour une carte retouchée,
 * pointillés neutres pour un code inconnu. Toujours avec l'icône et les mots. */
function Result({ icon: Glyph, title, tone, children }: { icon: Icon; title: string; tone: "true" | "false" | "neutral"; children: ReactNode }) {
  const c = useTheme();
  const v = tone === "neutral" ? null : c.verdict[tone];
  return (
    <View
      style={{ gap: 10, padding: 14, borderRadius: radius.card, borderWidth: v ? 2 : 1, borderStyle: v ? "solid" : "dashed", borderColor: v ? v.ink : c.foreground, backgroundColor: v ? v.soft : c.card }}
      accessibilityLiveRegion="polite"
    >
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Glyph size={24} color={v ? v.ink : c.mutedForeground} />
        <T accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 18, flex: 1, color: v ? v.ink : c.foreground }}>
          {title}
        </T>
      </View>
      {children}
    </View>
  );
}

/** Ce que dit un sceau : la conclusion signée, telle qu'elle est en base. */
function Outcome({ check }: { check: SealResult }) {
  const router = useRouter();
  if (check.status === "unknown") {
    return (
      <Result icon={Question} title="Aucune conclusion avec ce sceau" tone="neutral">
        <T>Vérifiez le code (huit caractères après VY). S’il est juste, la carte ne vient pas de Vyra, même si elle en porte la marque.</T>
      </Result>
    );
  }
  const { content } = check;
  const genuine = check.status === "genuine";
  return (
    <Result icon={genuine ? SealIcon : ShieldWarning} title={genuine ? `Sceau authentique · ${check.code}` : "Ce sceau ne correspond pas"} tone={genuine ? "true" : "false"}>
      <T>
        {genuine
          ? "Cette conclusion vient bien de Vyra. Comparez-la mot pour mot avec la carte reçue : si le texte de la carte diffère, la carte a été retouchée."
          : `La carte a été modifiée, ou la conclusion a changé depuis qu’elle a été faite. Ne la partagez pas. Voici la conclusion actuelle, la seule qui fait foi${check.code ? ` (sceau ${check.code})` : ""}.`}
      </T>
      <T tone="muted">Ce qui circule</T>
      <Quote>{content.claim}</Quote>
      <VerdictBadge level={content.certainty} />
      <T>{content.conclusion}</T>
      <Button label="Voir les preuves" variant="outline" onPress={() => router.push({ pathname: "/case/[id]", params: { id: content.id } })} />
    </Result>
  );
}

/** Vérifier un sceau : le code imprimé sous la carte (VY-XXXX-XXXX) ou le lien de son QR. Un code
 * reçu dans l'adresse (`/scan?tab=seal&code=…`, ou le lien d'un QR) est déjà recopié dans le champ. */
export function SealVerify({ initial }: { initial?: string }) {
  const [input, setInput] = useState(initial ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [check, setCheck] = useState<SealResult | null>(null);

  async function run() {
    const query = sealQuery(input);
    if (!query) return;
    setBusy(true);
    setError(null);
    setCheck(null);
    try {
      setCheck(await get<SealResult>(`/seal/check?${query}`));
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <T tone="muted">Une carte de conclusion Vyra porte un QR et un code. Collez le lien du QR, ou tapez le code : vous voyez si la carte est authentique, et la vraie conclusion.</T>
      <Field label="Code du sceau" value={input} onChangeText={setInput} placeholder="VY-XXXX-XXXX" autoCapitalize="characters" autoCorrect={false} onSubmitEditing={() => run()} />
      <Button label="Vérifier" icon={SealIcon} busy={busy} disabled={input.trim().length < 8} onPress={() => run()} />
      {error && <Notice tone="error">{error}</Notice>}
      {check && !busy && <Outcome check={check} />}
    </>
  );
}
