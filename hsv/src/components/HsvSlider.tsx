import { cn } from "@/lib/utils";

interface HsvSliderProps {
  label: string;
  symbol: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  trackStyle: React.CSSProperties;
  onChange: (v: number) => void;
  onCommit?: () => void;
}

export default function HsvSlider({
  label,
  symbol,
  value,
  min,
  max,
  step,
  unit,
  trackStyle,
  onChange,
  onCommit,
}: HsvSliderProps) {
  const displayValue = unit === "%" ? Math.round(value * 100) : Math.round(value);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-black">{symbol}</span>
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-70">{label}</span>
        </div>
        <span className="font-mono text-sm font-medium tabular-nums">
          {displayValue}
          <span className="opacity-50 ml-0.5">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        className={cn("hsv-slider")}
        min={min}
        max={max}
        step={step}
        value={value}
        style={trackStyle}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerUp={() => onCommit?.()}
        onKeyUp={() => onCommit?.()}
      />
    </div>
  );
}
