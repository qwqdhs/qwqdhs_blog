import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sliders, Flame } from "lucide-react";

// 只保留两个核心页面:HSV 颜色分割 + 热力图验证
const NAV_ITEMS = [
  { to: "/playground", label: "HSV 分割", icon: Sliders },
  { to: "/adjust", label: "热力图", icon: Flame },
];

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-50 bg-paper border-b-2 border-ink">
      <nav className="container flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative w-7 h-7 bg-ink overflow-hidden">
            <div className="absolute inset-0 animate-hue-cycle"
              style={{
                background: "conic-gradient(from 0deg, #ff004d, #ff8a00, #ffd400, #88d500, #00d4d4, #5e8eff, #b94dff, #ff004d)",
              }}
            />
            <div className="absolute inset-[5px] bg-paper" />
          </div>
          <span className="font-display text-lg font-black tracking-tightest leading-none">
            HSV<span className="font-light italic">.LAB</span>
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-0">
          {NAV_ITEMS.map(({ to, label, icon: Icon }, idx) => {
            const active = pathname === to;
            return (
              <li key={to} className={cn(idx > 0 && "border-l border-ink/15")}>
                <Link
                  to={to}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium uppercase tracking-widest transition-colors",
                    active
                      ? "bg-ink text-paper"
                      : "text-ink hover:bg-ink/10"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* 移动端下拉 - 仅图标 */}
        <ul className="flex md:hidden items-center">
          {NAV_ITEMS.map(({ to, icon: Icon }, idx) => {
            const active = pathname === to;
            return (
              <li key={to} className={cn(idx > 0 && "border-l border-ink/15")}>
                <Link
                  to={to}
                  className={cn(
                    "p-2.5 transition-colors",
                    active ? "bg-ink text-paper" : "text-ink hover:bg-ink/10"
                  )}
                  aria-label={to}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
