import { cn } from "@/lib/utils";
import { useCopy } from "@/hooks/useCopy";
import { Check, Copy } from "lucide-react";

interface ColorValueCardProps {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}

export default function ColorValueCard({ label, value, hint, className }: ColorValueCardProps) {
  const { copied, copy } = useCopy();

  return (
    <button
      onClick={() => copy(value)}
      className={cn(
        "group relative text-left p-4 bg-paper border-2 border-ink shadow-brut-sm transition-all",
        "hover:shadow-brut hover:-translate-x-0.5 hover:-translate-y-0.5",
        copied && "copy-flash",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
        {copied ? (
          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
        ) : (
          <Copy className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" strokeWidth={2} />
        )}
      </div>
      <div className="font-mono text-sm font-medium break-all leading-tight">{value}</div>
      {hint && <div className="mt-1.5 text-[10px] uppercase tracking-wider opacity-60">{hint}</div>}
    </button>
  );
}
