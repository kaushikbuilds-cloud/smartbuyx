import { Check, Minus } from "lucide-react";
import type { PlanRow, PlanFeatureLimit } from "@/features/billing/queries";

const FEATURE_LABELS: Record<string, string> = {
  ai_house_builder: "AI House Builder",
  architecture_design: "Architecture Design",
  projects: "Projects",
  customers: "Customer connections",
};

// One row per plan feature this audience's plans have any limit data for,
// plus a generic "Included features" row summarizing each plan's text
// bullets, so plans with no numeric limits (e.g. Customer, Architect Free)
// still produce a meaningful table instead of an empty one.
export function PlanComparisonTable({ plans, limits }: { plans: PlanRow[]; limits: PlanFeatureLimit[] }) {
  const featureKeys = [...new Set(limits.map((l) => l.featureKey))];
  if (plans.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="p-4 text-left font-semibold">Feature</th>
            {plans.map((p) => (
              <th key={p.id} className="p-4 text-center font-semibold">{p.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {featureKeys.map((key) => (
            <tr key={key} className="border-b last:border-0">
              <td className="p-4 text-muted-foreground">{FEATURE_LABELS[key] ?? key}</td>
              {plans.map((p) => {
                const limit = limits.find((l) => l.planId === p.id && l.featureKey === key);
                return (
                  <td key={p.id} className="p-4 text-center">
                    {!limit ? (
                      <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                    ) : limit.limitValue === null ? (
                      <span className="font-medium text-emerald-600">Unlimited</span>
                    ) : (
                      <span>{limit.limitValue}/mo</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className="p-4 align-top text-muted-foreground">Included features</td>
            {plans.map((p) => (
              <td key={p.id} className="p-4 align-top">
                <ul className="space-y-1.5 text-left">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="text-xs">{f}</span>
                    </li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
