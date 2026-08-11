import type { UsageSummary } from "@/features/billing/gating";

const FEATURE_LABELS: Record<string, string> = {
  ai_house_builder: "AI House Builder",
  architecture_design: "Architecture Design",
  projects: "Projects",
  customers: "Customer connections",
};

export function UsageBars({ usage }: { usage: UsageSummary[] }) {
  if (usage.length === 0) return null;
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Usage this month</h3>
      {usage.map((u) => {
        const pct = u.limit ? Math.min(100, Math.round((u.used / u.limit) * 100)) : 0;
        return (
          <div key={u.featureKey}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>{FEATURE_LABELS[u.featureKey] ?? u.featureKey}</span>
              <span className="text-muted-foreground">
                {u.used} / {u.limit === null ? "∞" : u.limit} used
              </span>
            </div>
            {u.limit !== null ? (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${pct >= 100 ? "bg-destructive" : "bg-gradient-to-r from-purple-600 to-indigo-600"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
