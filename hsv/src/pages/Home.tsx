import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sliders, Circle, Repeat, Palette, ArrowRight, Pipette, Flame } from "lucide-react";
import { hsvToHex } from "@/utils/color";
import { useColorStore } from "@/store/colorStore";

const FEATURES = [
  { to: "/adjust", label: "HSV 热力图", desc: "上传图片,把图像映射到 HSV 空间,4 视图可视化分析", icon: Flame, accent: "#FF3B1C" },
  { to: "/picker", label: "图片拾色", desc: "上传任意图片,鼠标悬停实时读取像素 HSV,点击锁定取色", icon: Pipette, accent: "#FFD400" },
  { to: "/playground", label: "交互调色台", desc: "H/S/V 三轴滑块即时调控,实时复制色值", icon: Sliders, accent: "#1FAE5B" },
  { to: "/color-wheel", label: "色轮可视化", desc: "环形色相轮与饱和度方块拾色", icon: Circle, accent: "#3B5BFF" },
  { to: "/converter", label: "HSV ↔ RGB 转换", desc: "双向联动演示色彩空间映射", icon: Repeat, accent: "#7A2DFF" },
  { to: "/palette", label: "配色方案生成", desc: "互补、三角、类比等 5 种配色", icon: Palette, accent: "#FF3B1C" },
];

const DIMENSIONS = [
  {
    symbol: "H",
    name: "Hue",
    cn: "色相",
    desc: "色彩在色相环上的角度位置,0° 红色起点,绕环一周共 360°。",
    range: "0° — 360°",
    bg: () => "linear-gradient(90deg, #ff004d, #ff8a00, #ffd400, #88d500, #00d4d4, #5e8eff, #b94dff, #ff004d)",
    num: "01",
  },
  {
    symbol: "S",
    name: "Saturation",
    cn: "饱和度",
    desc: "颜色偏离灰色的程度。0% 为纯灰,100% 为最纯的色彩。",
    range: "0% — 100%",
    bg: (h: number) => `linear-gradient(90deg, hsl(${h},0%,55%), hsl(${h},100%,55%))`,
    num: "02",
  },
  {
    symbol: "V",
    name: "Value",
    cn: "明度",
    desc: "颜色的明亮程度。0% 为纯黑,100% 为最亮。",
    range: "0% — 100%",
    bg: (h: number) => `linear-gradient(90deg, #000000, hsl(${h},90%,55%))`,
    num: "03",
  },
];

const TICKER_ITEMS = [
  "HSV COLOR LAB", "★", "PIXEL PICKER", "★", "COLOR WHEEL", "★",
  "RGB CONVERTER", "★", "PALETTE GENERATOR", "★", "IMAGE SAMPLING", "★",
  "HSV COLOR LAB", "★", "PIXEL PICKER", "★", "COLOR WHEEL", "★",
  "RGB CONVERTER", "★", "PALETTE GENERATOR", "★", "IMAGE SAMPLING", "★",
];

