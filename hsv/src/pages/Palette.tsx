import { useState } from "react";
import { useColorStore } from "@/store/colorStore";
import {
  hsvToRgb,
  rgbToHex,
  generatePalette,
  PALETTE_SCHEMES,
  type PaletteScheme,
  pickForeground,
} from "@/utils/color";
import ColorValueCard from "@/components/ColorValueCard";
import { Check } from "lucide-react";

export default function Palette() {
  const { hsv, setH, setS, setV, pushHistory } = useColorStore();
  const [scheme, setScheme] = useState<PaletteScheme>("complementary");
  const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const baseHex = rgbToHex(r, g, b);

  const palette = generatePalette(hsv, scheme);
  const schemeMeta = PALETTE_SCHEMES.find((s) => s.key === scheme)!;

  return (
    <div className="container py-10 lg:py-14">
      <header className="mb-8 animate-fade-up">
        <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60">CHAPTER 05 · PALETTE</div>
        <h1 className="mt-3 font-display text-5xl lg:text-7xl font-black tracking-tightest leading-[0.9]">
          配色<span className="italic font-light">方案生成</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base">基于当前 HSV 色彩,在色相环上按几何关系生成 5 种经典配色方案。点击下方方案卡片切换。</p>
      </header>

      {/* 配色方案切换 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8 animate-fade-up delay-1">
        {PALETTE_SCHEMES.map((s) => {
          const isActive = scheme === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setScheme(s.key)}
              className={`relative p-4 border-2 border-ink text-left transition-all ${
                isActive ? "bg-ink text-paper shadow-brut-accent -translate-x-0.5 -translate-y-0.5" : "bg-paper hover:bg-paper-dark shadow-brut-sm hover:shadow-brut"
              }`}
            >
              <div className="font-display text-xl font-black">{s.label}</div>
              <div className={`text-[10px] uppercase tracking-widest mt-1 ${isActive ? "opacity-70" : "opacity-50"}`}>{s.description}</div>
              {isActive && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-accent-red flex items-center justify-center">
                  <Check className="w-3 h-3 text-paper" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        {/* 左:主色调整 + 大色块 */}
        <div className="space-y-5 animate-fade-up delay-2">
          <div
            className="p-6 lg:p-8 border-2 border-ink shadow-brut transition-colors"
            style={{ background: `rgb(${r}, ${g}, ${b})` }}
          >
            <div className="text-[10px] uppercase tracking-widest font-bold text-ink/70">Base Color · 基础色</div>
            <div className="mt-2 font-mono text-3xl lg:text-5xl font-black text-ink">{baseHex}</div>
            <div className="mt-2 font-mono text-xs text-ink/80">
              H {Math.round(hsv.h)}° · S {Math.round(hsv.s * 100)}% · V {Math.round(hsv.v * 100)}%
            </div>
          </div>

          <div className="p-6 bg-paper border-2 border-ink shadow-brut-sm space-y-4">
            <h3 className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60">Adjust Base · 调整基础色</h3>
            <div className="space-y-4">
              <label className="block">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                  <span>H 色相</span>
                  <span className="font-mono">{Math.round(hsv.h)}°</span>
                </div>
                <input type="range" className="hsv-slider" min={0} max={360} step={1} value={hsv.h}
                  style={{ background: "linear-gradient(90deg, #ff004d, #ff8a00, #ffd400, #88d500, #00d4d4, #5e8eff, #b94dff, #ff004d)" }}
                  onChange={(e) => setH(parseFloat(e.target.value))}
                  onPointerUp={() => pushHistory(hsv)} />
              </label>
              <label className="block">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                  <span>S 饱和度</span>
                  <span className="font-mono">{Math.round(hsv.s * 100)}%</span>
                </div>
                <input type="range" className="hsv-slider" min={0} max={1} step={0.01} value={hsv.s}
                  style={{ background: `linear-gradient(90deg, hsl(${hsv.h}, 0%, 50%), hsl(${hsv.h}, 100%, 50%))` }}
                  onChange={(e) => setS(parseFloat(e.target.value))}
                  onPointerUp={() => pushHistory(hsv)} />
              </label>
              <label className="block">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                  <span>V 明度</span>
                  <span className="font-mono">{Math.round(hsv.v * 100)}%</span>
                </div>
                <input type="range" className="hsv-slider" min={0} max={1} step={0.01} value={hsv.v}
                  style={{ background: `linear-gradient(90deg, #000, hsl(${hsv.h}, ${Math.round(hsv.s * 100)}%, 50%))` }}
                  onChange={(e) => setV(parseFloat(e.target.value))}
                  onPointerUp={() => pushHistory(hsv)} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ColorValueCard label="Base HEX" value={baseHex} />
            <ColorValueCard label="Scheme" value={schemeMeta.label} hint={schemeMeta.description} />
          </div>
        </div>

        {/* 右:配色色板 */}
        <div className="space-y-5 animate-fade-up delay-3">
          <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60">
            Generated Palette · {palette.length} 色
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {palette.map((c, idx) => {
              const { r: cr, g: cg, b: cb } = hsvToRgb(c.h, c.s, c.v);
              const hex = rgbToHex(cr, cg, cb);
              const fg = pickForeground(c.h, c.s, c.v);
              const isBase = idx === 0;
              return (
                <div
                  key={`${idx}-${hex}`}
                  className="relative border-2 border-ink shadow-brut-sm aspect-square flex flex-col justify-end p-4"
                  style={{ background: `rgb(${cr}, ${cg}, ${cb})` }}
                >
                  {isBase && (
                    <span className="absolute top-2 right-2 text-[9px] uppercase tracking-widest font-mono font-bold px-1.5 py-0.5 bg-ink text-paper">
                      Base
                    </span>
                  )}
                  <div className="font-mono text-sm font-bold" style={{ color: fg }}>{hex}</div>
                  <div className="font-mono text-[10px] mt-0.5" style={{ color: fg, opacity: 0.8 }}>
                    H {Math.round(c.h)}° S {Math.round(c.s * 100)}%
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-5 border-2 border-ink bg-paper shadow-brut-sm">
            <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-4">UI Preview · 应用预览</div>
            <PreviewUI palette={palette} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewUI({ palette }: { palette: { h: number; s: number; v: number }[] }) {
  const primary = palette[0];
  const accent = palette[1] ?? primary;
  const bg = palette[2] ?? primary;
  const card = palette[3] ?? primary;
  const text = palette[4] ?? palette[0];

  const primaryRgb = hsvToRgb(primary.h, primary.s, primary.v);
  const accentRgb = hsvToRgb(accent.h, accent.s, accent.v);
  const bgRgb = hsvToRgb(bg.h, Math.min(0.3, bg.s), Math.max(0.1, Math.min(0.2, bg.v * 0.2)));
  const cardRgb = hsvToRgb(card.h, Math.min(0.15, card.s), Math.max(0.15, Math.min(0.3, card.v * 0.3)));
  const textRgb = hsvToRgb(text.h, Math.min(0.1, text.s), Math.max(0.85, text.v));

  return (
    <div className="p-5 border-2 border-ink" style={{ background: `rgb(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b})` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="font-display text-xl font-black" style={{ color: `rgb(${textRgb.r}, ${textRgb.g}, ${textRgb.b})` }}>
          Acme Studio
        </div>
        <div
          className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold border-2 border-ink"
          style={{
            background: `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`,
            color: pickForeground(primary.h, primary.s, primary.v),
          }}
        >
          Subscribe
        </div>
      </div>
      <div className="p-4 border-2 border-ink" style={{ background: `rgb(${cardRgb.r}, ${cardRgb.g}, ${cardRgb.b})` }}>
        <div className="text-xs font-bold mb-2" style={{ color: `rgb(${textRgb.r}, ${textRgb.g}, ${textRgb.b})` }}>
          Monthly Report
        </div>
        <div className="h-2 border border-ink mb-3" style={{ background: `rgb(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b})` }} />
        <div className="flex gap-2">
          <div className="h-1.5 flex-1 border border-ink/30" style={{ background: `rgba(${textRgb.r}, ${textRgb.g}, ${textRgb.b}, 0.3)` }} />
          <div className="h-1.5 w-1/3 border border-ink/30" style={{ background: `rgba(${textRgb.r}, ${textRgb.g}, ${textRgb.b}, 0.5)` }} />
        </div>
      </div>
    </div>
  );
}
