import { Platform, Switch, View } from "react-native";

import { API_URL } from "@/lib/config";
import { AddressBook, SignOut } from "@/lib/icons";
import { useNoAi } from "@/lib/no-ai";
import { useRouter } from "expo-router";
import { useSession } from "@/lib/session";
import { fonts, useTheme } from "@/lib/theme";
import { Button, Card, Screen, Section, T } from "@/ui/ui";

export default function Account() {
  const { profile, signOut } = useSession();
  const { noAi, setNoAi } = useNoAi();
  const router = useRouter();
  const c = useTheme();
  return (
    <Screen>
      <T tone="title">Compte</T>
      {profile && (
        <Card>
          <T style={{ fontFamily: fonts.bold, fontSize: 22, lineHeight: 28 }}>{profile.name}</T>
          {!!profile.headline && <T tone="muted">{profile.headline}</T>}
          <T style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{profile.role}</T>
        </Card>
      )}
      <Section title="Lecture" note="Ce que l’IA a lu ou rédigé est encadré en pointillés ; les faits (pièces, fichier, règle de certitude, annuaire) gardent un trait plein.">
        <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <T style={{ fontFamily: fonts.semibold }}>
              Sans IA : n’afficher que les faits
            </T>
            <T tone="muted">Masque les lectures, transcriptions et réponses de l’IA dans toute l’application.</T>
          </View>
          <Switch
            value={noAi}
            onValueChange={setNoAi}
            accessibilityLabel="Sans IA : n’afficher que les faits"
            trackColor={{ false: c.input, true: c.primary }}
            thumbColor={c.card}
            ios_backgroundColor={c.input}
            // Le navigateur (react-native-web) prend sa propre couleur pour « activé » : on garde le papier.
            {...(Platform.OS === "web" ? { activeThumbColor: c.card } : {})}
          />
        </Card>
      </Section>
      <Section title="Annuaire officiel" note="Les canaux officiels des institutions, pour « Est-ce bien eux ? ».">
        <Button label="Ouvrir l’annuaire" icon={AddressBook} variant="outline" onPress={() => router.push("/directory")} />
      </Section>
      <Section title="Serveur" note="L’adresse du site Vyra que l’application lit.">
        <View>
          <T tone="tabular" style={{ fontSize: 15 }}>{API_URL}</T>
        </View>
      </Section>
      <Button label="Se déconnecter" icon={SignOut} variant="outline" onPress={signOut} />
    </Screen>
  );
}
