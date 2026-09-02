// 选择性调色工具:按颜色范围调整像素,而非整张图
// 核心:HSV 色彩空间距离判定 + 羽化权重 + 像素级偏移

import { rgbToHsv, hsvToRgb } from "./color";

export interface HsvTarget {
  h: number; // 0-360
  s: number; // 0-1
  v: number; // 0-1
}

export interface HsvTolerance {
  h: number; // 0-180(色相环距离)
  s: number; // 0-1
  v: number; // 0-1
}

export interface HsvAdjust {
  h: number; // -180~180 偏移
  s: number; // -1~1 偏移
  v: number; // -1~1 偏移
}

// 色相环距离(考虑 0-360 环形)
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// 计算 HSV 距离
export function hsvDistance(a: HsvTarget, b: HsvTarget) {
  return {
    dh: hueDistance(a.h, b.h),
    ds: Math.abs(a.s - b.s),
    dv: Math.abs(a.v - b.v),
  };
}

// 羽化权重:在容差内取 0~1,边缘平滑过渡(避免硬边)
export function featherWeight(
  dh: number,
  ds: number,
  dv: number,
  tol: HsvTolerance
): number {
  if (tol.h <= 0 || tol.s <= 0 || tol.v <= 0) return 0;
  // 任何一维超出容差 → 0
  if (dh > tol.h || ds > tol.s || dv > tol.v) return 0;
  // 各维度归一化距离 0(中心)~1(边缘),取最小值再平方使过渡更陡峭
  const wh = 1 - dh / tol.h;
  const ws = 1 - ds / tol.s;
  const wv = 1 - dv / tol.v;
  const w = Math.min(wh, ws, wv);
  // 用 smoothstep 让边缘更柔和
  return w * w * (3 - 2 * w);
}

// 判断是否在容差内(硬判定,用于蒙版可视化)
export function inTolerance(a: HsvTarget, b: HsvTarget, tol: HsvTolerance): boolean {
  const d = hsvDistance(a, b);
  return d.dh <= tol.h && d.ds <= tol.s && d.dv <= tol.v;
}

// 应用调整到单个 HSV(返回新 HSV)
export function applyAdjust(hsv: HsvTarget, adj: HsvAdjust): HsvTarget {
  return {
    h: ((hsv.h + adj.h) % 360 + 360) % 360,
    s: Math.max(0, Math.min(1, hsv.s + adj.s)),
    v: Math.max(0, Math.min(1, hsv.v + adj.v)),
  };
}

// 处理整张图像数据 - 选择性调整
// imageData: 原始 ImageData(会被修改为结果)
// 返回: 新的 ImageData(原始不变)
export function processSelectiveAdjust(
  source: ImageData,
  target: HsvTarget,
  tol: HsvTolerance,
  adj: HsvAdjust
): ImageData {
  const out = new ImageData(
    new Uint8ClampedArray(source.data),
    source.width,
    source.height
  );
  const data = out.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // 跳过完全透明像素
    if (data[i + 3] === 0) continue;

    const hsv = rgbToHsv(r, g, b);
    const d = hsvDistance(hsv, target);
    const w = featherWeight(d.dh, d.ds, d.dv, tol);

    if (w > 0) {
      const adjusted = applyAdjust(hsv, adj);
      const newRgb = hsvToRgb(adjusted.h, adjusted.s, adjusted.v);
      // 用权重混合:结果 = 原色 * (1-w) + 新色 * w
      data[i] = r + (newRgb.r - r) * w;
      data[i + 1] = g + (newRgb.g - g) * w;
      data[i + 2] = b + (newRgb.b - b) * w;
    }
  }

  return out;
}

// 生成蒙版可视化(白色 = 完全选中,黑色 = 未选中)
export function generateMask(
  source: ImageData,
  target: HsvTarget,
  tol: HsvTolerance
): ImageData {
  const out = new ImageData(
    new Uint8ClampedArray(source.data.length),
    source.width,
    source.height
  );
  const srcData = source.data;
  const dstData = out.data;
  const len = srcData.length;

  for (let i = 0; i < len; i += 4) {
    if (srcData[i + 3] === 0) continue;
    const r = srcData[i];
    const g = srcData[i + 1];
    const b = srcData[i + 2];
    const hsv = rgbToHsv(r, g, b);
    const d = hsvDistance(hsv, target);
    const w = featherWeight(d.dh, d.ds, d.dv, tol);
    // 用红色高亮显示蒙版范围
    dstData[i] = 255 * w; // R
    dstData[i + 1] = 0;
    dstData[i + 2] = 0;
    dstData[i + 3] = 255 * w * 0.7;
  }

  return out;
}
