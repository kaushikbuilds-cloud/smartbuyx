import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { BuyerRisk } from "@/features/ai/fraud";

const MAP = {
  low: { label: "Low risk", icon: ShieldCheck, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  medium: { label: "Watch", icon: Shield, cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  high: { label: "High risk", icon: ShieldAlert, cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
} as const;

export function RiskBadge({ risk }: { risk: BuyerRisk }) {
  // Don't clutter the UI for clean buyers with no signals.
  if (risk.level === "low" && risk.signals.length === 0) return null;
  const m = MAP[risk.level];
  return (
    <span
      title={risk.signals.join(" · ") || "No risk signals"}
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold", m.cls)}
    >
      <m.icon className="h-3 w-3" /> {m.label} · {risk.score}
    </span>
  );
}
