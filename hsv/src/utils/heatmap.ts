// HSV 热力图工具:把图像的 H/S/V 通道用伪彩色 colormap 可视化
// 不修改原图,只生成分析视图

import { rgbToHsv } from "./color";

export type ColormapName = "turbo" | "viridis" | "jet" | "grayscale" | "hue";
export type ChannelName = "h" | "s" | "v" | "original";

export const COLORMAPS: { key: ColormapName; label: string; desc: string }[] = [
  { key: "turbo", label: "Turbo", desc: "Google 改进版 jet,感知均匀" },
  { key: "viridis", label: "Viridis", desc: "Matplotlib 默认,色盲友好" },
  { key: "jet", label: "Jet", desc: "经典彩虹,蓝→红" },
  { key: "grayscale", label: "灰度", desc: "黑白线性映射" },
  { key: "hue", label: "色相环", desc: "直接用色相角度着色" },
];

// 可调节参数
export interface HeatmapParams {
  thresholdMin: number; // 0-1,低于此值的像素映射到 colormap 最低端
  thresholdMax: number; // 0-1,高于此值的像素映射到 colormap 最高端
  gamma: number; // 0.1-3, gamma 校正,1 为线性
  contrast: number; // -1~1, 对比度偏移
  brightness: number; // -1~1, 亮度偏移
  invert: boolean; // 是否反转 colormap
}

export const DEFAULT_PARAMS: HeatmapParams = {
  thresholdMin: 0,
  thresholdMax: 1,
  gamma: 1,
  contrast: 0,
  brightness: 0,
  invert: false,
};

// 在 0-1 区间内线性插值
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// 把原始 0-1 值按参数映射到 colormap 输入值 0-1
function applyAdjustments(value: number, p: HeatmapParams): number {
  // 1. 阈值裁剪:把 [min, max] 区间映射到 [0, 1]
  let v = (value - p.thresholdMin) / (p.thresholdMax - p.thresholdMin);
  v = Math.max(0, Math.min(1, v));
  // 2. 亮度
  v = Math.max(0, Math.min(1, v + p.brightness));
  // 3. 对比度:围绕 0.5 中心放大/缩小
  v = Math.max(0, Math.min(1, (v - 0.5) * (1 + p.contrast) + 0.5));
  // 4. Gamma
  v = Math.pow(v, 1 / p.gamma);
  // 5. 反转
  if (p.invert) v = 1 - v;
  return v;
}

// Turbo colormap(Google,感知均匀)
// 简化版多项式近似
function turbo(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  const r = Math.round(
    255 * Math.max(0, Math.min(1, 0.13572138 + t * (4.6153926 + t * (-42.6602592 + t * (171.3507675 + t * (-348.9712511 + t * (325.7096251 + t * (-122.9773416))))))))
  );
  const g = Math.round(
    255 * Math.max(0, Math.min(1, 0.09140261 + t * (2.19418839 + t * (4.84296658 + t * (-14.18503333 + t * (4.27729857 + t * (2.82956604 + t * (2.14843189))))))))
  );
  const b = Math.round(
    255 * Math.max(0, Math.min(1, 0.10667330 + t * (12.64194608 + t * (-60.58204836 + t * (110.9667811 + t * (-89.35382284 + t * (33.43232474 + t * (-4.22931545))))))))
  );
  return [r, g, b];
}

// Viridis colormap(简化采样)
const VIRIDIS_STOPS: [number, [number, number, number]][] = [
  [0.0, [68, 1, 84]],
  [0.25, [59, 82, 139]],
  [0.5, [33, 145, 140]],
  [0.75, [94, 201, 98]],
  [1.0, [253, 231, 37]],
];

function viridis(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < VIRIDIS_STOPS.length; i++) {
    if (t <= VIRIDIS_STOPS[i][0]) {
      const [t0, c0] = VIRIDIS_STOPS[i - 1];
      const [t1, c1] = VIRIDIS_STOPS[i];
      const local = (t - t0) / (t1 - t0);
      return [
        Math.round(lerp(c0[0], c1[0], local)),
        Math.round(lerp(c0[1], c1[1], local)),
        Math.round(lerp(c0[2], c1[2], local)),
      ];
    }
  }
  return VIRIDIS_STOPS[VIRIDIS_STOPS.length - 1][1];
}

