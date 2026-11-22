import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

import { AudioScan } from "@/features/audio-scan";
import { ImageScan } from "@/features/image-scan";
import { Impersonation } from "@/features/impersonation";
import { LinkScan } from "@/features/link-scan";
import { SealVerify } from "@/features/seal-check";
import { TextCheck } from "@/features/text-check";
import { VideoScan } from "@/features/video-scan";
import { AddressBook } from "@/lib/icons";
import { Button, Chip, Notice, Screen, T } from "@/ui/ui";

// Scan : les mêmes sept onglets que la page /scan du site, dans le même ordre et avec les mêmes
// clés d'adresse (`/scan?onglet=sceau&code=…`), pour y revenir ou y être envoyé.
const TABS = [
  { key: "image", label: "Image" },
  { key: "video", label: "Vidéo" },
  { key: "audio", label: "Vocal" },
  { key: "link", label: "Lien" },
  { key: "texte", label: "Texte" },
  { key: "source", label: "Est-ce bien eux ?" },
  { key: "sceau", label: "Sceau" },
] as const;

type Tab = (typeof TABS)[number]["key"];

function isTab(value: unknown): value is Tab {
  return TABS.some((tab) => tab.key === value);
}

export default function ScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ onglet?: string; code?: string; c?: string; s?: string }>();
  const tab: Tab = isTab(params.onglet) ? params.onglet : "image";
  // Le lien d'un QR (`?c=&s=`) ou un code tapé ailleurs arrive tout prêt dans le champ du sceau.
  const sealInput = params.c && params.s ? `?c=${params.c}&s=${params.s}` : params.code;
  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <T tone="title">Scan</T>
        <T tone="muted">
          Une image, une vidéo, un vocal, un lien ou un texte reçu : relever des indices, retrouver ce qui a déjà été jugé, vérifier qu’un message vient bien de l’institution qu’il cite ou qu’une carte de conclusion est authentique. Jamais de verdict « IA ou pas » : les détecteurs se trompent trop.
        </T>
      </View>
      {/* Sept onglets : la rangée défile de côté, comme sur le site en petit écran. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {TABS.map((item) => (
          <Chip key={item.key} label={item.label} selected={item.key === tab} onPress={() => router.setParams({ onglet: item.key })} />
        ))}
      </ScrollView>
      {/* Chaque examen garde son état tant qu'on reste sur son onglet ; en changer repart de zéro. */}
      {tab === "image" && <ImageScan />}
      {tab === "video" && <VideoScan />}
      {tab === "audio" && <AudioScan />}
      {tab === "link" && <LinkScan />}
      {tab === "texte" && <TextCheck />}
      {tab === "source" && (
        <>
          <Impersonation />
          <Button label="Ouvrir l’annuaire officiel" icon={AddressBook} variant="outline" onPress={() => router.push("/directory")} />
        </>
      )}
      {tab === "sceau" && <SealVerify key={sealInput ?? ""} initial={sealInput} />}
      <Notice>Indices relevés avec l’aide de l’IA. Ce ne sont pas des preuves : seules les pièces d’une affaire, jugées au tribunal, permettent de conclure.</Notice>
    </Screen>
  );
}
