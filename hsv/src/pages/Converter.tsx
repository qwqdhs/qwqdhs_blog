import { useState, useCallback } from "react";
import { useColorStore } from "@/store/colorStore";
import { hsvToRgb, rgbToHsv, rgbToHex } from "@/utils/color";
import HsvSlider from "@/components/HsvSlider";
import { ArrowLeftRight } from "lucide-react";

type Source = "hsv" | "rgb";

export default function Converter() {
  const { hsv, setHsv, pushHistory } = useColorStore();
  const initialRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const [rgb, setRgb] = useState({ r: initialRgb.r, g: initialRgb.g, b: initialRgb.b });
  const [source, setSource] = useState<Source>("hsv");

  const syncRgbFromHsv = useCallback((h: number, s: number, v: number) => {
    setRgb(hsvToRgb(h, s, v));
  }, []);

  const syncHsvFromRgb = useCallback((r: number, g: number, b: number) => {
    setHsv(rgbToHsv(r, g, b));
  }, [setHsv]);

  const handleH = (h: number) => {
    setSource("hsv");
    setHsv({ ...hsv, h });
    syncRgbFromHsv(h, hsv.s, hsv.v);
  };
  const handleS = (s: number) => {
    setSource("hsv");
    setHsv({ ...hsv, s });
    syncRgbFromHsv(hsv.h, s, hsv.v);
  };
  const handleV = (v: number) => {
    setSource("hsv");
    setHsv({ ...hsv, v });
    syncRgbFromHsv(hsv.h, hsv.s, v);
  };

  const handleR = (r: number) => {
    setSource("rgb");
    setRgb((prev) => {
      const next = { ...prev, r };
      syncHsvFromRgb(next.r, next.g, next.b);
      return next;
    });
  };
  const handleG = (g: number) => {
    setSource("rgb");
    setRgb((prev) => {
      const next = { ...prev, g };
      syncHsvFromRgb(next.r, next.g, next.b);
      return next;
    });
  };
  const handleB = (b: number) => {
    setSource("rgb");
    setRgb((prev) => {
      const next = { ...prev, b };
      syncHsvFromRgb(next.r, next.g, next.b);
      return next;
    });
  };

  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const hRound = Math.round(hsv.h);
  const sRound = Math.round(hsv.s * 100);
  const vRound = Math.round(hsv.v * 100);
  const c = hsv.s * hsv.v;
  const m = hsv.v - c;
  const hp = (((hsv.h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let rgbStep = "";
  if (hp >= 0 && hp < 1) rgbStep = `(C, X, 0) → (${c.toFixed(2)}, ${x.toFixed(2)}, 0)`;
  else if (hp >= 1 && hp < 2) rgbStep = `(X, C, 0) → (${x.toFixed(2)}, ${c.toFixed(2)}, 0)`;
  else if (hp >= 2 && hp < 3) rgbStep = `(0, C, X) → (0, ${c.toFixed(2)}, ${x.toFixed(2)})`;
  else if (hp >= 3 && hp < 4) rgbStep = `(0, X, C) → (0, ${x.toFixed(2)}, ${c.toFixed(2)})`;
  else if (hp >= 4 && hp < 5) rgbStep = `(X, 0, C) → (${x.toFixed(2)}, 0, ${c.toFixed(2)})`;
  else rgbStep = `(C, 0, X) → (${c.toFixed(2)}, 0, ${x.toFixed(2)})`;

  return (
    <div className="container py-10 lg:py-14">
      <header className="mb-8 animate-fade-up">
        <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60">CHAPTER 04 · CONVERTER</div>
        <h1 className="mt-3 font-display text-5xl lg:text-7xl font-black tracking-tightest leading-[0.9]">
          HSV <ArrowLeftRight className="inline w-10 h-10 mx-1 align-middle" strokeWidth={2.5} /> RGB
        </h1>
        <p className="mt-4 max-w-2xl text-base">两侧任一滑块变动,另一侧将实时联动。下方展示当前 HSV → RGB 的公式代换过程。</p>
      </header>

      <div
        className="animate-fade-up delay-1 mb-6 p-6 lg:p-8 border-2 border-ink shadow-brut flex items-center justify-between transition-colors"
        style={{ background: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` }}
      >
        <div className="font-mono text-3xl lg:text-5xl font-black text-ink">{hex}</div>
        <div className="font-mono text-xs text-ink/80 text-right">
          <div>{source === "hsv" ? "→ 由 HSV 推导" : "← 由 RGB 输入"}</div>
          <div className="opacity-70 mt-1">联动方向</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section
          className={`animate-fade-up delay-2 p-6 lg:p-8 bg-paper border-2 border-ink transition-shadow ${
            source === "hsv" ? "shadow-brut-accent" : "shadow-brut-sm"
          }`}
        >
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-2xl font-black">
              HSV <span className="text-xs uppercase tracking-widest font-bold opacity-60 ml-1">输入</span>
            </h2>
            {source === "hsv" && (
              <span className="text-[10px] uppercase tracking-widest font-bold bg-accent-red text-paper px-2 py-0.5">Active</span>
            )}
          </div>

          <div className="space-y-5">
            <HsvSlider label="Hue" symbol="H" value={hsv.h} min={0} max={360} step={1} unit="°"
              trackStyle={{ background: "linear-gradient(90deg, #ff004d, #ff8a00, #ffd400, #88d500, #00d4d4, #5e8eff, #b94dff, #ff004d)" }}
              onChange={handleH} onCommit={() => pushHistory(hsv)} />
            <HsvSlider label="Saturation" symbol="S" value={hsv.s} min={0} max={1} step={0.01} unit="%"
              trackStyle={{ background: `linear-gradient(90deg, hsl(${hsv.h}, 0%, ${Math.round(hsv.v * 50)}%), hsl(${hsv.h}, 100%, ${Math.round(hsv.v * 50)}%))` }}
              onChange={handleS} onCommit={() => pushHistory(hsv)} />
            <HsvSlider label="Value" symbol="V" value={hsv.v} min={0} max={1} step={0.01} unit="%"
              trackStyle={{ background: `linear-gradient(90deg, #000, hsl(${hsv.h}, ${Math.round(hsv.s * 100)}%, 50%))` }}
              onChange={handleV} onCommit={() => pushHistory(hsv)} />
          </div>

          <div className="mt-5 font-mono text-xs space-y-1 border-t-2 border-ink/20 pt-3">
            <div>H = {hRound}°</div>
            <div>S = {sRound}% = {hsv.s.toFixed(3)}</div>
            <div>V = {vRound}% = {hsv.v.toFixed(3)}</div>
          </div>
        </section>

        <section
          className={`animate-fade-up delay-3 p-6 lg:p-8 bg-paper border-2 border-ink transition-shadow ${
            source === "rgb" ? "shadow-brut-accent" : "shadow-brut-sm"
          }`}
        >
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-2xl font-black">
              RGB <span className="text-xs uppercase tracking-widest font-bold opacity-60 ml-1">输入</span>
            </h2>
            {source === "rgb" && (
              <span className="text-[10px] uppercase tracking-widest font-bold bg-accent-red text-paper px-2 py-0.5">Active</span>
            )}
          </div>

          <div className="space-y-5">
            <HsvSlider label="Red" symbol="R" value={rgb.r} min={0} max={255} step={1} unit=""
              trackStyle={{ background: "linear-gradient(90deg, #000, #ff0000)" }}
              onChange={handleR} onCommit={() => pushHistory(hsv)} />
            <HsvSlider label="Green" symbol="G" value={rgb.g} min={0} max={255} step={1} unit=""
              trackStyle={{ background: "linear-gradient(90deg, #000, #00ff00)" }}
              onChange={handleG} onCommit={() => pushHistory(hsv)} />
            <HsvSlider label="Blue" symbol="B" value={rgb.b} min={0} max={255} step={1} unit=""
              trackStyle={{ background: "linear-gradient(90deg, #000, #0000ff)" }}
              onChange={handleB} onCommit={() => pushHistory(hsv)} />
          </div>

          <div className="mt-5 font-mono text-xs space-y-1 border-t-2 border-ink/20 pt-3">
            <div>R = {rgb.r}</div>
            <div>G = {rgb.g}</div>
            <div>B = {rgb.b}</div>
          </div>
        </section>
      </div>

      <section className="animate-fade-up delay-4 mt-6 p-6 lg:p-8 bg-ink text-paper border-2 border-ink shadow-brut">
        <h3 className="font-display text-xl font-black mb-5 flex items-center gap-2">
          <span className="w-2 h-2 bg-accent-red animate-blink" />
          公式 · HSV → RGB 代入过程
        </h3>
        <div className="font-mono text-sm space-y-2 leading-relaxed overflow-x-auto">
          <div><span className="opacity-50">C =</span> V × S = {hsv.v.toFixed(2)} × {hsv.s.toFixed(2)} = <span className="text-accent-yellow">{c.toFixed(3)}</span></div>
          <div><span className="opacity-50">H′ =</span> H / 60° = {hRound}° / 60° = <span className="text-accent-yellow">{hp.toFixed(3)}</span></div>
          <div><span className="opacity-50">X =</span> C × (1 − |H′ mod 2 − 1|) = <span className="text-accent-yellow">{x.toFixed(3)}</span></div>
          <div><span className="opacity-50">分段映射:</span> <span className="text-accent-yellow">{rgbStep}</span></div>
          <div><span className="opacity-50">m =</span> V − C = {hsv.v.toFixed(2)} − {c.toFixed(2)} = <span className="text-accent-yellow">{m.toFixed(3)}</span></div>
          <div className="pt-3 mt-3 border-t border-white/15 text-base">
            <span className="opacity-50">RGB =</span>{" "}
            <span className="text-accent-yellow">({rgb.r}, {rgb.g}, {rgb.b})</span>{" "}
            <span className="opacity-50">= #{hex.slice(1)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
