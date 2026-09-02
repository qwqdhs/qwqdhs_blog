import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import ImagePicker from "@/components/ImagePicker";
import ColorValueCard from "@/components/ColorValueCard";
import { useColorStore } from "@/store/colorStore";
import { rgbToHsv, rgbToHex, hsvToHsl, formatHsl } from "@/utils/color";
import { ArrowRight, MousePointerClick } from "lucide-react";

interface PickedPixel {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
}

export default function Picker() {
  const { hsv, setHsv, pushHistory } = useColorStore();
  const [picks, setPicks] = useState<PickedPixel[]>([]);
  const [lastPick, setLastPick] = useState<PickedPixel | null>(null);

  const handlePick = useCallback(
    (p: PickedPixel) => {
      const next = rgbToHsv(p.r, p.g, p.b);
      setHsv(next);
      pushHistory(next);
      setLastPick(p);
      setPicks((prev) => [p, ...prev].slice(0, 24));
    },
    [setHsv, pushHistory]
  );

  // 当前 HSV 显示数据(基于 store)
  const { r, g, b } = (() => {
    // 将 hsv 转 rgb 用于色卡显示
    const c = hsv.h / 60;
    const sv = hsv.s * hsv.v;
    const x = sv * (1 - Math.abs((c % 2) - 1));
    const m = hsv.v - sv;
    let rr = 0, gg = 0, bb = 0;
    if (c >= 0 && c < 1) { rr = sv; gg = x; }
    else if (c < 2) { rr = x; gg = sv; }
    else if (c < 3) { gg = sv; bb = x; }
    else if (c < 4) { gg = x; bb = sv; }
    else if (c < 5) { rr = x; bb = sv; }
    else { rr = sv; bb = x; }
    return {
      r: Math.round((rr + m) * 255),
      g: Math.round((gg + m) * 255),
      b: Math.round((bb + m) * 255),
    };
  })();
  const hex = rgbToHex(r, g, b);
  const hsl = hsvToHsl(hsv.h, hsv.s, hsv.v);

  const lastHex = lastPick ? rgbToHex(lastPick.r, lastPick.g, lastPick.b) : null;
  const lastHsv = lastPick ? rgbToHsv(lastPick.r, lastPick.g, lastPick.b) : null;

  return (
    <div className="container py-10 lg:py-14">
      {/* 头部 */}
      <header className="mb-8 animate-fade-up">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60">CHAPTER 01 · PIXEL PICKER</div>
            <h1 className="mt-3 font-display text-5xl lg:text-7xl font-black tracking-tightest leading-[0.9]">
              图片<span className="italic font-light">拾色</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold opacity-70">
            <MousePointerClick className="w-4 h-4" strokeWidth={2.5} />
            悬停预览 · 点击锁定
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-base leading-relaxed">
          上传任意图片,鼠标在画布上移动时实时读取该像素的 RGB / HSV 值,
          点击即可锁定色彩并应用到全局调色台。
        </p>
      </header>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* 左:图片拾色器 */}
        <div className="animate-fade-up delay-1">
          <ImagePicker
            onPick={handlePick}
            pickedColors={picks}
            onClearPicks={() => setPicks([])}
          />
        </div>

        {/* 右:色值信息 */}
        <div className="space-y-5 animate-fade-up delay-2">
          {/* 当前全局色 */}
          <div>
            <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-3">
              当前全局 HSV · 应用于其他页面
            </div>
            <div
              className="border-2 border-ink shadow-brut p-6 transition-colors"
              style={{ background: `rgb(${r}, ${g}, ${b})` }}
            >
              <div className="font-mono text-3xl font-bold text-ink drop-shadow-sm">{hex}</div>
              <div className="mt-1 font-mono text-[11px] text-ink/80">
                H {Math.round(hsv.h)}° · S {Math.round(hsv.s * 100)}% · V {Math.round(hsv.v * 100)}%
              </div>
            </div>
          </div>

          {/* 色值卡 */}
          <div className="grid grid-cols-2 gap-3">
            <ColorValueCard label="HEX" value={hex} />
            <ColorValueCard label="RGB" value={`rgb(${r}, ${g}, ${b})`} />
            <ColorValueCard label="HSL" value={formatHsl(hsl)} />
            <ColorValueCard label="HSV" value={`hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%)`} />
          </div>

          {/* 上次锁定 */}
          {lastPick && lastHsv && (
            <div className="border-2 border-ink bg-accent-yellow/20 p-4 shadow-brut-sm">
              <div className="text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-red animate-blink" />
                最近一次锁定
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 border-2 border-ink shrink-0"
                  style={{ background: `rgb(${lastPick.r}, ${lastPick.g}, ${lastPick.b})` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-base font-bold">{lastHex}</div>
                  <div className="font-mono text-[10px] opacity-70 mt-0.5">
                    RGB({lastPick.r}, {lastPick.g}, {lastPick.b})
                  </div>
                  <div className="font-mono text-[10px] opacity-70">
                    HSV {Math.round(lastHsv.h)}° · {Math.round(lastHsv.s * 100)}% · {Math.round(lastHsv.v * 100)}%
                  </div>
                  <div className="font-mono text-[10px] opacity-50 mt-0.5">
                    @ ({lastPick.x}, {lastPick.y})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 跳转 */}
          <div className="p-4 border-2 border-ink bg-paper-dark">
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-2">继续探索</div>
            <p className="text-sm mb-3">将当前色彩带去生成配色方案或观察 HSV↔RGB 转换</p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/playground"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-ink text-paper text-[10px] uppercase tracking-widest font-bold hover:bg-accent-red transition-colors"
              >
                调色台 <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
              </Link>
              <Link
                to="/palette"
                className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-ink text-[10px] uppercase tracking-widest font-bold hover:bg-ink hover:text-paper transition-colors"
              >
                配色生成 <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
