import { useRef, useState, useCallback, useEffect } from "react";
import { Upload, X, Pipette, RotateCcw, Download, Eye, EyeOff, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { rgbToHsv, hsvToRgb, rgbToHex, type HsvColor } from "@/utils/color";
import {
  processSelectiveAdjust,
  generateMask,
  type HsvTolerance,
  type HsvAdjust,
} from "@/utils/selectiveColor";
import { generateSampleImage } from "@/utils/sampleImage";

const MAX_DIM = 900;

export default function SelectiveTuner({ className }: { className?: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null); // 原图(可见,上层)
  const processedCanvasRef = useRef<HTMLCanvasElement>(null); // 处理后(可见,底层)
  const sourceDataRef = useRef<ImageData | null>(null);
  const compareRef = useRef<HTMLDivElement>(null);
  const pendingSrcRef = useRef<string | null>(null); // 等待 canvas 挂载后才加载的 src

  const [hasImage, setHasImage] = useState(false);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [target, setTarget] = useState<HsvColor | null>(null);
  const [targetRgb, setTargetRgb] = useState<{ r: number; g: number; b: number } | null>(null);
  const [hoverPixel, setHoverPixel] = useState<{ r: number; g: number; b: number; x: number; y: number } | null>(null);

  const [tolerance, setTolerance] = useState<HsvTolerance>({ h: 20, s: 0.3, v: 0.3 });
  const [adjust, setAdjust] = useState<HsvAdjust>({ h: 0, s: 0, v: 0 });
  const [showMask, setShowMask] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [comparePos, setComparePos] = useState(50); // 0-100

  // 实际把 src 加载到 canvas
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
      [original, processed].forEach((c) => {
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
      });
      const oCtx = original.getContext("2d", { willReadFrequently: true });
      if (oCtx) {
        sourceDataRef.current = oCtx.getImageData(0, 0, w, h);
      }
      setImgSize({ w, h });
      setHasImage(true);
      setTarget(null);
      setTargetRgb(null);
      setHoverPixel(null);
      setAdjust({ h: 0, s: 0, v: 0 });
    };
    img.src = src;
  }, []);

  // 从 src(dataURL 或 objectURL)加载 - 处理 canvas 还未挂载的情况
  const loadFromSrc = useCallback((src: string) => {
    // 若 canvas 还未挂载(首次空状态),先记录 pending 并设置 hasImage=true 触发渲染
    if (!originalCanvasRef.current || !processedCanvasRef.current) {
      pendingSrcRef.current = src;
      setHasImage(true);
      return;
    }
    applySrcToCanvas(src);
  }, [applySrcToCanvas]);

  // 当 canvas 挂载完成且存在 pending src 时执行实际加载
  useEffect(() => {
    if (hasImage && pendingSrcRef.current) {
      const src = pendingSrcRef.current;
      pendingSrcRef.current = null;
      applySrcToCanvas(src);
    }
  }, [hasImage, applySrcToCanvas]);

  // 加载图片(从 File)
  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    loadFromSrc(url);
  }, [loadFromSrc]);

  // 加载示例图
  const loadSample = useCallback(() => {
    const dataUrl = generateSampleImage(800, 600);
    loadFromSrc(dataUrl);
  }, [loadFromSrc]);

  // 拾色
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
    setTarget(rgbToHsv(r, g, b));
    setTargetRgb({ r, g, b });
  }, []);

  // 悬停预览
  const handleMove = useCallback((e: React.PointerEvent) => {
    const canvas = originalCanvasRef.current;
    const sourceData = sourceDataRef.current;
    if (!canvas || !sourceData) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
      setHoverPixel(null);
      return;
    }
    const idx = (y * canvas.width + x) * 4;
    setHoverPixel({
      r: sourceData.data[idx],
      g: sourceData.data[idx + 1],
      b: sourceData.data[idx + 2],
      x, y,
    });
  }, []);

  // 处理图片
  const process = useCallback(() => {
    const sourceData = sourceDataRef.current;
    const processed = processedCanvasRef.current;
    if (!sourceData || !processed) return;
    setProcessing(true);
    requestAnimationFrame(() => {
      let result: ImageData;
      if (target) {
        result = showMask
          ? generateMask(sourceData, target, tolerance)
          : processSelectiveAdjust(sourceData, target, tolerance, adjust);
      } else {
        result = new ImageData(new Uint8ClampedArray(sourceData.data), sourceData.width, sourceData.height);
      }
      const ctx = processed.getContext("2d", { willReadFrequently: true });
      if (ctx) ctx.putImageData(result, 0, 0);
      setProcessing(false);
    });
  }, [target, tolerance, adjust, showMask]);

  useEffect(() => {
    if (!hasImage) return;
    const t = setTimeout(process, 80);
    return () => clearTimeout(t);
  }, [process, hasImage]);

  const handleClear = () => {
    setHasImage(false);
    setImgSize(null);
    setTarget(null);
    setTargetRgb(null);
    setHoverPixel(null);
    setAdjust({ h: 0, s: 0, v: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReset = () => {
    setAdjust({ h: 0, s: 0, v: 0 });
    setTolerance({ h: 20, s: 0.3, v: 0.3 });
    setShowMask(false);
  };

  const handleDownload = () => {
    const processed = processedCanvasRef.current;
    if (!processed) return;
    const link = document.createElement("a");
    link.download = `hsv-adjusted-${Date.now()}.png`;
    link.href = processed.toDataURL("image/png");
    link.click();
  };

  // 对比拖拽
  const handleCompareDrag = (e: React.PointerEvent) => {
    const el = compareRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((e.clientX - rect.left) / rect.width) * 100;
    setComparePos(Math.max(0, Math.min(100, p)));
  };

  return (
    <div className={cn("space-y-5", className)}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-widest border-2 border-ink shadow-brut-sm hover:shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5" strokeWidth={2.5} />
            {hasImage ? "更换图片" : "上传图片"}
          </button>
          <button
            onClick={loadSample}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-accent-yellow text-ink text-xs font-bold uppercase tracking-widest border-2 border-ink hover:bg-paper transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
            示例图
          </button>
          {hasImage && (
            <>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-paper text-ink text-xs font-bold uppercase tracking-widest border-2 border-ink hover:bg-ink hover:text-paper transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
                重置
              </button>
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-paper text-ink text-xs font-bold uppercase tracking-widest border-2 border-ink hover:bg-accent-red hover:text-paper hover:border-accent-red transition-colors"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                清除
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-accent-green text-ink text-xs font-bold uppercase tracking-widest border-2 border-ink shadow-brut-sm hover:shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
                下载
              </button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) loadImage(f);
            }}
          />
        </div>
        {hasImage && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMask(!showMask)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest border-2 border-ink transition-colors",
                showMask ? "bg-accent-red text-paper" : "bg-paper text-ink hover:bg-ink hover:text-paper"
              )}
            >
              {showMask ? <EyeOff className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Eye className="w-3.5 h-3.5" strokeWidth={2.5} />}
              {showMask ? "隐藏蒙版" : "显示蒙版"}
            </button>
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">
              {imgSize?.w} × {imgSize?.h}px
              {processing && <span className="ml-2 text-accent-red animate-blink">处理中</span>}
            </span>
          </div>
        )}
      </div>

      {!hasImage ? (
        <div
          className="aspect-[16/9] border-2 border-dashed border-ink grid place-items-center bg-paper-dark/50"
        >
          <div className="text-center px-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group inline-flex flex-col items-center"
            >
              <div className="inline-flex w-16 h-16 items-center justify-center bg-ink text-paper mb-4 group-hover:bg-accent-red transition-colors">
                <Upload className="w-7 h-7" strokeWidth={2.5} />
              </div>
              <div className="font-display text-3xl font-black tracking-tightest">点击上传</div>
              <div className="font-display text-2xl italic font-light mt-1">一张图片</div>
            </button>
            <button
              onClick={loadSample}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-accent-yellow text-ink text-xs font-bold uppercase tracking-widest border-2 border-ink shadow-brut-sm hover:shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
              加载示例图
            </button>
            <div className="mt-4 text-xs opacity-60 font-mono uppercase tracking-widest">
              上传后可点击拾取目标色 · 只调整该颜色范围内的像素
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
          {/* 左:对比视图 */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 flex items-center gap-2">
              <span className="w-2 h-2 bg-accent-red" />
              对比视图 · 左侧原图,右侧调整后 · 拖动中间分割线对比 · 点击图片拾取目标色
            </div>
            <div
              ref={compareRef}
              className="relative border-2 border-ink shadow-brut overflow-hidden bg-paper-dark select-none"
              onPointerMove={handleMove}
              onPointerLeave={() => setHoverPixel(null)}
              onPointerDown={(e) => {
                // 拾色(优先于对比拖拽)
                pickColorAt(e.clientX, e.clientY);
              }}
            >
              {/* 底层:处理后图 */}
              <canvas
                ref={processedCanvasRef}
                className="block w-full h-auto"
              />
              {/* 上层:原图,用 clip-path 显示左半部分 */}
              <canvas
                ref={originalCanvasRef}
                className="absolute top-0 left-0 block w-full h-full cursor-crosshair"
                style={{
                  clipPath: `inset(0 ${100 - comparePos}% 0 0)`,
                  WebkitClipPath: `inset(0 ${100 - comparePos}% 0 0)`,
                }}
              />

              {/* 标记 */}
              <div className="absolute top-2 left-2 bg-ink text-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-bold pointer-events-none">
                原图
              </div>
              <div className="absolute top-2 right-2 bg-accent-red text-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-bold pointer-events-none">
                {showMask ? "蒙版" : "调整后"}
              </div>

              {/* 悬停 HUD */}
              {hoverPixel && (
                <div className="absolute top-9 left-2 bg-ink text-paper px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest pointer-events-none">
                  <div>X {hoverPixel.x} · Y {hoverPixel.y}</div>
                  <div className="mt-0.5">RGB({hoverPixel.r}, {hoverPixel.g}, {hoverPixel.b})</div>
                  <div className="mt-0.5 text-accent-yellow">
                    #{hoverPixel.r.toString(16).padStart(2, "0")}{hoverPixel.g.toString(16).padStart(2, "0")}{hoverPixel.b.toString(16).padStart(2, "0")}
                  </div>
                </div>
              )}

              {/* 拾色提示 */}
              <div className="absolute bottom-2 right-2 bg-paper border-2 border-ink px-2 py-1 font-mono text-[10px] uppercase tracking-widest font-bold pointer-events-none">
                <Pipette className="w-3 h-3 inline mr-1" strokeWidth={2.5} />
                点击拾取目标色
              </div>

              {/* 分割线把手 */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-accent-yellow pointer-events-none"
                style={{ left: `${comparePos}%`, transform: "translateX(-50%)" }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-accent-yellow border-2 border-ink shadow-brut-sm flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 对比位置滑块(辅助) */}
            <div className="flex items-center gap-3 px-1">
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">分割位置</span>
              <input
                type="range"
                className="hsv-slider flex-1"
                min={0}
                max={100}
                step={1}
                value={comparePos}
                onChange={(e) => setComparePos(parseFloat(e.target.value))}
              />
              <span className="font-mono text-[10px] font-bold tabular-nums">{Math.round(comparePos)}%</span>
            </div>
          </div>

          {/* 右:控制面板 */}
          <div className="space-y-4">
            {/* 目标色 */}
            <div className="p-4 bg-paper border-2 border-ink shadow-brut-sm">
              <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-3">
                目标色 · 只调整此颜色范围
              </div>
              {target && targetRgb ? (
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 border-2 border-ink shadow-brut-sm shrink-0"
                    style={{ background: `rgb(${targetRgb.r}, ${targetRgb.g}, ${targetRgb.b})` }}
                  />
                  <div className="flex-1 min-w-0 font-mono text-xs space-y-1">
                    <div className="text-base font-bold">
                      #{targetRgb.r.toString(16).padStart(2, "0")}{targetRgb.g.toString(16).padStart(2, "0")}{targetRgb.b.toString(16).padStart(2, "0")}
                    </div>
                    <div className="opacity-70">RGB({targetRgb.r}, {targetRgb.g}, {targetRgb.b})</div>
                    <div className="opacity-70">H {Math.round(target.h)}° S {Math.round(target.s * 100)}% V {Math.round(target.v * 100)}%</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm opacity-60 py-4 text-center">
                  <Pipette className="w-5 h-5 mx-auto mb-2" strokeWidth={1.5} />
                  点击左侧图片任意位置拾取目标色
                </div>
              )}
            </div>

            {/* 容差 */}
            <div className={cn("p-4 bg-paper border-2 border-ink transition-opacity", !target && "opacity-50 pointer-events-none")}>
              <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-3">
                容差范围 · 影响多大颜色范围
              </div>
              <div className="space-y-4">
                <Slider label="色相容差" symbol="ΔH" value={tolerance.h} min={0} max={180} step={1} unit="°"
                  onChange={(v) => setTolerance((t) => ({ ...t, h: v }))} />
                <Slider label="饱和度容差" symbol="ΔS" value={tolerance.s} min={0} max={1} step={0.01}
                  displayFormat={(v) => `${Math.round(v * 100)}%`}
                  onChange={(v) => setTolerance((t) => ({ ...t, s: v }))} />
                <Slider label="明度容差" symbol="ΔV" value={tolerance.v} min={0} max={1} step={0.01}
                  displayFormat={(v) => `${Math.round(v * 100)}%`}
                  onChange={(v) => setTolerance((t) => ({ ...t, v: v }))} />
              </div>
              <p className="mt-3 pt-3 border-t border-ink/15 text-[10px] opacity-60 leading-relaxed">
                提示:容差越大,影响颜色范围越广。羽化权重让边缘像素平滑过渡,避免硬边。
              </p>
            </div>

            {/* 调整 */}
            <div className={cn("p-4 bg-paper border-2 border-ink transition-opacity", !target && "opacity-50 pointer-events-none")}>
              <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-3">
                HSV 调整 · 只作用于上述颜色范围
              </div>
              <div className="space-y-4">
                <Slider label="色相偏移" symbol="±H" value={adjust.h} min={-180} max={180} step={1} unit="°"
                  onChange={(v) => setAdjust((a) => ({ ...a, h: v }))} />
                <Slider label="饱和度偏移" symbol="±S" value={adjust.s} min={-1} max={1} step={0.01}
                  displayFormat={(v) => `${v >= 0 ? "+" : ""}${Math.round(v * 100)}%`}
                  onChange={(v) => setAdjust((a) => ({ ...a, s: v }))} />
                <Slider label="明度偏移" symbol="±V" value={adjust.v} min={-1} max={1} step={0.01}
                  displayFormat={(v) => `${v >= 0 ? "+" : ""}${Math.round(v * 100)}%`}
                  onChange={(v) => setAdjust((a) => ({ ...a, v: v }))} />
              </div>
              {target && (
                <div className="mt-4 pt-4 border-t-2 border-ink/15">
                  <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-2">
                    目标色 → 调整后色
                  </div>
                  <div className="flex items-center gap-2">
                    <Swatch hsv={target} label="目标" />
                    <span className="font-display text-2xl font-black">→</span>
                    <Swatch
                      hsv={{
                        h: ((target.h + adjust.h) % 360 + 360) % 360,
                        s: Math.max(0, Math.min(1, target.s + adjust.s)),
                        v: Math.max(0, Math.min(1, target.v + adjust.v)),
                      }}
                      label="调整后"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Slider({
  label, symbol, value, min, max, step, unit, displayFormat, onChange,
}: {
  label: string; symbol: string; value: number; min: number; max: number; step: number;
  unit?: string; displayFormat?: (v: number) => string; onChange: (v: number) => void;
}) {
  const display = displayFormat
    ? displayFormat(value)
    : unit === "%" ? `${Math.round(value * 100)}%` : `${Math.round(value)}${unit ?? ""}`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl font-black">{symbol}</span>
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">{label}</span>
        </div>
        <span className="font-mono text-xs font-bold tabular-nums">{display}</span>
      </div>
      <input type="range" className="hsv-slider" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

function Swatch({ hsv, label }: { hsv: HsvColor; label: string }) {
  const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const hex = rgbToHex(r, g, b);
  return (
    <div className="flex-1">
      <div className="w-full aspect-square border-2 border-ink shadow-brut-sm"
        style={{ background: `rgb(${r}, ${g}, ${b})` }} />
      <div className="mt-1.5 text-[9px] uppercase tracking-widest font-mono font-bold opacity-60">{label}</div>
      <div className="font-mono text-[10px] font-bold">{hex}</div>
    </div>
  );
}
