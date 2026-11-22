import { View } from "react-native";

import { API_URL } from "@/lib/config";
import { SignOut } from "@/lib/icons";
import { useSession } from "@/lib/session";
import { fonts } from "@/lib/theme";
import { Button, Card, Screen, Section, T } from "@/ui/ui";

export default function Account() {
  const { profile, signOut } = useSession();
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
      <Section title="Serveur" note="L’adresse du site Vyra que l’application lit.">
        <View>
          <T tone="tabular" style={{ fontSize: 15 }}>{API_URL}</T>
        </View>
      </Section>
      <Button label="Se déconnecter" icon={SignOut} variant="outline" onPress={signOut} />
    </Screen>
  );
}
