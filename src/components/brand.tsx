import { fonts, tracking, useTheme } from "@/lib/theme";
import { T } from "@/ui/ui";

/** Le nom est la marque, comme chez Checky : Bricolage 800, le point en Cormorant italique. */
export function Brand({ size = 28 }: { size?: number }) {
  const c = useTheme();
  return (
    <T accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: size, lineHeight: size * 1.2, letterSpacing: tracking(size), color: c.foreground }}>
      Vyra
      <T style={{ fontFamily: fonts.quote, fontSize: size, lineHeight: size * 1.2, color: c.foreground }}>.</T>
    </T>
  );
}
