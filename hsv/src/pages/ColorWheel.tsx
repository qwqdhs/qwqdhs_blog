import { useRef, useCallback, useState } from "react";
import { useColorStore } from "@/store/colorStore";
import { hsvToRgb, rgbToHex } from "@/utils/color";
import ColorValueCard from "@/components/ColorValueCard";
import { MousePointerClick } from "lucide-react";

function pointToHue(x: number, y: number): number {
  let deg = (Math.atan2(y, x) * 180) / Math.PI + 90;
  if (deg < 0) deg += 360;
  return deg;
}

export default function ColorWheel() {
  const { hsv, setHsv, pushHistory } = useColorStore();
  const ringRef = useRef<HTMLDivElement>(null);
  const squareRef = useRef<HTMLDivElement>(null);
  const [isDraggingRing, setIsDraggingRing] = useState(false);
  const [isDraggingSquare, setIsDraggingSquare] = useState(false);

  const handleRingPointer = useCallback(
    (e: React.PointerEvent) => {
      const el = ringRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const x = e.clientX - cx;
      const y = e.clientY - cy;
      const dist = Math.sqrt(x * x + y * y);
      const inner = (rect.width / 2) * 0.62;
      const outer = rect.width / 2;
      if (dist >= inner - 8 && dist <= outer + 8) {
        const h = pointToHue(x, y);
        setHsv({ h, s: hsv.s, v: hsv.v });
      }
    },
    [hsv.s, hsv.v, setHsv]
  );

  const handleSquarePointer = useCallback(
    (e: React.PointerEvent) => {
      const el = squareRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
      setHsv({ h: hsv.h, s: x, v: y });
    },
    [hsv.h, setHsv]
  );

  const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const hex = rgbToHex(r, g, b);
  const indicatorAngle = hsv.h;

  return (
    <div className="container py-10 lg:py-14">
      <header className="mb-8 animate-fade-up">
        <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60">CHAPTER 03 · COLOR WHEEL</div>
        <h1 className="mt-3 font-display text-5xl lg:text-7xl font-black tracking-tightest leading-[0.9]">
          色轮<span className="italic font-light">可视化</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base flex items-center gap-2 flex-wrap">
          <MousePointerClick className="w-4 h-4" strokeWidth={2.5} />
          点击外圈色环选取色相,点击中心方块调整饱和度与明度
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-center">
        <div className="animate-fade-up delay-1 flex justify-center">
          <div
            ref={ringRef}
            className="relative w-[min(70vw,520px)] aspect-square cursor-pointer select-none touch-none"
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              setIsDraggingRing(true);
              handleRingPointer(e);
            }}
            onPointerMove={(e) => isDraggingRing && handleRingPointer(e)}
            onPointerUp={(e) => {
              (e.target as HTMLElement).releasePointerCapture(e.pointerId);
              if (isDraggingRing) pushHistory(hsv);
              setIsDraggingRing(false);
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "conic-gradient(from 0deg, #ff004d, #ff8a00, #ffd400, #88d500, #00d4d4, #5e8eff, #b94dff, #ff004d)",
                maskImage: "radial-gradient(circle, transparent 60%, black 61%)",
                WebkitMaskImage: "radial-gradient(circle, transparent 60%, black 61%)",
              }}
            />
            <div className="absolute inset-[38%] rounded-full bg-paper border-2 border-ink shadow-brut-sm" />

            {/* 中心 SV 方块 */}
            <div
              ref={squareRef}
              className="absolute inset-[42%] overflow-hidden cursor-crosshair touch-none border-2 border-ink shadow-brut-sm"
              style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))`,
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                setIsDraggingSquare(true);
                handleSquarePointer(e);
              }}
              onPointerMove={(e) => {
                if (isDraggingSquare) handleSquarePointer(e);
              }}
              onPointerUp={(e) => {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                if (isDraggingSquare) pushHistory(hsv);
                setIsDraggingSquare(false);
              }}
            >
              <div
                className="absolute w-4 h-4 border-2 border-ink bg-paper pointer-events-none"
                style={{
                  left: `calc(${hsv.s * 100}% - 8px)`,
                  top: `calc(${(1 - hsv.v) * 100}% - 8px)`,
                  boxShadow: "2px 2px 0 rgba(0,0,0,0.6)",
                }}
              />
            </div>

            {/* 色相指示器 */}
            <div
              className="absolute pointer-events-none"
              style={{ left: "50%", top: "50%", transform: `translate(-50%, -50%) rotate(${indicatorAngle}deg)` }}
            >
              <div style={{ width: 0, height: 0, transform: `translateY(calc(-50% - min(35vw, 260px)))` }}>
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 border-[3px] border-ink"
                  style={{ background: `hsl(${hsv.h}, 100%, 50%)`, boxShadow: "3px 3px 0 rgba(0,0,0,0.4)" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="animate-fade-up delay-2 space-y-5">
          <div
            className="p-6 border-2 border-ink shadow-brut transition-colors"
            style={{ background: `rgb(${r}, ${g}, ${b})` }}
          >
            <div className="font-mono text-4xl lg:text-5xl font-black text-ink">{hex}</div>
            <div className="mt-2 font-mono text-xs text-ink/80">
              H {Math.round(hsv.h)}° · S {Math.round(hsv.s * 100)}% · V {Math.round(hsv.v * 100)}%
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <ColorValueCard label="HEX" value={hex} />
            <ColorValueCard label="RGB" value={`rgb(${r}, ${g}, ${b})`} />
            <ColorValueCard label="Hue" value={`${Math.round(hsv.h)}°`} hint={`指向 ${hueName(hsv.h)}`} />
            <ColorValueCard
              label="Saturation"
              value={`${Math.round(hsv.s * 100)}%`}
              hint={hsv.s < 0.1 ? "近乎灰色" : hsv.s > 0.85 ? "高度鲜艳" : "中等饱和"}
            />
          </div>

          <div className="p-5 border-2 border-ink bg-paper-dark text-sm leading-relaxed">
            <span className="font-display italic font-bold">提示:</span>
            外环色相角度 0° 起始于顶部(红色),顺时针递增。中心方块横向代表饱和度(左→右 0→100%),纵向代表明度(下→上 0→100%)。
          </div>
        </div>
      </div>
    </div>
  );
}

function hueName(h: number): string {
  const map: { range: [number, number]; name: string }[] = [
    { range: [345, 360], name: "红" },
    { range: [0, 15], name: "红" },
    { range: [15, 45], name: "橙" },
    { range: [45, 70], name: "黄" },
    { range: [70, 150], name: "绿" },
    { range: [150, 195], name: "青" },
    { range: [195, 255], name: "蓝" },
    { range: [255, 290], name: "紫" },
    { range: [290, 345], name: "品红" },
  ];
  return map.find((m) => h >= m.range[0] && h < m.range[1])?.name ?? "红";
}
