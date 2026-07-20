/**
 * Deterministic palette resolution for generated output (landing page,
 * emails, marketing). Branding is first-class (§6). If the organizer gives
 * colors we honour them; if not we fall back to a strong sporty default.
 * Contrast is enforced so text stays readable (never publish unreadable).
 */

export interface ResolvedPalette {
  accent: string; // primary brand color
  accentPress: string; // darker pressed/hover shade
  secondary: string;
  ink: string; // main text color
  surface: string; // page background
  onAccent: string; // readable text ON the accent
  derived: boolean; // true when we fell back / computed rather than took input
}

/** Strong default that reads as sporty and premium (RizzFitt orange). */
const DEFAULT_ACCENT = "#F16C1D";
const DEFAULT_SECONDARY = "#121212";

const HEX = /^#?[0-9a-fA-F]{6}$/;

function normalizeHex(input: string): string | null {
  const v = input.trim();
  if (!HEX.test(v)) return null;
  return (v.startsWith("#") ? v : `#${v}`).toLowerCase();
}

function toRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex([r, g, b]: [number, number, number]): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join("")}`;
}

/** Relative luminance (WCAG) for contrast decisions. */
function luminance([r, g, b]: [number, number, number]): number {
  const chan = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

/** Readable text color (black/white) on a given background. */
function readableOn(hex: string): string {
  return luminance(toRgb(hex)) > 0.45 ? "#121212" : "#ffffff";
}

/** Darken a color by a factor for the pressed shade. */
function darken(hex: string, factor = 0.82): string {
  const [r, g, b] = toRgb(hex);
  return toHex([r * factor, g * factor, b * factor]);
}

export function resolvePalette(primary: string, secondary: string): ResolvedPalette {
  const accentInput = normalizeHex(primary);
  const secondaryInput = normalizeHex(secondary);

  const accent = accentInput ?? DEFAULT_ACCENT;
  const secondaryColor = secondaryInput ?? DEFAULT_SECONDARY;

  return {
    accent,
    accentPress: darken(accent),
    secondary: secondaryColor,
    ink: "#121212",
    surface: "#ffffff",
    onAccent: readableOn(accent),
    derived: !accentInput, // we fell back if no valid primary was supplied
  };
}
