import { useRef, useState, useCallback, useEffect } from "react";
import { Upload, Image as ImageIcon, X, Pipette, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePickerProps {
  onPick: (info: {
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
  }) => void;
  /** 已锁定色列表(用于历史展示) */
  pickedColors?: { x: number; y: number; r: number; g: number; b: number }[];
  onClearPicks?: () => void;
}

const ZOOM = 12; // 放大镜倍数(像素)
const ZOOM_SIZE = 11; // 11x11 像素采样

export default function ImagePicker({ onPick, pickedColors = [], onClearPicks }: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; r: number; g: number; b: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 加载图片到 canvas
  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // 限制最大尺寸,保证流畅
      const MAX = 1200;
      let w = img.width;
      let h = img.height;
      if (w > MAX || h > MAX) {
        const r = Math.min(MAX / w, MAX / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      setImage(img);
      setImgSize({ w, h });
      setHover(null);
    };
    img.src = url;
  }, []);

  // 拖拽上传
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadImage(file);
  };

  // 获取像素颜色
  const getPixel = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !imgSize) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((clientX - rect.left) * scaleX);
    const y = Math.floor((clientY - rect.top) * scaleY);
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const data = ctx.getImageData(x, y, 1, 1).data;
    return { x, y, r: data[0], g: data[1], b: data[2] };
  }, [imgSize]);

  const handleMove = (e: React.PointerEvent) => {
    const px = getPixel(e.clientX, e.clientY);
    if (px) setHover(px);
  };

  const handleLeave = () => setHover(null);

  const handleClick = () => {
    if (hover) onPick(hover);
  };

  // 清除
  const handleClear = () => {
    setImage(null);
    setImgSize(null);
    setHover(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    return () => {
      if (image?.src) URL.revokeObjectURL(image.src);
    };
  }, [image]);

  const hex = hover ? `#${hover.r.toString(16).padStart(2, "0")}${hover.g.toString(16).padStart(2, "0")}${hover.b.toString(16).padStart(2, "0")}`.toUpperCase() : null;

  return (
    <div className="space-y-5">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-paper text-xs font-bold uppercase tracking-widest border-2 border-ink shadow-brut-sm hover:shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5" strokeWidth={2.5} />
            {image ? "更换图片" : "上传图片"}
          </button>
          {image && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-paper text-ink text-xs font-bold uppercase tracking-widest border-2 border-ink hover:bg-ink hover:text-paper transition-colors"
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
              if (f) loadImage(f);
            }}
          />
        </div>
        {image && (
          <div className="font-mono text-[10px] uppercase tracking-widest opacity-60">
            {imgSize?.w} × {imgSize?.h} px
          </div>
        )}
      </div>

      {/* 画布区 */}
      {!image ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "cursor-pointer aspect-[16/9] border-2 border-dashed border-ink grid place-items-center transition-all",
            isDragging ? "bg-accent-yellow/30 scale-[1.01]" : "bg-paper-dark/50 hover:bg-paper-dark"
          )}
        >
          <div className="text-center px-6">
            <div className="inline-flex w-16 h-16 items-center justify-center bg-ink text-paper mb-4">
              <Upload className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div className="font-display text-3xl font-black tracking-tightest">点击或拖拽</div>
            <div className="font-display text-2xl italic font-light mt-1">上传一张图片</div>
            <div className="mt-4 text-xs opacity-60 font-mono uppercase tracking-widest">
              支持 JPG · PNG · WEBP · GIF · 本地不外传
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="relative border-2 border-ink shadow-brut overflow-hidden bg-paper-dark"
        >
          <canvas
            ref={canvasRef}
            className={cn(
              "block w-full h-auto",
              hover ? "cursor-crosshair" : "cursor-default"
            )}
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
            onPointerDown={handleClick}
          />

          {/* 放大镜 */}
          {hover && (
            <div
              className="absolute pointer-events-none border-2 border-ink bg-paper"
              style={{
                left: `calc(${(hover.x / (imgSize?.w || 1)) * 100}% + 20px)`,
                top: `calc(${(hover.y / (imgSize?.h || 1)) * 100}% - 100px)`,
                width: ZOOM * ZOOM_SIZE + 4,
                height: ZOOM * ZOOM_SIZE + 4,
                zIndex: 20,
              }}
            >
              <Magnifier canvasRef={canvasRef} px={hover.x} py={hover.y} />
              {/* 中心十字 */}
              <div
                className="absolute border border-accent-red"
                style={{
                  width: ZOOM,
                  height: ZOOM,
                  left: (ZOOM * ZOOM_SIZE + 4) / 2 - ZOOM / 2,
                  top: (ZOOM * ZOOM_SIZE + 4) / 2 - ZOOM / 2,
                }}
              />
            </div>
          )}

          {/* 实时坐标 HUD */}
          {hover && (
            <div className="absolute top-3 left-3 bg-ink text-paper px-3 py-2 font-mono text-[10px] uppercase tracking-widest">
              <div>X {hover.x} · Y {hover.y}</div>
              <div className="mt-0.5">RGB({hover.r}, {hover.g}, {hover.b})</div>
              <div className="mt-0.5 text-accent-yellow">{hex}</div>
            </div>
          )}

          {/* 提示 */}
          {hover && (
            <div className="absolute bottom-3 right-3 bg-paper border-2 border-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest font-bold">
              <Pipette className="w-3 h-3 inline mr-1" strokeWidth={2.5} />
              点击锁定取色
            </div>
          )}
        </div>
      )}

      {/* 已锁定色列表 */}
      {pickedColors.length > 0 && (
        <div className="border-2 border-ink bg-paper-dark p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-widest font-bold font-mono">
              已锁定像素 · {pickedColors.length}
            </div>
            {onClearPicks && (
              <button
                onClick={onClearPicks}
                className="text-[10px] uppercase tracking-widest font-bold opacity-60 hover:opacity-100 transition-opacity"
              >
                清空
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {pickedColors.map((c, i) => {
              const hex = `#${c.r.toString(16).padStart(2, "0")}${c.g.toString(16).padStart(2, "0")}${c.b.toString(16).padStart(2, "0")}`.toUpperCase();
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-paper border-2 border-ink px-2 py-1"
                  title={`位置 ${c.x}, ${c.y}`}
                >
                  <div
                    className="w-5 h-5 border border-ink"
                    style={{ background: `rgb(${c.r}, ${c.g}, ${c.b})` }}
                  />
                  <span className="font-mono text-[10px] font-bold">{hex}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 放大镜内部 - 从原 canvas 采样像素并放大绘制
function Magnifier({ canvasRef, px, py }: { canvasRef: React.RefObject<HTMLCanvasElement>; px: number; py: number }) {
  const miniRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const src = canvasRef.current;
    const dst = miniRef.current;
    if (!src || !dst) return;
    const ctx = dst.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const half = Math.floor(ZOOM_SIZE / 2);
    const sx = px - half;
    const sy = py - half;
    ctx.clearRect(0, 0, dst.width, dst.height);
    try {
      ctx.drawImage(src, sx, sy, ZOOM_SIZE, ZOOM_SIZE, 0, 0, ZOOM * ZOOM_SIZE, ZOOM * ZOOM_SIZE);
    } catch {
      /* 边界外 */
    }
  }, [canvasRef, px, py]);

  return (
    <canvas
      ref={miniRef}
      width={ZOOM * ZOOM_SIZE}
      height={ZOOM * ZOOM_SIZE}
      className="block"
      style={{ width: ZOOM * ZOOM_SIZE, height: ZOOM * ZOOM_SIZE }}
    />
  );
}
