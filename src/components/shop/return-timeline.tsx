import { Check, Package, Truck, Wallet, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Standard happy-path return stages. Cancelled/rejected render as terminal.
const STAGES = [
  { key: "requested", label: "Requested", icon: Clock },
  { key: "approved", label: "Approved", icon: Check },
  { key: "pickup_scheduled", label: "Pickup scheduled", icon: Package },
  { key: "picked_up", label: "Picked up", icon: Truck },
  { key: "refunded", label: "Refunded", icon: Wallet },
] as const;

const ORDER: Record<string, number> = {
  requested: 0, approved: 1, pickup_scheduled: 2, picked_up: 3, refunded: 4,
};

export function ReturnTimeline({ status }: { status: string }) {
  if (status === "cancelled" || status === "rejected") {
    return (
      <div className="flex items-center gap-2 text-sm text-rose-600">
        <XCircle className="h-4 w-4" />
        {status === "cancelled" ? "Return cancelled" : "Return rejected"}
      </div>
    );
  }

  const current = ORDER[status] ?? 0;
  // Returnless refunds jump straight to refunded, skipping pickup stages.
  const returnless = status === "refunded" && current === 4;

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {STAGES.map((s, i) => {
        const done = i <= current;
        const skipped = returnless && (i === 2 || i === 3);
        return (
          <div key={s.key} className="flex items-center gap-1">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px]",
                skipped
                  ? "bg-muted text-muted-foreground line-through"
                  : done
                    ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <s.icon className="h-3 w-3" />
            </span>
            <span className={cn("text-xs", done ? "font-medium" : "text-muted-foreground")}>{s.label}</span>
            {i < STAGES.length - 1 ? <span className="mx-1 text-muted-foreground/40">→</span> : null}
          </div>
        );
      })}
      {returnless ? (
        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          Returnless — no pickup needed
        </span>
      ) : null}
    </div>
  );
}
