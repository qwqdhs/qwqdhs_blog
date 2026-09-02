import { useRef, useState, useCallback, useEffect } from "react";
import { Upload, X, RotateCcw, Download, Eye, EyeOff, Sparkles, Sliders, Leaf, Cherry, Mountain, Pipette } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateSampleImage } from "@/utils/sampleImage";
import { Link } from "react-router-dom";

const MAX_DIM = 900;

// ============================================================
// OpenCV 兼容的 HSV 范围: H: 0-180, S: 0-255, V: 0-255
// 与 Python cv2.cvtColor 完全一致, 便于 YOLO 训练管线对接
// ============================================================

// 预设阈值(OpenCV 范围)
const PRESETS = [
  {
    key: "tomato",
    label: "番茄",
    icon: <Cherry className="w-3.5 h-3.5" strokeWidth={2.5} />,
    desc: "红色果实 H 0°-15° (OpenCV)",
    hMin: 0, hMax: 15,
    sMin: 70, sMax: 255,
    vMin: 50, vMax: 255,
    accent: "accent-red",
  },
  {
    key: "leaf",
    label: "叶片",
    icon: <Leaf className="w-3.5 h-3.5" strokeWidth={2.5} />,
    desc: "绿色叶子 H 32°-89° (OpenCV)",
    hMin: 32, hMax: 89,
    sMin: 40, sMax: 255,
    vMin: 40, vMax: 255,
    accent: "accent-green",
  },
  {
    key: "soil",
    label: "土壤",
    icon: <Mountain className="w-3.5 h-3.5" strokeWidth={2.5} />,
    desc: "褐色土壤 低饱和低明度",
    hMin: 10, hMax: 30,
    sMin: 0, sMax: 120,
    vMin: 30, vMax: 160,
    accent: "accent-yellow",
  },
] as const;

type PresetKey = typeof PRESETS[number]["key"];

// 色相判定(考虑环形: OpenCV 中 0 和 180 相邻, 都是红色)
function hueInRange(h: number, min: number, max: number): boolean {
  if (min <= max) return h >= min && h <= max;
  // 跨越 0/180 线 (如 min=170, max=10)
  return h >= min || h <= max;
}

// OpenCV 兼容的 RGB→HSV 转换 (内联, 高性能)
// 返回: h: 0-180, s: 0-255, v: 0-255
function rgbToHsvCV(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const mx = Math.max(rn, gn, bn);
  const mn = Math.min(rn, gn, bn);
  const delta = mx - mn;
  let hh = 0;
  if (delta !== 0) {
    if (mx === rn) hh = ((gn - bn) / delta) % 6;
    else if (mx === gn) hh = (bn - rn) / delta + 2;
    else hh = (rn - gn) / delta + 4;
    hh *= 60;
    if (hh < 0) hh += 360;
  }
  const ss = mx === 0 ? 0 : (delta / mx) * 255;
  const vv = mx * 255;
  return { h: Math.round(hh / 2), s: Math.round(ss), v: Math.round(vv) };
}

// 容差: 点击拾色后围绕目标色自动设置范围
const TOLERANCE = { h: 8, s: 50, v: 50 };

