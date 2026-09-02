import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./Navbar";

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t-2 border-ink py-5 bg-paper-dark">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] uppercase tracking-widest font-mono">
          <div>HSV.LAB · Editorial Color Studio · 2026</div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-accent-red" />
            <span className="w-2 h-2 bg-accent-yellow" />
            <span className="w-2 h-2 bg-accent-green" />
            <span className="w-2 h-2 bg-accent-blue" />
            <span className="w-2 h-2 bg-accent-violet" />
          </div>
          <div>本页色彩运算全部在浏览器端运行</div>
        </div>
      </footer>
    </div>
  );
}
