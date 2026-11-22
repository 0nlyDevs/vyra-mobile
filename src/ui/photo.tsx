import { useState } from "react";
import { Image, type StyleProp, type ViewStyle } from "react-native";

import { API_URL } from "@/lib/config";
import { useTheme } from "@/lib/theme";

/** Une adresse complète, ou un chemin du site (« /demo/x.png ») rendu absolu. */
export function resolveImage(src: string) {
  return /^https?:\/\//.test(src) ? src : `${API_URL}${src.startsWith("/") ? "" : "/"}${src}`;
}

/** Une photo chez sa source ou sur le site. Si elle ne charge pas, la carte se passe d'elle. */
export function Photo({ uri, ratio = 16 / 9, style }: { uri: string; ratio?: number; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      source={{ uri: resolveImage(uri) }}
      accessibilityIgnoresInvertColors
      resizeMode="cover"
      onError={() => setFailed(true)}
      style={[{ width: "100%", aspectRatio: ratio, backgroundColor: c.muted }, style as object]}
    />
  );
}
