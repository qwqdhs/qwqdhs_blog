import { useRef, useState, useCallback, useEffect } from "react";
import { Upload, X, Sparkles, Pipette, Download, Sliders, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { rgbToHsv, rgbToHex } from "@/utils/color";
import {
  toHeatmap,
  computeHistogram,
  COLORMAPS,
  DEFAULT_PARAMS,
  type ColormapName,
  type ChannelName,
  type HeatmapParams,
} from "@/utils/heatmap";

const MAX_DIM = 1000;
const CHANNELS: { key: ChannelName; label: string; symbol: string; desc: string }[] = [
  { key: "original", label: "原图", symbol: "RGB", desc: "未处理" },
  { key: "h", label: "色相", symbol: "H", desc: "0° → 360°" },
  { key: "s", label: "饱和度", symbol: "S", desc: "0% → 100%" },
  { key: "v", label: "明度", symbol: "V", desc: "0% → 100%" },
];

export default function HeatmapAnalyzer({ className }: { className?: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceDataRef = useRef<ImageData | null>(null);
  const canvasRefs = useRef<Record<ChannelName, HTMLCanvasElement | null>>({
    original: null,
    h: null,
    s: null,
    v: null,
  });
  const pendingSrcRef = useRef<string | null>(null);

  const [hasImage, setHasImage] = useState(false);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [colormap, setColormap] = useState<ColormapName>("turbo");
  const [activeChannel, setActiveChannel] = useState<ChannelName>("h");
  const [params, setParams] = useState<HeatmapParams>(DEFAULT_PARAMS);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    h: number;
    s: number;
    v: number;
    hex: string;
  } | null>(null);
  const [histograms, setHistograms] = useState<Record<Exclude<ChannelName, "original">, number[]> | null>(null);
  const [processing, setProcessing] = useState(false);

  const updateParam = useCallback(<K extends keyof HeatmapParams>(key: K, value: HeatmapParams[K]) => {
    setParams((p) => ({ ...p, [key]: value }));
  }, []);

  const applySrc = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > MAX_DIM || h > MAX_DIM) {
        const r = Math.min(MAX_DIM / w, MAX_DIM / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const source = sourceCanvasRef.current;
      if (!source) return;
      source.width = w;
      source.height = h;
      const ctx = source.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      sourceDataRef.current = ctx.getImageData(0, 0, w, h);

      setImgSize({ w, h });
      setHasImage(true);
      setHoverInfo(null);

      const data = sourceDataRef.current;
      setHistograms({
        h: computeHistogram(data, "h"),
        s: computeHistogram(data, "s"),
        v: computeHistogram(data, "v"),
      });
    };
    img.onerror = () => console.error("图片加载失败");
    img.src = src;
  }, []);

  useEffect(() => {
    if (hasImage && pendingSrcRef.current) {
      const src = pendingSrcRef.current;
      pendingSrcRef.current = null;
      requestAnimationFrame(() => applySrc(src));
    }
  }, [hasImage, applySrc]);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      if (!sourceCanvasRef.current) {
        pendingSrcRef.current = url;
        setHasImage(true);
      } else {
        applySrc(url);
      }
    },
    [applySrc]
  );

  const loadSample = useCallback(() => {
    const c = document.createElement("canvas");
    c.width = 800;
    c.height = 600;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const sky = ctx.createLinearGradient(0, 0, 0, 360);
    sky.addColorStop(0, "#2A6DF4");
    sky.addColorStop(1, "#7BB3FF");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 800, 360);
    ctx.fillStyle = "#FFD400";
    ctx.beginPath();
    ctx.arc(640, 110, 50, 0, Math.PI * 2);
    ctx.fill();
    const grass = ctx.createLinearGradient(0, 360, 0, 600);
    grass.addColorStop(0, "#3FAE3F");
    grass.addColorStop(1, "#1F7A1F");
    ctx.fillStyle = grass;
    ctx.fillRect(0, 360, 800, 240);
    ctx.fillStyle = "#1F5F3F";
    ctx.beginPath();
    ctx.moveTo(0, 360);
    ctx.lineTo(200, 270);
    ctx.lineTo(400, 360);
    ctx.lineTo(600, 250);
    ctx.lineTo(800, 360);
    ctx.lineTo(800, 390);
    ctx.lineTo(0, 390);
    ctx.closePath();
    ctx.fill();
    [[0.15, 0.85], [0.35, 0.92], [0.55, 0.82], [0.85, 0.9], [0.7, 0.95]].forEach(([x, y]) => {
      const cx = 800 * x, cy = 600 * y;
      ctx.fillStyle = "#E63946";
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#FFD400";
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    const data = ctx.getImageData(0, 0, 800, 600);
    for (let i = 0; i < data.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 12;
      data.data[i] += n;
      data.data[i + 1] += n;
      data.data[i + 2] += n;
    }
    ctx.putImageData(data, 0, 0);
    const url = c.toDataURL("image/png");
    if (!sourceCanvasRef.current) {
      pendingSrcRef.current = url;
      setHasImage(true);
    } else {
      applySrc(url);
    }
  }, [applySrc]);

  // 重新生成所有热力图(响应 colormap / params 变化)
  useEffect(() => {
    if (!hasImage || !sourceDataRef.current) return;
    setProcessing(true);
    const id = requestAnimationFrame(() => {
      const data = sourceDataRef.current;
      if (!data) return;
      (["original", "h", "s", "v"] as ChannelName[]).forEach((ch) => {
        const canvas = canvasRefs.current[ch];
        if (!canvas) return;
        canvas.width = data.width;
        canvas.height = data.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        const result = toHeatmap(data, ch, colormap, params);
        ctx.putImageData(result, 0, 0);
      });
      setProcessing(false);
    });
    return () => cancelAnimationFrame(id);
  }, [hasImage, colormap, params]);

  const handleMove = useCallback(
    (e: React.PointerEvent, channel: ChannelName) => {
      const canvas = canvasRefs.current[channel];
      const sourceData = sourceDataRef.current;
      if (!canvas || !sourceData) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((e.clientX - rect.left) * scaleX);
      const y = Math.floor((e.clientY - rect.top) * scaleY);
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
        setHoverInfo(null);
        return;
      }
      const idx = (y * canvas.width + x) * 4;
      const r = sourceData.data[idx];
      const g = sourceData.data[idx + 1];
      const b = sourceData.data[idx + 2];
      const hsv = rgbToHsv(r, g, b);
      setHoverInfo({
        x, y, r, g, b,
        h: hsv.h, s: hsv.s, v: hsv.v,
        hex: rgbToHex(r, g, b),
      });
    },
    []
  );

  const handleClear = () => {
    setHasImage(false);
    setImgSize(null);
    setHoverInfo(null);
    setHistograms(null);
    setParams(DEFAULT_PARAMS);
    sourceDataRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleResetParams = () => setParams(DEFAULT_PARAMS);

  const handleDownload = (channel: ChannelName) => {
    const canvas = canvasRefs.current[channel];
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `hsv-heatmap-${channel}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className={cn("space-y-5", className)}>
      <canvas ref={sourceCanvasRef} className="hidden" />

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
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-paper text-ink text-xs font-bold uppercase tracking-widest border-2 border-ink hover:bg-accent-red hover:text-paper hover:border-accent-red transition-colors"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              清除
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
        {hasImage && (
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">
              {imgSize?.w} × {imgSize?.h}px
              {processing && <span className="ml-2 text-accent-red animate-blink">渲染中</span>}
            </span>
          </div>
        )}
      </div>

      {!hasImage ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
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
              <div className="font-display text-2xl italic font-light mt-1">或拖拽图片到这里</div>
            </button>
            <button
              onClick={loadSample}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-accent-yellow text-ink text-xs font-bold uppercase tracking-widest border-2 border-ink shadow-brut-sm hover:shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
              加载示例图
            </button>
            <div className="mt-4 text-xs opacity-60 font-mono uppercase tracking-widest">
              JPG · PNG · WEBP · 本地处理,不上传服务器
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-5">
          {/* 左:4 视图 + 图例 + 像素信息 */}
          <div className="space-y-4">
            {/* 4 视图 */}
            <div ref={containerRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {CHANNELS.map((ch) => (
                <div
                  key={ch.key}
                  className={cn(
                    "relative border-2 border-ink shadow-brut-sm overflow-hidden bg-paper-dark transition-all",
                    activeChannel === ch.key && "shadow-brut ring-2 ring-accent-red -translate-y-0.5"
                  )}
                >
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[ch.key] = el;
                    }}
                    className="block w-full h-auto cursor-crosshair"
                    onPointerMove={(e) => {
                      setActiveChannel(ch.key);
                      handleMove(e, ch.key);
                    }}
                    onPointerLeave={() => setHoverInfo(null)}
                  />
                  <div className="absolute top-2 left-2 bg-ink text-paper px-2 py-1 font-mono text-[10px] uppercase tracking-widest font-bold">
                    <span className="font-display text-base font-black mr-1.5">{ch.symbol}</span>
                    {ch.label}
                  </div>
                  <div className="absolute bottom-2 left-2 bg-paper text-ink px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest font-bold">
                    {ch.desc}
                  </div>
                  <button
                    onClick={() => handleDownload(ch.key)}
                    className="absolute top-2 right-2 w-7 h-7 bg-paper border-2 border-ink hover:bg-ink hover:text-paper flex items-center justify-center transition-colors"
                    title={`下载 ${ch.label} 视图`}
                  >
                    <Download className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>

            {/* Colormap 图例 */}
            <ColormapLegend colormap={colormap} params={params} />

            {/* 悬停像素信息 */}
            <div className="p-4 bg-paper border-2 border-ink shadow-brut-sm">
              <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-3 flex items-center gap-2">
                <Pipette className="w-3 h-3" strokeWidth={2.5} />
                悬停像素信息 · 在任意热力图上移动鼠标
              </div>
              {hoverInfo ? (
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 border-2 border-ink shadow-brut-sm shrink-0"
                    style={{ background: `rgb(${hoverInfo.r}, ${hoverInfo.g}, ${hoverInfo.b})` }}
                  />
                  <div className="flex-1 min-w-0 font-mono text-xs space-y-1">
                    <div className="text-base font-bold">{hoverInfo.hex}</div>
                    <div className="opacity-70">RGB({hoverInfo.r}, {hoverInfo.g}, {hoverInfo.b})</div>
                    <div className="opacity-70">
                      H {Math.round(hoverInfo.h)}° · S {Math.round(hoverInfo.s * 100)}% · V {Math.round(hoverInfo.v * 100)}%
                    </div>
                    <div className="opacity-50 text-[10px]">@ ({hoverInfo.x}, {hoverInfo.y})</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm opacity-60 py-4 text-center">
                  <Pipette className="w-5 h-5 mx-auto mb-2" strokeWidth={1.5} />
                  移动鼠标到上方任一视图
                </div>
              )}
            </div>

            {/* 直方图 */}
            {histograms && (
              <div className="p-4 bg-paper border-2 border-ink shadow-brut-sm">
                <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-3">
                  通道分布直方图 · 32 bins
                </div>
                <div className="space-y-2.5">
                  <Histogram label="H" color="#FF3B1C" data={histograms.h} />
                  <Histogram label="S" color="#1FAE5B" data={histograms.s} />
                  <Histogram label="V" color="#3B5BFF" data={histograms.v} />
                </div>
              </div>
            )}
          </div>

          {/* 右:调节面板 */}
          <aside className="space-y-4">
            {/* Colormap 切换 */}
            <div className="p-4 bg-paper border-2 border-ink shadow-brut-sm">
              <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-3">
                Colormap · 伪彩色方案
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {COLORMAPS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setColormap(c.key)}
                    title={c.desc}
                    className={cn(
                      "px-2 py-2 text-[10px] uppercase tracking-widest font-bold border-2 border-ink transition-colors",
                      colormap === c.key ? "bg-ink text-paper" : "bg-paper hover:bg-ink/10"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] opacity-60 leading-relaxed">
                {COLORMAPS.find((c) => c.key === colormap)?.desc}
              </p>
            </div>

            {/* 调节参数 */}
            <div className="p-4 bg-paper border-2 border-ink shadow-brut-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 flex items-center gap-2">
                  <Sliders className="w-3 h-3" strokeWidth={2.5} />
                  调节参数 · 实时预览
                </div>
                <button
                  onClick={handleResetParams}
                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold opacity-70 hover:opacity-100 transition-opacity"
                >
                  <RotateCcw className="w-3 h-3" strokeWidth={2.5} />
                  重置
                </button>
              </div>

              <div className="space-y-4">
                {/* 阈值 Min */}
                <Slider
                  label="阈值下限"
                  symbol="Min"
                  value={params.thresholdMin}
                  min={0}
                  max={1}
                  step={0.01}
                  displayFormat={(v) => `${Math.round(v * 100)}%`}
                  onChange={(v) => updateParam("thresholdMin", Math.min(v, params.thresholdMax - 0.01))}
                />
                {/* 阈值 Max */}
                <Slider
                  label="阈值上限"
                  symbol="Max"
                  value={params.thresholdMax}
                  min={0}
                  max={1}
                  step={0.01}
                  displayFormat={(v) => `${Math.round(v * 100)}%`}
                  onChange={(v) => updateParam("thresholdMax", Math.max(v, params.thresholdMin + 0.01))}
                />
                {/* Gamma */}
                <Slider
                  label="Gamma 校正"
                  symbol="γ"
                  value={params.gamma}
                  min={0.1}
                  max={3}
                  step={0.05}
                  displayFormat={(v) => v.toFixed(2)}
                  onChange={(v) => updateParam("gamma", v)}
                />
                {/* 对比度 */}
                <Slider
                  label="对比度"
                  symbol="C"
                  value={params.contrast}
                  min={-1}
                  max={1}
                  step={0.02}
                  displayFormat={(v) => `${v >= 0 ? "+" : ""}${Math.round(v * 100)}%`}
                  onChange={(v) => updateParam("contrast", v)}
                />
                {/* 亮度 */}
                <Slider
                  label="亮度"
                  symbol="B"
                  value={params.brightness}
                  min={-1}
                  max={1}
                  step={0.02}
                  displayFormat={(v) => `${v >= 0 ? "+" : ""}${Math.round(v * 100)}%`}
                  onChange={(v) => updateParam("brightness", v)}
                />
                {/* 反转 */}
                <div className="pt-3 border-t-2 border-ink/15">
                  <button
                    onClick={() => updateParam("invert", !params.invert)}
                    className={cn(
                      "w-full px-3 py-2.5 text-xs font-bold uppercase tracking-widest border-2 border-ink transition-colors",
                      params.invert ? "bg-accent-red text-paper" : "bg-paper text-ink hover:bg-ink hover:text-paper"
                    )}
                  >
                    {params.invert ? "已反转" : "反转 Colormap"}
                  </button>
                </div>
              </div>

              <p className="mt-4 pt-3 border-t-2 border-ink/15 text-[10px] opacity-60 leading-relaxed">
                所有调节只影响热力图视图,原图不被修改。
                调节参数让你能突出感兴趣的颜色范围。
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

// Colormap 图例(显示当前 colormap 渐变 + 阈值标记)
function ColormapLegend({ colormap, params }: { colormap: ColormapName; params: HeatmapParams }) {
  const stops: { colors: string[]; min: string; max: string } = (() => {
    switch (colormap) {
      case "turbo":
        return {
          colors: ["#2A0A5C", "#2D53FF", "#00E5FF", "#00FF6B", "#FFE000", "#FF4B00", "#7A0000"],
          min: "低",
          max: "高",
        };
      case "viridis":
        return {
          colors: ["#440154", "#3B528B", "#21918C", "#5EC962", "#FDE725"],
          min: "0%",
          max: "100%",
        };
      case "jet":
        return {
          colors: ["#000083", "#0000FF", "#00FFFF", "#FFFF00", "#FF0000", "#830000"],
          min: "0",
          max: "1",
        };
      case "grayscale":
        return {
          colors: ["#000000", "#FFFFFF"],
          min: "0",
          max: "255",
        };
      case "hue":
        return {
          colors: ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF", "#FF0000"],
          min: "0°",
          max: "360°",
        };
    }
  })();

  return (
    <div className="p-3 bg-paper border-2 border-ink flex items-center gap-3">
      <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 shrink-0">
        Legend
      </div>
      <div className="relative flex-1">
        <div
          className="h-4 border-2 border-ink"
          style={{ background: `linear-gradient(90deg, ${stops.colors.join(", ")})` }}
        />
        {/* 阈值标记 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent-red pointer-events-none"
          style={{ left: `${params.thresholdMin * 100}%` }}
          title="阈值下限"
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent-red pointer-events-none"
          style={{ left: `${params.thresholdMax * 100}%` }}
          title="阈值上限"
        />
      </div>
      <div className="font-mono text-[10px] uppercase tracking-widest font-bold opacity-70 shrink-0">
        {stops.min} → {stops.max}
        {params.invert && <span className="ml-2 text-accent-red">↔</span>}
      </div>
    </div>
  );
}

// 通用滑块
function Slider({
  label,
  symbol,
  value,
  min,
  max,
  step,
  displayFormat,
  onChange,
}: {
  label: string;
  symbol: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayFormat: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-black">{symbol}</span>
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">{label}</span>
        </div>
        <span className="font-mono text-xs font-bold tabular-nums">{displayFormat(value)}</span>
      </div>
      <input
        type="range"
        className="hsv-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

// 直方图
function Histogram({ label, color, data }: { label: string; color: string; data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-center gap-3">
      <div className="font-display text-xl font-black w-5 text-center">{label}</div>
      <div className="flex-1 flex items-end gap-px h-12 border-b-2 border-ink/30">
        {data.map((v, i) => (
          <div
            key={i}
            className="flex-1 transition-all hover:opacity-100"
            style={{
              height: `${(v / max) * 100}%`,
              background: color,
              opacity: 0.4 + (v / max) * 0.6,
              minHeight: v > 0 ? "1px" : "0",
            }}
            title={`bin ${i}: ${v}`}
          />
        ))}
      </div>
    </div>
  );
}
