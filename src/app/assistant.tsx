import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { type ComponentRef, useRef, useState } from "react";
import { KeyboardAvoidingView, Linking, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { type Answer, ApiError, post } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { EyeSlash, PaperPlaneTilt } from "@/lib/icons";
import { useNoAi } from "@/lib/no-ai";
import { appRoute } from "@/lib/site-links";
import { fonts, radius, useTheme } from "@/lib/theme";
import { Button, CertaintyBadge, Field, Notice, PressCard, T, useAppChrome } from "@/ui/ui";

/** L'écran d'où l'assistant a été ouvert, dit comme un chemin du site (le contexte de la question). */
function sitePath(from: string | undefined): string {
  if (!from || from === "/") return "/feed";
  return from.replace(/^\/case\//, "/cases/");
}

type Message = { role: "user" | "assistant"; text: string; citations?: Answer["citations"]; proposals?: Answer["proposals"] };

/** L'assistant : il répond avec les affaires jugées de Vyra et les cite ; sans preuve, il le dit. */
export default function Assistant() {
  const c = useTheme();
  const chrome = useAppChrome();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { noAi } = useNoAi();
  // Un chemin du site (affaire, signalement, enquête pré-remplie) s'ouvre sur son écran de
  // l'application ; seul ce qui n'existe que sur le site s'ouvre dans le navigateur.
  const openHref = (href: string) => {
    const route = appRoute(href);
    if (!route) {
      Linking.openURL(`${API_URL}${href}`).catch(() => null);
      return;
    }
    router.dismiss();
    router.navigate(route as Href);
  };
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const question = input.trim();
    if (!question) return;
    const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    setMessages((all) => [...all, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const answer = await post<Answer>("/assistant", { question, pathname: sitePath(from), history });
      setMessages((all) => [...all, { role: "assistant", text: answer.answer, citations: answer.citations, proposals: answer.proposals }]);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <SafeAreaView edges={chrome ? [] : ["top"]} style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14, flexGrow: 1 }}>
          <View style={{ gap: 6 }}>
            <T tone="title">Assistant</T>
            {messages.length === 0 && <T tone="muted">Posez une question sur une information qui circule. L’assistant ne répond qu’avec les affaires jugées, et les cite.</T>}
            {noAi && <Notice>Mode Sans IA : les réponses rédigées par l’IA sont masquées, les affaires citées restent.</Notice>}
          </View>
          {messages.map((message, index) => (
            <View key={`${message.role}-${index}`} style={{ alignSelf: message.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", gap: 8 }}>
              <View
                style={{
                  borderRadius: radius.card,
                  // La bulle de la personne est l'encre, la réponse un papier.
                  borderBottomRightRadius: message.role === "user" ? 6 : radius.card,
                  borderBottomLeftRadius: message.role === "user" ? radius.card : 6,
                  padding: 14,
                  backgroundColor: message.role === "user" ? c.primary : c.card,
                  // La réponse est rédigée par l'IA : en pointillés, comme partout dans l'application.
                  borderWidth: message.role === "user" ? 0 : 1,
                  borderStyle: message.role === "user" ? "solid" : "dashed",
                  borderColor: message.role === "user" ? c.border : c.foreground + "73",
                }}
              >
                {message.role === "assistant" && noAi ? (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <EyeSlash size={16} color={c.mutedForeground} style={{ marginTop: 2 }} />
                    <T tone="muted" style={{ flex: 1 }}>
                      Masqué en mode Sans IA, qui n’affiche que les faits : Réponse de l’assistant.
                    </T>
                  </View>
                ) : (
                  <T style={{ color: message.role === "user" ? c.primaryForeground : c.foreground }}>{message.text}</T>
                )}
              </View>
              {message.citations?.map((citation) => (
                <PressCard key={citation.number} disabled={!appRoute(citation.href)} accessibilityHint="Ouvre l’affaire citée" style={{ padding: 12, gap: 8 }} onPress={() => openHref(citation.href)}>
                  <T tone="tabular" style={{ fontSize: 12, color: c.mutedForeground }}>
                    [{citation.number}] Affaire citée
                  </T>
                  <T style={{ fontFamily: fonts.semibold }}>{citation.title}</T>
                  <CertaintyBadge level={citation.certainty} />
                </PressCard>
              ))}
              {message.proposals?.map((proposal) => (
                <Button key={proposal.href} label={proposal.label} variant="outline" onPress={() => openHref(proposal.href)} />
              ))}
            </View>
          ))}
          {error && <Notice tone="error">{error}</Notice>}
        </ScrollView>
        <View style={{ padding: 12, gap: 8, flexDirection: "row", alignItems: "flex-end", borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background }}>
          <View style={{ flex: 1 }}>
            <Field value={input} onChangeText={setInput} placeholder="Votre question" accessibilityLabel="Votre question pour l’assistant" multiline style={{ minHeight: 48, maxHeight: 120 }} />
          </View>
          <View style={{ width: 56 }}>
            <Button label="" icon={PaperPlaneTilt} busy={busy} disabled={!input.trim()} onPress={send} accessibilityLabel="Envoyer" style={{ paddingHorizontal: 0 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
