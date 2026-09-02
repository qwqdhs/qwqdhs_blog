import { useRef, useState, useCallback, useEffect } from "react";

interface CompareSliderProps {
  beforeSrc: string; // dataURL 或 URL
  afterSrc: string;
  className?: string;
}

/**
 * 左右拖拽对比分割视图
 */
export default function CompareSlider({ beforeSrc, afterSrc, className }: CompareSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50); // 0-100
  const [dragging, setDragging] = useState(false);

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => updatePos(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, updatePos]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden border-2 border-ink shadow-brut select-none cursor-ew-resize ${className ?? ""}`}
      onPointerDown={(e) => {
        setDragging(true);
        updatePos(e.clientX);
      }}
    >
      {/* After (底层) */}
      <img
        src={afterSrc}
        alt="after"
        className="block w-full h-full object-contain bg-paper-dark"
        draggable={false}
      />
      {/* Before (上层,根据 pos 裁剪) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img
          src={beforeSrc}
          alt="before"
          className="block h-full object-contain bg-paper-dark"
          style={{ width: `${containerRef.current?.clientWidth ?? 0}px` }}
          draggable={false}
        />
        {/* 原图标记 */}
        <div className="absolute top-2 left-2 bg-ink text-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-bold">
          原图
        </div>
      </div>
      {/* After 标记 */}
      <div className="absolute top-2 right-2 bg-accent-red text-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest font-bold">
        调整后
      </div>
      {/* 分割把手 */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-accent-yellow pointer-events-none"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-accent-yellow border-2 border-ink shadow-brut-sm flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
            <path d="m9 6 6 6-6 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
