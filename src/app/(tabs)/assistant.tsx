import { useRouter } from "expo-router";
import { type ComponentRef, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { type Answer, ApiError, caseIdFrom, post } from "@/lib/api";
import { PaperPlaneTilt } from "@/lib/icons";
import { fonts, radius, useTheme } from "@/lib/theme";
import { Button, Card, Field, Notice, T } from "@/ui/ui";

type Message = { role: "user" | "assistant"; text: string; citations?: Answer["citations"] };

/** L'assistant : il répond avec les affaires jugées de Vyra et les cite ; sans preuve, il le dit. */
export default function Assistant() {
  const c = useTheme();
  const router = useRouter();
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
      const answer = await post<Answer>("/assistant", { question, pathname: "/", history });
      setMessages((all) => [...all, { role: "assistant", text: answer.answer, citations: answer.citations }]);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}>
          <T tone="title">Assistant</T>
          {messages.length === 0 && <T tone="muted">Posez une question sur une information qui circule. L’assistant ne répond qu’avec les affaires jugées.</T>}
          {messages.map((message, index) => (
            <View key={`${message.role}-${index}`} style={{ alignSelf: message.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", gap: 8 }}>
              <View style={{ borderRadius: radius.card, padding: 12, backgroundColor: message.role === "user" ? c.primary : c.card, borderWidth: message.role === "user" ? 0 : 1, borderColor: c.border }}>
                <T style={{ color: message.role === "user" ? c.primaryForeground : c.foreground }}>{message.text}</T>
              </View>
              {message.citations?.map((citation) => {
                const id = caseIdFrom(citation.href);
                return (
                  <Pressable key={citation.number} disabled={!id} onPress={() => id && router.push({ pathname: "/case/[id]", params: { id } })}>
                    <Card style={{ padding: 10 }}>
                      <T tone="label">Affaire citée</T>
                      <T style={{ fontFamily: fonts.semibold }}>{citation.title}</T>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          ))}
          {error && <Notice tone="error">{error}</Notice>}
        </ScrollView>
        <View style={{ padding: 12, gap: 8, flexDirection: "row", alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <Field value={input} onChangeText={setInput} placeholder="Votre question" multiline style={{ minHeight: 48, maxHeight: 120 }} />
          </View>
          <View style={{ width: 56 }}>
            <Button label="" icon={PaperPlaneTilt} busy={busy} disabled={!input.trim()} onPress={send} accessibilityLabel="Envoyer" style={{ paddingHorizontal: 0 }} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
