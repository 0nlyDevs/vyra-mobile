import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { type PickedFile, splitDataUrl } from "@/lib/api";
import { API_URL } from "@/lib/config";

// Les fichiers du scan : choisir une photo ou une vidéo, prendre une démo du site, partager une
// copie protégée. La vidéo ou la photo d'origine ne quitte le téléphone que vers le serveur Vyra.

export const MAX_FILE_BYTES = 8 * 1024 * 1024;

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/3gpp": "3gp",
};

/** Ce que la personne a choisi (avec sa taille quand le téléphone la donne), ou null si elle a renoncé. */
export type Picked = { file: PickedFile; size: number | null } | null;

function fromAsset(asset: ImagePicker.ImagePickerAsset, kind: "images" | "videos"): PickedFile {
  const type = asset.mimeType ?? (kind === "images" ? "image/jpeg" : "video/mp4");
  return { uri: asset.uri, name: asset.fileName ?? `vyra-scan.${EXTENSION[type] ?? "bin"}`, type };
}

/** La galerie (ou l'appareil photo, `camera`) pour une image ou une vidéo. */
export async function pickMedia(kind: "images" | "videos", camera = false): Promise<Picked> {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error("L’appareil photo n’est pas autorisé pour Vyra (Réglages du téléphone).");
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: [kind], quality: 1, exif: false, videoMaxDuration: 90 };
  const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  return { file: fromAsset(asset, kind), size: asset.fileSize ?? null };
}

/** Un fichier de démonstration publié par le site (`/demo/…`), prêt à envoyer. */
export async function demoFile(path: string, type: string): Promise<PickedFile> {
  const name = path.split("/").pop() ?? "demo";
  const url = `${API_URL}${path}`;
  if (Platform.OS === "web") return { uri: url, name, type };
  const saved = await File.downloadFileAsync(url, new File(Paths.cache, name), { idempotent: true });
  return { uri: saved.uri, name, type };
}

/** Partage (ou enregistre) une image en data URL : la copie protégée, une image clé. */
export async function shareDataUrl(dataUrl: string, name: string): Promise<void> {
  if (Platform.OS === "web") {
    // Le navigateur : un téléchargement, comme le bouton du site.
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = name;
    link.click();
    return;
  }
  const parts = splitDataUrl(dataUrl);
  if (!parts) throw new Error("Image illisible.");
  const file = new File(Paths.cache, name);
  await file.write(parts.base64, { encoding: "base64" });
  if (!(await Sharing.isAvailableAsync())) throw new Error("Le partage n’est pas disponible sur ce téléphone.");
  await Sharing.shareAsync(file.uri, { mimeType: parts.mimeType, dialogTitle: "Partager la copie protégée" });
}