export default function Home() {
  const hsv = useColorStore((s) => s.hsv);
  const [hue, setHue] = useState(hsv.h);

  useEffect(() => {
    const id = setInterval(() => setHue((p) => (p + 1) % 360), 60);
    return () => clearInterval(id);
  }, []);

  const heroColor = `hsl(${hue}, 85%, 55%)`;
  const heroColor2 = `hsl(${(hue + 60) % 360}, 85%, 55%)`;

  return (
    <div className="relative">
      {/* ===== TICKER ===== */}
      <div className="border-b-2 border-ink bg-ink text-paper py-2 overflow-hidden">
        <div className="flex whitespace-nowrap animate-ticker font-mono text-[11px] uppercase tracking-widest font-bold">
          {TICKER_ITEMS.map((t, i) => (
            <span key={i} className="px-3">{t}</span>
          ))}
        </div>
      </div>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden grid-bg">
        <div className="container relative py-16 lg:py-24">
          {/* 装饰大圆 */}
          <div
            className="absolute -top-32 -right-32 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full opacity-30 blur-3xl animate-drift"
            style={{ background: `conic-gradient(from 0deg, ${heroColor}, ${heroColor2}, ${heroColor})` }}
          />

          <div className="relative grid lg:grid-cols-[1.3fr_1fr] gap-10 items-end">
            <div>
              <div className="animate-fade-up inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-ink text-paper text-[10px] uppercase tracking-widest font-mono font-bold">
                <span className="w-1.5 h-1.5 bg-accent-red animate-blink" />
                ISSUE 001 · HSV.LAB
              </div>

              <h1 className="animate-fade-up delay-1 font-display text-[clamp(3.5rem,11vw,9rem)] font-black tracking-tightest leading-[0.85]">
                <span className="block">从像素</span>
                <span className="block italic font-light">到 <span style={{ color: heroColor }}>色相</span></span>
                <span className="block">理解 HSV</span>
              </h1>

              <p className="animate-fade-up delay-2 mt-7 max-w-xl text-base lg:text-lg leading-relaxed">
                一个能上传图片、生成 HSV 热力图、像素级色彩分析的色彩实验室。
                也提供滑块调色、色轮可视化、HSV↔RGB 转换与配色方案生成 —— 全部在浏览器端运行。
              </p>

              <div className="animate-fade-up delay-3 mt-9 flex flex-wrap gap-3">
                <Link
                  to="/adjust"
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-ink text-paper font-bold text-sm uppercase tracking-wider border-2 border-ink shadow-brut hover:shadow-brut-accent hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                >
                  <Flame className="w-4 h-4" strokeWidth={2.5} />
                  生成 HSV 热力图
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                </Link>
                <Link
                  to="/picker"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-paper text-ink font-bold text-sm uppercase tracking-wider border-2 border-ink shadow-brut-sm hover:shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
                >
                  <Pipette className="w-4 h-4" strokeWidth={2.5} />
                  图片拾色
                </Link>
              </div>
            </div>

            {/* 右侧:实时色相立方 */}
            <div className="animate-fade-up delay-4 grid grid-cols-6 gap-1 border-2 border-ink shadow-brut bg-ink">
              {Array.from({ length: 36 }).map((_, i) => {
                const deg = (i * 10 + hue) % 360;
                return (
                  <Link
                    key={i}
                    to="/playground"
                    className="aspect-square hover:scale-125 hover:z-10 transition-transform"
                    style={{ background: hsvToHex(deg, 0.85, 0.9) }}
                    title={`Hue ${Math.round(deg)}°`}
                  />
                );
              })}
            </div>
          </div>

          {/* 底部指标条 */}
          <div className="animate-fade-up delay-5 mt-12 grid grid-cols-2 sm:grid-cols-4 gap-px bg-ink border-2 border-ink">
            {[
              { k: "Pages", v: "5" },
              { k: "Hue", v: `${Math.round(hue)}°` },
              { k: "Backend", v: "0" },
              { k: "Free", v: "Yes" },
            ].map((m) => (
              <div key={m.k} className="bg-paper p-3">
                <div className="text-[9px] uppercase tracking-widest opacity-60 font-mono">{m.k}</div>
                <div className="font-display text-2xl font-black mt-1">{m.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HSV 模型介绍 ===== */}
      <section className="border-t-2 border-ink py-16 lg:py-24">
        <div className="container">
          <div className="mb-12 grid lg:grid-cols-[1fr_1.2fr] gap-8 items-end">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60">CHAPTER 02 · WHAT IS HSV</div>
              <h2 className="mt-3 font-display text-5xl lg:text-7xl font-black tracking-tightest leading-[0.9]">
                三个维度,<br /><span className="italic font-light">一种语言</span>
              </h2>
            </div>
            <p className="text-base leading-relaxed">
              HSV 将颜色拆解为「色相 / 饱和度 / 明度」三个正交维度,
              比 RGB 更贴近人类对色彩的直觉感知。
              它常用于图像处理、色彩拾取与 UI 设计领域。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {DIMENSIONS.map((dim, idx) => {
              const isV = dim.symbol === "V";
              const isS = dim.symbol === "S";
              const dynamicH = isV || isS ? hue : 0;
              return (
                <article
                  key={dim.symbol}
                  className="animate-fade-up group relative bg-paper border-2 border-ink shadow-brut hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brut-accent transition-all overflow-hidden"
                  style={{ animationDelay: `${0.08 * idx}s` }}
                >
                  {/* 顶部色带 */}
                  <div className="h-3 border-b-2 border-ink" style={{ background: dim.bg(dynamicH) }} />
                  <div className="p-6">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="font-display text-[5rem] font-black leading-none">{dim.symbol}</span>
                      <span className="font-mono text-xs font-bold opacity-60">№ {dim.num}</span>
                    </div>
                    <div className="text-xs uppercase tracking-widest font-bold opacity-70">{dim.name}</div>
                    <div className="font-display text-2xl italic mt-1 mb-3">{dim.cn}</div>
                    <p className="text-sm leading-relaxed opacity-80 mb-4">{dim.desc}</p>
                    <div className="font-mono text-[10px] uppercase tracking-widest font-bold opacity-60 border-t border-ink/20 pt-3">
                      {dim.range}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== 功能入口 ===== */}
      <section className="border-t-2 border-ink py-16 lg:py-24 bg-paper-dark">
        <div className="container">
          <div className="mb-10 flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60">CHAPTER 03 · EXPLORE</div>
              <h2 className="mt-3 font-display text-5xl lg:text-7xl font-black tracking-tightest leading-[0.9]">
                五个入口,<span className="italic font-light">一种心境</span>
              </h2>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest opacity-60">
              05 / FEATURES
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ to, label, desc, icon: Icon, accent }, idx) => (
              <Link
                key={to}
                to={to}
                className="animate-fade-up group relative bg-paper border-2 border-ink p-7 shadow-brut hover:-translate-x-1 hover:-translate-y-1 transition-transform overflow-hidden"
                style={{ animationDelay: `${0.06 * idx}s` }}
              >
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"
                  style={{ background: accent }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="w-12 h-12 flex items-center justify-center border-2 border-ink"
                      style={{ background: accent }}
                    >
                      <Icon className="w-5 h-5 text-ink" strokeWidth={2.5} />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest opacity-60 font-bold">
                      № {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-display text-3xl font-black tracking-tightest leading-none">{label}</h3>
                  <p className="mt-2 text-sm opacity-80 leading-relaxed">{desc}</p>
                  <div className="mt-5 inline-flex items-center gap-1 text-xs uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    进入 <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </div>
                </div>
              </Link>
            ))}

            {/* 第六格:CTA */}
            <Link
              to="/adjust"
              className="animate-fade-up group relative bg-ink text-paper border-2 border-ink p-7 shadow-brut hover:-translate-x-1 hover:-translate-y-1 transition-transform overflow-hidden"
              style={{ animationDelay: `${0.06 * FEATURES.length}s` }}
            >
              <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                <div
                  className="absolute inset-0 animate-hue-cycle"
                  style={{
                    background: "conic-gradient(from 0deg, #ff004d, #ff8a00, #ffd400, #88d500, #00d4d4, #5e8eff, #b94dff, #ff004d)",
                  }}
                />
              </div>
              <div className="relative">
                <div className="font-display text-4xl font-black italic mb-3">→</div>
                <h3 className="font-display text-3xl font-black tracking-tightest leading-none">立即开始</h3>
                <p className="mt-2 text-sm opacity-80">上传图片 · HSV 热力图分析</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
