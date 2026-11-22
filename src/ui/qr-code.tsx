import { create } from "qrcode";
import { useMemo } from "react";
import Svg, { Path, Rect } from "react-native-svg";

import { light } from "@/lib/tokens";

/** Le QR du sceau : l'encre sur le papier dans les deux thèmes (un lecteur veut un fond clair). */
export function QrCode({ value, size = 168, label }: { value: string; size?: number; label: string }) {
  const { path, count } = useMemo(() => {
    const { modules } = create(value, { errorCorrectionLevel: "M" });
    let d = "";
    for (let row = 0; row < modules.size; row++) {
      for (let col = 0; col < modules.size; col++) {
        if (modules.get(row, col)) d += `M${col + 4} ${row + 4}h1v1h-1z`;
      }
    }
    // Quatre modules de marge blanche autour, comme le demande la norme.
    return { path: d, count: modules.size + 8 };
  }, [value]);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${count} ${count}`} accessibilityRole="image" accessibilityLabel={label}>
      <Rect width={count} height={count} fill={light.card} />
      <Path d={path} fill={light.foreground} />
    </Svg>
  );
}
