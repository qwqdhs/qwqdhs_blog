// HSV 色彩模型工具模块

export interface HsvColor {
  h: number; // 0-360
  s: number; // 0-1
  v: number; // 0-1
}

export interface RgbColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface HslColor {
  h: number; // 0-360
  s: number; // 0-1
  l: number; // 0-1
}

export type PaletteScheme =
  | "complementary"
  | "triadic"
  | "analogous"
  | "splitComplementary"
  | "tetradic";

export const PALETTE_SCHEMES: { key: PaletteScheme; label: string; description: string }[] = [
  { key: "complementary", label: "互补色", description: "色相环正对 180°" },
  { key: "analogous", label: "类比色", description: "相邻 ±30°" },
  { key: "triadic", label: "三角配色", description: "120° 等距分布" },
  { key: "splitComplementary", label: "分裂互补", description: "互补 ±30°" },
  { key: "tetradic", label: "四角配色", description: "90° 等距四色" },
];

// HSV → RGB
export function hsvToRgb(h: number, s: number, v: number): RgbColor {
  const c = v * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;

  if (hp >= 0 && hp < 1) { r = c; g = x; b = 0; }
  else if (hp >= 1 && hp < 2) { r = x; g = c; b = 0; }
  else if (hp >= 2 && hp < 3) { r = 0; g = c; b = x; }
  else if (hp >= 3 && hp < 4) { r = 0; g = x; b = c; }
  else if (hp >= 4 && hp < 5) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const m = v - c;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

// RGB → HSV
export function rgbToHsv(r: number, g: number, b: number): HsvColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  return { h, s, v: max };
}

// RGB → HEX
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// HSV → HEX (便捷)
export function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

// HEX → RGB
export function hexToRgb(hex: string): RgbColor | null {
  const clean = hex.replace("#", "").trim();
  const m = clean.match(/^([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!m) return null;
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// RGB → HSL
export function rgbToHsl(r: number, g: number, b: number): HslColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const delta = max - min;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, l };
}

// HSV → HSL (便捷)
export function hsvToHsl(h: number, s: number, v: number): HslColor {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHsl(r, g, b);
}

// 生成配色方案
export function generatePalette(base: HsvColor, scheme: PaletteScheme): HsvColor[] {
  const { h, s, v } = base;
  switch (scheme) {
    case "complementary":
      return [base, { h: (h + 180) % 360, s, v }];
    case "analogous":
      return [
        { h: (h + 330) % 360, s, v },
        base,
        { h: (h + 30) % 360, s, v },
      ];
    case "triadic":
      return [
        base,
        { h: (h + 120) % 360, s, v },
        { h: (h + 240) % 360, s, v },
      ];
    case "splitComplementary":
      return [
        base,
        { h: (h + 150) % 360, s, v },
        { h: (h + 210) % 360, s, v },
      ];
    case "tetradic":
      return [
        base,
        { h: (h + 90) % 360, s, v },
        { h: (h + 180) % 360, s, v },
        { h: (h + 270) % 360, s, v },
      ];
    default:
      return [base];
  }
}

// 根据明度判断前景色(黑/白)
export function pickForeground(h: number, s: number, v: number): string {
  return v > 0.6 && s < 0.5 ? "#050507" : "#f5f5f7";
}

// 格式化数值显示
export function formatHsv(hsv: HsvColor): string {
  return `H ${Math.round(hsv.h)}° · S ${Math.round(hsv.s * 100)}% · V ${Math.round(hsv.v * 100)}%`;
}

export function formatRgb(rgb: RgbColor): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function formatHsl(hsl: HslColor): string {
  return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
}
