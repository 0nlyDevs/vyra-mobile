import { API_URL } from "@/lib/config";
import { useSession } from "@/lib/session";
import { Button, Card, Screen, T } from "@/ui/ui";

export default function Account() {
  const { profile, signOut } = useSession();
  return (
    <Screen>
      <T tone="title">Compte</T>
      {profile && (
        <Card>
          <T style={{ fontFamily: "BricolageGrotesque_700Bold", fontSize: 22 }}>{profile.name}</T>
          <T tone="muted">{profile.headline}</T>
          <T tone="label">{profile.role}</T>
        </Card>
      )}
      <Card>
        <T tone="label">Serveur</T>
        <T tone="muted">{API_URL}</T>
      </Card>
      <Button label="Se déconnecter" variant="outline" onPress={signOut} />
    </Screen>
  );
}
