import { cn } from "@/lib/utils";
import { hsvToRgb, pickForeground } from "@/utils/color";
import { useColorStore } from "@/store/colorStore";

interface ColorPreviewProps {
  hsv?: { h: number; s: number; v: number };
  className?: string;
  showMeta?: boolean;
}

export default function ColorPreview({ hsv, className, showMeta = true }: ColorPreviewProps) {
  const storeHsv = useColorStore((s) => s.hsv);
  const current = hsv ?? storeHsv;
  const { r, g, b } = hsvToRgb(current.h, current.s, current.v);
  const fg = pickForeground(current.h, current.s, current.v);
  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();

  return (
    <div
      className={cn(
        "relative overflow-hidden border-2 border-ink shadow-brut transition-all duration-200",
        className
      )}
      style={{ background: `rgb(${r}, ${g}, ${b})` }}
    >
      {/* 光泽 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/15 pointer-events-none" />

      {showMeta && (
        <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-80" style={{ color: fg }}>
              Current
            </div>
            <div className="font-mono text-2xl font-bold" style={{ color: fg }}>{hex}</div>
          </div>
          <div className="text-right font-mono text-xs opacity-90" style={{ color: fg }}>
            <div>H {Math.round(current.h)}°</div>
            <div>S {Math.round(current.s * 100)}%</div>
            <div>V {Math.round(current.v * 100)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