// Jet colormap(经典彩虹)
const JET_STOPS: [number, [number, number, number]][] = [
  [0.0, [0, 0, 131]],
  [0.125, [0, 0, 255]],
  [0.375, [0, 255, 255]],
  [0.625, [255, 255, 0]],
  [0.875, [255, 0, 0]],
  [1.0, [131, 0, 0]],
];

function jet(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < JET_STOPS.length; i++) {
    if (t <= JET_STOPS[i][0]) {
      const [t0, c0] = JET_STOPS[i - 1];
      const [t1, c1] = JET_STOPS[i];
      const local = (t - t0) / (t1 - t0);
      return [
        Math.round(lerp(c0[0], c1[0], local)),
        Math.round(lerp(c0[1], c1[1], local)),
        Math.round(lerp(c0[2], c1[2], local)),
      ];
    }
  }
  return JET_STOPS[JET_STOPS.length - 1][1];
}

function grayscale(t: number): [number, number, number] {
  const v = Math.round(Math.max(0, Math.min(1, t)) * 255);
  return [v, v, v];
}

// 色相环:直接用 H 值上色
function hueColor(h: number, s = 1, v = 1): [number, number, number] {
  // 简化 HSV→RGB
  const c = v * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp >= 0 && hp < 1) { r = c; g = x; }
  else if (hp < 2) { r = x; g = c; }
  else if (hp < 3) { g = c; b = x; }
  else if (hp < 4) { g = x; b = c; }
  else if (hp < 5) { r = x; b = c; }
  else { r = c; b = x; }
  const m = v - c;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// 主入口:对一张图的指定通道应用 colormap,返回热力图 ImageData
export function toHeatmap(
  source: ImageData,
  channel: ChannelName,
  colormap: ColormapName,
  params: HeatmapParams = DEFAULT_PARAMS
): ImageData {
  const out = new ImageData(source.width, source.height);
  const dst = out.data;
  const src = source.data;

  for (let i = 0; i < src.length; i += 4) {
    if (src[i + 3] === 0) continue;
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];

    if (channel === "original") {
      dst[i] = r;
      dst[i + 1] = g;
      dst[i + 2] = b;
      dst[i + 3] = 255;
      continue;
    }

    const hsv = rgbToHsv(r, g, b);
    const rawValue = channel === "h" ? hsv.h / 360 : channel === "s" ? hsv.s : hsv.v;
    // 应用所有调节
    const value = applyAdjustments(rawValue, params);

    let rgb: [number, number, number];
    if (channel === "h" && colormap === "hue") {
      // H 通道 + hue colormap = 直接用色相着色(也受调节影响)
      rgb = hueColor(value * 360);
    } else {
      switch (colormap) {
        case "turbo": rgb = turbo(value); break;
        case "viridis": rgb = viridis(value); break;
        case "jet": rgb = jet(value); break;
        case "grayscale": rgb = grayscale(value); break;
        case "hue":
          // 其他通道用 hue colormap 时,用饱和度=该值
          rgb = hueColor(channel === "s" ? hsv.h : (channel === "v" ? hsv.h : 0), value, 1);
          break;
      }
    }
    dst[i] = rgb[0];
    dst[i + 1] = rgb[1];
    dst[i + 2] = rgb[2];
    dst[i + 3] = 255;
  }
  return out;
}

// 计算通道直方图(返回 32 个 bin)
export function computeHistogram(source: ImageData, channel: ChannelName): number[] {
  const BINS = 32;
  const hist = new Array(BINS).fill(0);
  const src = source.data;
  for (let i = 0; i < src.length; i += 4) {
    if (src[i + 3] === 0) continue;
    const hsv = rgbToHsv(src[i], src[i + 1], src[i + 2]);
    const value = channel === "h" ? hsv.h / 360 : channel === "s" ? hsv.s : hsv.v;
    const bin = Math.min(BINS - 1, Math.floor(value * BINS));
    hist[bin]++;
  }
  return hist;
}