export default function Playground() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceDataRef = useRef<ImageData | null>(null);
  const pendingSrcRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const thrRef = useRef({ hMin: 0, hMax: 15, sMin: 70, sMax: 255, vMin: 50, vMax: 255 });
  const modeRef = useRef<"overlay" | "mask">("overlay");

  const [hasImage, setHasImage] = useState(false);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [hoverPixel, setHoverPixel] = useState<{ r: number; g: number; b: number; x: number; y: number; h: number; s: number; v: number; inMask: boolean } | null>(null);
  const [pickedColor, setPickedColor] = useState<{ r: number; g: number; b: number; h: number; s: number; v: number } | null>(null);

  // OpenCV 范围的 HSV 阈值
  const [hMin, setHMin] = useState(0);
  const [hMax, setHMax] = useState(15);
  const [sMin, setSMin] = useState(70);
  const [sMax, setSMax] = useState(255);
  const [vMin, setVMin] = useState(50);
  const [vMax, setVMax] = useState(255);

  const [mode, setMode] = useState<"overlay" | "mask">("overlay");
  const [activePreset, setActivePreset] = useState<PresetKey | null>("tomato");
  const [maskStats, setMaskStats] = useState<{ count: number; total: number; percent: number } | null>(null);

  useEffect(() => { thrRef.current = { hMin, hMax, sMin, sMax, vMin, vMax }; }, [hMin, hMax, sMin, sMax, vMin, vMax]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // ==================== 核心处理: OpenCV 兼容 HSV 分割 ====================
  const process = useCallback(() => {
    const sourceData = sourceDataRef.current;
    const processed = processedCanvasRef.current;
    if (!sourceData || !processed) return;
    const thr = thrRef.current;
    const curMode = modeRef.current;

    const src = sourceData.data;
    const W = sourceData.width;
    const H = sourceData.height;
    const ctx = processed.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    if (processed.width !== W) processed.width = W;
    if (processed.height !== H) processed.height = H;
    const out = ctx.createImageData(W, H);
    const dst = out.data;

    const { hMin: th, hMax: tx, sMin: ts, sMax: tm, vMin: tv, vMax: tn } = thr;
    let hit = 0;
    const total = src.length >> 2;

    if (curMode === "overlay") {
      for (let i = 0; i < src.length; i += 4) {
        const r = src[i];
        const g = src[i + 1];
        const b = src[i + 2];
        const a = src[i + 3];
        // OpenCV 兼容 HSV
        const rn = r / 255, gn = g / 255, bn = b / 255;
        const mx = Math.max(rn, gn, bn);
        const mn = Math.min(rn, gn, bn);
        const delta = mx - mn;
        let hh = 0;
        if (delta !== 0) {
          if (mx === rn) hh = ((gn - bn) / delta) % 6;
          else if (mx === gn) hh = (bn - rn) / delta + 2;
          else hh = (rn - gn) / delta + 4;
          hh *= 60;
          if (hh < 0) hh += 360;
        }
        const ss = mx === 0 ? 0 : (delta / mx) * 255;
        const vv = mx * 255;
        const h = Math.round(hh / 2);
        const s = Math.round(ss);
        const v = Math.round(vv);
        const inMask = hueInRange(h, th, tx) && s >= ts && s <= tm && v >= tv && v <= tn;
        if (inMask) {
          dst[i] = r; dst[i + 1] = g; dst[i + 2] = b; dst[i + 3] = a;
          hit++;
        } else {
          const gray = (0.299 * r + 0.587 * g + 0.114 * b) * 0.35;
          dst[i] = gray; dst[i + 1] = gray; dst[i + 2] = gray; dst[i + 3] = a;
        }
      }
    } else {
      for (let i = 0; i < src.length; i += 4) {
        const r = src[i], g = src[i + 1], b = src[i + 2];
        const rn = r / 255, gn = g / 255, bn = b / 255;
        const mx = Math.max(rn, gn, bn);
        const mn = Math.min(rn, gn, bn);
        const delta = mx - mn;
        let hh = 0;
        if (delta !== 0) {
          if (mx === rn) hh = ((gn - bn) / delta) % 6;
          else if (mx === gn) hh = (bn - rn) / delta + 2;
          else hh = (rn - gn) / delta + 4;
          hh *= 60;
          if (hh < 0) hh += 360;
        }
        const ss = mx === 0 ? 0 : (delta / mx) * 255;
        const vv = mx * 255;
        const h = Math.round(hh / 2);
        const s = Math.round(ss);
        const v = Math.round(vv);
        const inMask = hueInRange(h, th, tx) && s >= ts && s <= tm && v >= tv && v <= tn;
        const val = inMask ? 255 : 0;
        if (inMask) hit++;
        dst[i] = val; dst[i + 1] = val; dst[i + 2] = val; dst[i + 3] = 255;
      }
    }

    ctx.putImageData(out, 0, 0);
    setMaskStats({ count: hit, total, percent: (hit / total) * 100 });
  }, []);

  const scheduleProcess = useCallback(() => {
    if (!hasImage) return;
    if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      process();
    });
  }, [hasImage, process]);

  useEffect(() => { scheduleProcess(); }, [scheduleProcess, hMin, hMax, sMin, sMax, vMin, vMax, mode]);
  useEffect(() => () => { if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current); }, []);

  // ==================== 图片加载 ====================
  const applySrcToCanvas = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        const r = Math.min(MAX_DIM / w, MAX_DIM / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const original = originalCanvasRef.current;
      const processed = processedCanvasRef.current;
      if (!original || !processed) return;
      original.width = w;
      original.height = h;
      processed.width = w;
      processed.height = h;
      const oCtx = original.getContext("2d", { willReadFrequently: true });
      if (!oCtx) return;
      oCtx.clearRect(0, 0, w, h);
      oCtx.drawImage(img, 0, 0, w, h);
      sourceDataRef.current = oCtx.getImageData(0, 0, w, h);
      setImgSize({ w, h });
      setHasImage(true);
      setHoverPixel(null);
      setPickedColor(null);
      setMaskStats(null);
      scheduleProcess();
    };
    img.src = src;
  }, [scheduleProcess]);

  const loadFromSrc = useCallback((src: string) => {
    if (!originalCanvasRef.current || !processedCanvasRef.current) {
      pendingSrcRef.current = src;
      setHasImage(true);
      return;
    }
    applySrcToCanvas(src);
  }, [applySrcToCanvas]);

  useEffect(() => {
    if (hasImage && pendingSrcRef.current) {
      const src = pendingSrcRef.current;
      pendingSrcRef.current = null;
      applySrcToCanvas(src);
    }
  }, [hasImage, applySrcToCanvas]);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    loadFromSrc(url);
  }, [loadFromSrc]);

  const loadSample = useCallback(() => {
    loadFromSrc(generateSampleImage(800, 600));
  }, [loadFromSrc]);

  // ==================== 点击拾色: 自动设置 HSV 范围 ====================
  const pickColorAt = useCallback((clientX: number, clientY: number) => {
    const canvas = originalCanvasRef.current;
    const sourceData = sourceDataRef.current;
    if (!canvas || !sourceData) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((clientX - rect.left) * scaleX);
    const y = Math.floor((clientY - rect.top) * scaleY);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
    const idx = (y * canvas.width + x) * 4;
    const r = sourceData.data[idx];
    const g = sourceData.data[idx + 1];
    const b = sourceData.data[idx + 2];
    const hsv = rgbToHsvCV(r, g, b);
    setPickedColor({ r, g, b, h: hsv.h, s: hsv.s, v: hsv.v });
    // 围绕拾取色自动设置范围 (±容差)
    setHMin(Math.max(0, hsv.h - TOLERANCE.h));
    setHMax(Math.min(180, hsv.h + TOLERANCE.h));
    setSMin(Math.max(0, hsv.s - TOLERANCE.s));
    setSMax(Math.min(255, hsv.s + TOLERANCE.s));
    setVMin(Math.max(0, hsv.v - TOLERANCE.v));
    setVMax(Math.min(255, hsv.v + TOLERANCE.v));
    setActivePreset(null);
  }, []);

  // ==================== 悬停: 显示像素信息 ====================
  const handleMove = useCallback((e: React.PointerEvent) => {
    const canvas = originalCanvasRef.current;
    const sourceData = sourceDataRef.current;
    if (!canvas || !sourceData) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) { setHoverPixel(null); return; }
    const idx = (y * canvas.width + x) * 4;
    const r = sourceData.data[idx];
    const g = sourceData.data[idx + 1];
    const b = sourceData.data[idx + 2];
    const hsv = rgbToHsvCV(r, g, b);
    const thr = thrRef.current;
    const inMask = hueInRange(hsv.h, thr.hMin, thr.hMax) &&
      hsv.s >= thr.sMin && hsv.s <= thr.sMax &&
      hsv.v >= thr.vMin && hsv.v <= thr.vMax;
    setHoverPixel({ r, g, b, x, y, h: hsv.h, s: hsv.s, v: hsv.v, inMask });
  }, []);

  // ==================== 其他操作 ====================
  const applyPreset = (p: typeof PRESETS[number]) => {
    setHMin(p.hMin); setHMax(p.hMax);
    setSMin(p.sMin); setSMax(p.sMax);
    setVMin(p.vMin); setVMax(p.vMax);
    setActivePreset(p.key);
    setPickedColor(null);
  };

  const handleClear = () => {
    setHasImage(false);
    setImgSize(null);
    setHoverPixel(null);
    setPickedColor(null);
    setMaskStats(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = () => applyPreset(PRESETS[0]);

  const handleDownload = () => {
    const processed = processedCanvasRef.current;
    if (!processed) return;
    const link = document.createElement("a");
    link.download = `hsv-segment-${mode}-${Date.now()}.png`;
    link.href = processed.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="container py-10 lg:py-14">
      <header className="mb-8 animate-fade-up">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60">CHAPTER 01 · HSV SEGMENTATION</div>
            <h1 className="mt-3 font-display text-5xl lg:text-7xl font-black tracking-tightest leading-[0.9]">
              HSV <span className="italic font-light">颜色分割</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest font-bold opacity-70">
            <span className="inline-flex items-center gap-1.5"><Upload className="w-4 h-4" strokeWidth={2.5} />导入图片</span>
            <span className="inline-flex items-center gap-1.5"><Pipette className="w-4 h-4" strokeWidth={2.5} />点击拾色</span>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-base leading-relaxed">
          采用 <span className="font-bold">OpenCV 兼容 HSV 色彩空间</span>（H: 0-180, S: 0-255, V: 0-255），
          与 Python cv2 / YOLO 训练管线完全一致。
          <span className="font-bold text-accent-red">点击图片上的目标颜色</span> 可自动设置 HSV 阈值范围，
          精准分割 <span className="text-accent-red font-bold">番茄</span>、<span className="text-accent-green font-bold">叶片</span>、<span className="text-accent-yellow font-bold">土壤</span>。
        </p>
      </header>

      {/* 预设类别 */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up delay-1">
        {PRESETS.map((p) => (
          <button key={p.key} onClick={() => applyPreset(p)}
            className={cn(
              "p-4 border-2 border-ink shadow-brut-sm text-left transition-all",
              activePreset === p.key ? `bg-${p.accent} shadow-brut -translate-y-0.5` : "bg-paper hover:shadow-brut hover:-translate-y-0.5"
            )}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold opacity-60">PRESET</span>
              <span className="w-7 h-7 bg-ink text-paper flex items-center justify-center">{p.icon}</span>
            </div>
            <div className="font-display text-2xl font-black tracking-tightest">{p.label}</div>
            <p className="text-xs opacity-70 mt-1 leading-relaxed">{p.desc}</p>
            <div className="mt-2 font-mono text-[10px] opacity-60">
              H {p.hMin}-{p.hMax} · S {p.sMin}-{p.sMax} · V {p.vMin}-{p.vMax}
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-5 animate-fade-up delay-2">
        {/* 工具栏 */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-widest border-2 border-ink shadow-brut-sm hover:shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <Upload className="w-3.5 h-3.5" strokeWidth={2.5} />
              {hasImage ? "更换图片" : "导入图片"}
            </button>
            <button onClick={loadSample}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-accent-yellow text-ink text-xs font-bold uppercase tracking-widest border-2 border-ink hover:bg-paper transition-colors">
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />示例图
            </button>
            {hasImage && (
              <>
                <button onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-paper text-ink text-xs font-bold uppercase tracking-widest border-2 border-ink hover:bg-ink hover:text-paper transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />重置
                </button>
                <button onClick={handleClear}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-paper text-ink text-xs font-bold uppercase tracking-widest border-2 border-ink hover:bg-accent-red hover:text-paper hover:border-accent-red transition-colors">
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />清除
                </button>
                <button onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-accent-green text-ink text-xs font-bold uppercase tracking-widest border-2 border-ink shadow-brut-sm hover:shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                  <Download className="w-3.5 h-3.5" strokeWidth={2.5} />导出
                </button>
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImage(f); }} />
          </div>
          {hasImage && (
            <div className="flex items-center gap-3">
              <button onClick={() => setMode(mode === "overlay" ? "mask" : "overlay")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest border-2 border-ink transition-colors",
                  mode === "mask" ? "bg-accent-red text-paper" : "bg-paper text-ink hover:bg-ink hover:text-paper"
                )}>
                {mode === "mask" ? <EyeOff className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Eye className="w-3.5 h-3.5" strokeWidth={2.5} />}
                {mode === "mask" ? "蒙版模式" : "叠加模式"}
              </button>
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">
                {imgSize?.w} × {imgSize?.h}px
                {maskStats && (
                  <span className="ml-2">
                    命中 <span className="font-bold text-accent-green">{maskStats.percent.toFixed(1)}%</span>
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {!hasImage ? (
          <div onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) loadImage(f); }}
            className="aspect-[16/9] border-2 border-dashed border-ink grid place-items-center bg-paper-dark/50">
            <div className="text-center px-6">
              <button onClick={() => fileInputRef.current?.click()} className="group inline-flex flex-col items-center">
                <div className="inline-flex w-16 h-16 items-center justify-center bg-ink text-paper mb-4 group-hover:bg-accent-red transition-colors">
                  <Upload className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <div className="font-display text-3xl font-black tracking-tightest">点击导入</div>
                <div className="font-display text-2xl italic font-light mt-1">或拖拽图片到这里</div>
              </button>
              <button onClick={loadSample}
                className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-accent-yellow text-ink text-xs font-bold uppercase tracking-widest border-2 border-ink shadow-brut-sm hover:shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />加载示例图
              </button>
              <div className="mt-4 text-xs opacity-60 font-mono uppercase tracking-widest">
                JPG · PNG · WEBP · 本地处理 · 上方选预设或点击图片拾色
              </div>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_1fr_360px] gap-4 items-start">
            {/* 左:完整原图 (点击拾色 + 悬停查 HSV) */}
            <figure className="space-y-2 m-0">
              <figcaption className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 flex items-center gap-2">
                <span className="w-2 h-2 bg-ink" />原图 · 点击拾取目标色
              </figcaption>
              <div className="relative border-2 border-ink shadow-brut-sm overflow-hidden bg-paper-dark">
                <canvas ref={originalCanvasRef} className="block w-full h-auto cursor-crosshair"
                  onPointerDown={(e) => pickColorAt(e.clientX, e.clientY)}
                  onPointerMove={handleMove}
                  onPointerLeave={() => setHoverPixel(null)} />
                <div className="absolute top-2 left-2 bg-ink text-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-bold pointer-events-none">原图</div>
                <div className="absolute bottom-2 right-2 bg-accent-yellow text-ink border-2 border-ink px-2 py-1 font-mono text-[10px] uppercase tracking-widest font-bold pointer-events-none">
                  <Pipette className="w-3 h-3 inline mr-1" strokeWidth={2.5} />点击拾色
                </div>
                {hoverPixel && (
                  <div className="absolute top-9 left-2 bg-ink text-paper px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest pointer-events-none">
                    <div>X {hoverPixel.x} · Y {hoverPixel.y}</div>
                    <div>RGB({hoverPixel.r}, {hoverPixel.g}, {hoverPixel.b})</div>
                    <div>H {hoverPixel.h} · S {hoverPixel.s} · V {hoverPixel.v}</div>
                    <div className={cn("mt-0.5 font-bold", hoverPixel.inMask ? "text-accent-green" : "opacity-60")}>
                      {hoverPixel.inMask ? "✓ 在阈值内" : "✗ 在阈值外"}
                    </div>
                  </div>
                )}
              </div>
            </figure>

            {/* 中:完整分割结果 */}
            <figure className="space-y-2 m-0">
              <figcaption className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-red" />HSV 分割结果 · {mode === "mask" ? "MASK" : "OVERLAY"}
              </figcaption>
              <div className="relative border-2 border-ink shadow-brut-sm overflow-hidden bg-paper-dark">
                <canvas ref={processedCanvasRef} className="block w-full h-auto" />
                <div className="absolute top-2 left-2 bg-accent-red text-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-bold pointer-events-none">
                  {mode === "mask" ? "分割蒙版" : "HSV 分割"}
                </div>
              </div>
            </figure>

            {/* 右:控制面板 */}
            <aside className="space-y-4 lg:sticky lg:top-20">
              {/* 拾取色展示 */}
              {pickedColor && (
                <div className="p-4 border-2 border-ink bg-paper shadow-brut-sm">
                  <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-3">
                    已拾取目标色 · 自动设阈值
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 border-2 border-ink shadow-brut-sm shrink-0"
                      style={{ background: `rgb(${pickedColor.r}, ${pickedColor.g}, ${pickedColor.b})` }} />
                    <div className="font-mono text-xs space-y-1">
                      <div className="font-bold">H {pickedColor.h} · S {pickedColor.s} · V {pickedColor.v}</div>
                      <div className="opacity-70">RGB({pickedColor.r}, {pickedColor.g}, {pickedColor.b})</div>
                      <div className="opacity-60 text-[10px]">±容差 H{TOLERANCE.h} S{TOLERANCE.s} V{TOLERANCE.v}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* H 范围 (OpenCV: 0-180) */}
              <PanelRange symbol="H" label="色相 · Hue (0-180)"
                minVal={hMin} maxVal={hMax} min={0} max={180} step={1}
                trackStyle={{ background: "linear-gradient(90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)" }}
                onMinChange={(v) => { setHMin(Math.min(v, hMax)); setActivePreset(null); }}
                onMaxChange={(v) => { setHMax(Math.max(v, hMin)); setActivePreset(null); }} />

              {/* S 范围 (OpenCV: 0-255) */}
              <PanelRange symbol="S" label="饱和度 · Sat (0-255)"
                minVal={sMin} maxVal={sMax} min={0} max={255} step={1}
                trackStyle={{ background: `linear-gradient(90deg, hsl(${hMin * 2}, 0%, 50%), hsl(${hMin * 2}, 100%, 50%))` }}
                onMinChange={(v) => { setSMin(Math.min(v, sMax)); setActivePreset(null); }}
                onMaxChange={(v) => { setSMax(Math.max(v, sMin)); setActivePreset(null); }} />

              {/* V 范围 (OpenCV: 0-255) */}
              <PanelRange symbol="V" label="明度 · Val (0-255)"
                minVal={vMin} maxVal={vMax} min={0} max={255} step={1}
                trackStyle={{ background: `linear-gradient(90deg, #000000, hsl(${hMin * 2}, ${Math.round((sMin / 255) * 100)}%, 50%))` }}
                onMinChange={(v) => { setVMin(Math.min(v, vMax)); setActivePreset(null); }}
                onMaxChange={(v) => { setVMax(Math.max(v, vMin)); setActivePreset(null); }} />

              {/* 判定总览 */}
              <div className="p-4 border-2 border-ink bg-paper-dark">
                <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-2">当前判定条件</div>
                <div className="font-mono text-xs space-y-1.5">
                  <Row symbol="H" range={`[${hMin}, ${hMax}]`}
                    extra={hoverPixel ? { cur: `${hoverPixel.h}`, ok: hueInRange(hoverPixel.h, hMin, hMax) } : undefined} />
                  <Row symbol="S" range={`[${sMin}, ${sMax}]`}
                    extra={hoverPixel ? { cur: `${hoverPixel.s}`, ok: hoverPixel.s >= sMin && hoverPixel.s <= sMax } : undefined} />
                  <Row symbol="V" range={`[${vMin}, ${vMax}]`}
                    extra={hoverPixel ? { cur: `${hoverPixel.v}`, ok: hoverPixel.v >= vMin && hoverPixel.v <= vMax } : undefined} />
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* 底部说明 */}
      <div className="mt-10 grid lg:grid-cols-2 gap-4 animate-fade-up delay-3">
        <div className="p-5 border-2 border-ink bg-paper-dark">
          <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-2">算法说明</div>
          <h3 className="font-display text-2xl font-black tracking-tightest mb-2">OpenCV 兼容 HSV 阈值</h3>
          <div className="text-sm leading-relaxed opacity-80 space-y-2">
            <p>HSV 范围与 Python cv2.cvtColor 完全一致（H: 0-180, S: 0-255, V: 0-255），可直接对接 YOLO 训练管线。</p>
            <pre className="bg-ink text-paper p-3 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">{`# Python 等价代码
lower = np.array([Hmin, Smin, Vmin])
upper = np.array([Hmax, Smax, Vmax])
mask = cv2.inRange(hsv_img, lower, upper)`}</pre>
            <p>点击图片上的目标颜色，自动设置 ±容差范围，比手动调滑条更精准。</p>
          </div>
        </div>
        <div className="p-5 border-2 border-ink bg-ink text-paper">
          <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-2">联动验证</div>
          <h3 className="font-display text-2xl font-black tracking-tightest mb-2">HSV 分割 ↔ 热力图</h3>
          <p className="text-sm opacity-80 mb-4 leading-relaxed">
            每个番茄检测结果都会生成「注意力热力图」。热力集中覆盖果实区域 = 与 HSV 判定一致；
            热力分散 = 需追加训练样本或回到本页微调阈值。
          </p>
          <Link to="/adjust" className="inline-flex items-center gap-1.5 px-4 py-2 bg-paper text-ink text-[10px] uppercase tracking-widest font-bold border-2 border-paper hover:bg-accent-yellow hover:border-accent-yellow transition-colors">
            打开 HSV 热力图验证 →
          </Link>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// 单通道阈值面板 (OpenCV 整数范围, 整数步进)
// =============================================================
function PanelRange({
  symbol, label, minVal, maxVal, min, max, step,
  onMinChange, onMaxChange, trackStyle,
}: {
  symbol: string; label: string;
  minVal: number; maxVal: number;
  min: number; max: number; step: number;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
  trackStyle?: React.CSSProperties;
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div className="p-4 bg-paper border-2 border-ink shadow-brut-sm">
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-black">{symbol}</span>
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">{label}</span>
        </div>
        <span className="font-mono text-xs font-bold tabular-nums">
          {minVal} <span className="opacity-40">~</span> {maxVal}
        </span>
      </div>
      {/* 色条 + 范围指示 */}
      <div className="relative h-3 mb-3">
        <div className="absolute inset-0 rounded-full border border-ink/50" style={trackStyle} />
        <div className="absolute top-0 bottom-0 border-2 border-ink bg-paper/15"
          style={{ left: `${pct(minVal)}%`, width: `${Math.max(1, pct(maxVal) - pct(minVal))}%` }} />
      </div>
      {/* 两个独立滑块 + 数值 */}
      <div className="space-y-2">
        <EndSlider side="Min" value={minVal}
          min={min} max={max} step={step} onChange={onMinChange} />
        <EndSlider side="Max" value={maxVal}
          min={min} max={max} step={step} onChange={onMaxChange} />
      </div>
    </div>
  );
}

function EndSlider({
  side, value, min, max, step, onChange,
}: {
  side: "Min" | "Max";
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "w-10 shrink-0 text-[10px] uppercase tracking-widest font-mono font-bold px-2 py-1 border-2 border-ink",
        side === "Min" ? "bg-paper-dark" : "bg-accent-yellow"
      )}>{side}</span>
      <input
        type="range"
        className="hsv-slider flex-1"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
      />
      <span className="font-mono text-xs font-bold tabular-nums w-12 text-right">
        {value}
      </span>
    </div>
  );
}

function Row({
  symbol, range, extra,
}: { symbol: string; range: string; extra?: { cur: string; ok: boolean } }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="font-display text-lg font-black">{symbol}</span>
        <span className="opacity-80">∈ {range}</span>
      </div>
      {extra && (
        <span className={cn("text-[10px] font-bold", extra.ok ? "text-accent-green" : "opacity-50")}>
          {extra.cur} {extra.ok ? "✓" : "✗"}
        </span>
      )}
    </div>
  );
}
