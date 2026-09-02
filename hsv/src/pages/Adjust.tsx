import { Link } from "react-router-dom";
import HeatmapAnalyzer from "@/components/HeatmapAnalyzer";
import { ArrowRight, Flame, Upload, MousePointer2, BarChart3, Sliders } from "lucide-react";

export default function Adjust() {
  return (
    <div className="container py-10 lg:py-14">
      <header className="mb-8 animate-fade-up">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60">CHAPTER 02 · HSV HEATMAP</div>
            <h1 className="mt-3 font-display text-5xl lg:text-7xl font-black tracking-tightest leading-[0.9]">
              HSV <span className="italic font-light">热力图</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-widest font-bold opacity-70">
            <span className="inline-flex items-center gap-1.5">
              <Flame className="w-4 h-4" strokeWidth={2.5} />
              通道可视化
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MousePointer2 className="w-4 h-4" strokeWidth={2.5} />
              像素级分析
            </span>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-base leading-relaxed">
          上传图片后,把图像映射到 HSV 色彩空间,用伪彩色 colormap 可视化每个通道的强度分布。
          右侧面板可实时调节 <span className="font-bold">阈值、Gamma、对比度、亮度、反转</span> 等参数,
          让你能突出感兴趣的颜色范围。原图永不被修改。
        </p>
      </header>

      {/* 工作流提示 */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fade-up delay-1">
        <Step
          num="01"
          title="上传图片"
          desc="点击或拖拽上传,完全在浏览器本地处理"
          icon={<Upload className="w-4 h-4" strokeWidth={2.5} />}
        />
        <Step
          num="02"
          title="查看 4 个视图"
          desc="原图 + H/S/V 三个通道各自的热力图"
          icon={<Flame className="w-4 h-4" strokeWidth={2.5} />}
        />
        <Step
          num="03"
          title="调节参数"
          desc="阈值、Gamma、对比度、亮度、反转实时调节"
          icon={<Sliders className="w-4 h-4" strokeWidth={2.5} />}
        />
        <Step
          num="04"
          title="悬停分析"
          desc="鼠标悬停读取像素 HSV 值,直方图显示分布"
          icon={<BarChart3 className="w-4 h-4" strokeWidth={2.5} />}
        />
      </div>

      <div className="animate-fade-up delay-2">
        <HeatmapAnalyzer />
      </div>

      {/* 底部说明 */}
      <div className="mt-10 grid lg:grid-cols-2 gap-4 animate-fade-up delay-3">
        <div className="p-5 border-2 border-ink bg-paper-dark">
          <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-2">原理</div>
          <h3 className="font-display text-2xl font-black tracking-tightest mb-2">HSV 通道强度映射</h3>
          <p className="text-sm leading-relaxed opacity-80">
            对每个像素计算其 HSV 值,然后将 H(0-360°)、S(0-100%)、V(0-100%) 归一化到 0-1,
            通过 colormap(如 Turbo / Viridis)映射到伪彩色。这样能直观看出图像在哪个色相、
            哪个饱和度、哪个明度区间分布更密集,常用于图像分析、特征提取、缺陷检测等场景。
          </p>
        </div>
        <div className="p-5 border-2 border-ink bg-ink text-paper">
          <div className="text-[10px] uppercase tracking-widest font-mono font-bold opacity-60 mb-2">下一步</div>
          <h3 className="font-display text-2xl font-black tracking-tightest mb-2">继续探索</h3>
          <p className="text-sm opacity-80 mb-4">把热力图中发现的色彩信息带到其他工具继续使用</p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/picker"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper text-ink text-[10px] uppercase tracking-widest font-bold hover:bg-accent-yellow transition-colors"
            >
              图片拾色 <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
            </Link>
            <Link
              to="/converter"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-paper text-[10px] uppercase tracking-widest font-bold hover:bg-paper hover:text-ink transition-colors"
            >
              HSV↔RGB <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ num, title, desc, icon }: { num: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 bg-paper border-2 border-ink shadow-brut-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest font-bold opacity-60">STEP {num}</span>
        <span className="w-7 h-7 bg-ink text-paper flex items-center justify-center">{icon}</span>
      </div>
      <div className="font-display text-xl font-black tracking-tightest">{title}</div>
      <p className="text-xs opacity-70 mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}
