import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";

import { ImageScan } from "@/features/image-scan";
import { Impersonation } from "@/features/impersonation";
import { SealVerify } from "@/features/seal-check";
import { TextCheck } from "@/features/text-check";
import { VideoScan } from "@/features/video-scan";
import { Chip, Screen, T, styles } from "@/ui/ui";

// Vérifier : un texte ou un lien, une image, une vidéo, un message qui se dit d'une institution,
// le sceau d'une carte de conclusion. Les mêmes examens que le site ; le mode est dans l'adresse
// (`/check?mode=image`), pour y revenir ou y être envoyé.
const MODES = [
  { key: "text", label: "Texte ou lien", title: "Vérifier un message" },
  { key: "image", label: "Image", title: "Scan d’une image" },
  { key: "video", label: "Vidéo", title: "Scan d’une vidéo" },
  { key: "institution", label: "Est-ce bien eux ?", title: "Est-ce bien eux ?" },
  { key: "seal", label: "Sceau", title: "Vérifier un sceau" },
] as const;

type Mode = (typeof MODES)[number]["key"];

function isMode(value: unknown): value is Mode {
  return MODES.some((mode) => mode.key === value);
}

export default function CheckScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; code?: string }>();
  const mode: Mode = isMode(params.mode) ? params.mode : "text";
  const current = MODES.find((item) => item.key === mode) ?? MODES[0];
  return (
    <Screen>
      <View style={{ gap: 12 }}>
        <T tone="title">{current.title}</T>
        <View style={styles.wrap}>
          {MODES.map((item) => (
            <Chip key={item.key} label={item.label} selected={item.key === mode} onPress={() => router.setParams({ mode: item.key })} />
          ))}
        </View>
      </View>
      {/* Chaque examen garde son état tant qu'on reste sur son mode ; en changer repart de zéro. */}
      {mode === "text" && <TextCheck />}
      {mode === "image" && <ImageScan />}
      {mode === "video" && <VideoScan />}
      {mode === "institution" && <Impersonation />}
      {mode === "seal" && <SealVerify initial={params.code} />}
    </Screen>
  );
}
