import { useRouter } from "expo-router";
import { Platform, Switch, View } from "react-native";

import { API_URL } from "@/lib/config";
import { PROFILE_ROLE_LABELS } from "@/lib/domain";
import { AddressBook, Leaf, Robot, SignOut, type Sun } from "@/lib/icons";
import { READING_LABELS, TEXT_SIZES, THEME_CHOICES, THEME_LABELS, usePreferences } from "@/lib/preferences";
import { useSession } from "@/lib/session";
import { fonts, useTheme } from "@/lib/theme";
import { Button, Card, Chip, Screen, Section, T, styles } from "@/ui/ui";

/** Un réglage oui/non, avec le même mot que le site. */
function Toggle({ label, note, icon: Icon, value, onChange }: { label: string; note: string; icon: typeof Sun; value: boolean; onChange: (value: boolean) => void }) {
  const c = useTheme();
  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Icon size={22} color={c.foreground} />
      <View style={{ flex: 1, gap: 2 }}>
        <T style={{ fontFamily: fonts.semibold }}>{label}</T>
        <T tone="muted">{note}</T>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ false: c.input, true: c.primary }}
        thumbColor={c.card}
        ios_backgroundColor={c.input}
        // Le navigateur (react-native-web) prend sa propre couleur pour « activé » : on garde le papier.
        {...(Platform.OS === "web" ? { activeThumbColor: c.card } : {})}
      />
    </Card>
  );
}

/** Le compte et les réglages de lecture, les mêmes que ceux du site (thème, taille du texte, mode
 * éco, Sans IA), gardés sur l'appareil. */
export default function Account() {
  const { profile, signOut } = useSession();
  const { theme, setTheme, textSize, setTextSize, eco, setEco, noAi, setNoAi } = usePreferences();
  const router = useRouter();
  const index = TEXT_SIZES.indexOf(textSize);
  const roleLabel = profile && profile.role in PROFILE_ROLE_LABELS ? PROFILE_ROLE_LABELS[profile.role as keyof typeof PROFILE_ROLE_LABELS] : profile?.role;

  return (
    <Screen>
      <T tone="title">Compte</T>
      {profile && (
        <Card>
          <T style={{ fontFamily: fonts.bold, fontSize: 22, lineHeight: 28 }}>{profile.name}</T>
          {!!profile.headline && <T tone="muted">{profile.headline}</T>}
          <T style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{roleLabel}</T>
        </Card>
      )}
      <Section title="Thème">
        <View style={styles.wrap} accessibilityRole="radiogroup">
          {THEME_CHOICES.map((choice) => (
            <Chip key={choice} label={THEME_LABELS[choice]} selected={theme === choice} onPress={() => setTheme(choice)} />
          ))}
        </View>
      </Section>
      <Section title="Lecture" note="Ce que l’IA a lu ou rédigé est encadré en pointillés ; les faits (pièces, fichier, règle de certitude, annuaire) gardent un trait plein.">
        <View style={[styles.row, { gap: 10 }]}>
          <Button label="A−" accessibilityLabel={READING_LABELS.smaller} variant="outline" disabled={index <= 0} onPress={() => setTextSize(TEXT_SIZES[index - 1])} style={{ flex: 1 }} />
          <Button label="A+" accessibilityLabel={READING_LABELS.larger} variant="outline" disabled={index >= TEXT_SIZES.length - 1} onPress={() => setTextSize(TEXT_SIZES[index + 1])} style={{ flex: 1 }} />
        </View>
        <Toggle label={READING_LABELS.eco} note="Coupe les animations : l’écran bouge moins, la batterie dure plus." icon={Leaf} value={eco} onChange={setEco} />
        <Toggle label={READING_LABELS.noAi} note="Masque les lectures, transcriptions et réponses de l’IA dans toute l’application." icon={Robot} value={noAi} onChange={setNoAi} />
      </Section>
      <Section title="Annuaire officiel" note="Les canaux officiels des institutions, pour « Est-ce bien eux ? ».">
        <Button label="Ouvrir l’annuaire" icon={AddressBook} variant="outline" onPress={() => router.push("/directory")} />
      </Section>
      <Section title="Serveur" note="L’adresse du site Vyra que l’application lit.">
        <T tone="tabular" style={{ fontSize: 15 }}>
          {API_URL}
        </T>
      </Section>
      <Button label="Se déconnecter" icon={SignOut} variant="outline" onPress={signOut} />
    </Screen>
  );
}
