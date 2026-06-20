import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function TrustScoreBadge({ score, verified, size = "md" }: { score: number; verified?: boolean; size?: "sm" | "md" }) {
  const tier =
    score >= 80 ? { label: "Excellent", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" } :
    score >= 60 ? { label: "Trusted", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" } :
    score >= 40 ? { label: "Fair", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" } :
                  { label: "New", className: "bg-muted text-muted-foreground" };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium",
      tier.className,
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
    )}>
      <ShieldCheck className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      Trust {score}/100 · {tier.label}
      {verified ? <span className="ml-1 opacity-80">✓ GST</span> : null}
    </div>
  );
}
