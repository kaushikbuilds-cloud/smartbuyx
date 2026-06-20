import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/format";

export function ProjectBudgetCard({
  totalBudget,
  spent,
}: {
  totalBudget: number;
  spent: number;
}) {
  const remaining = Math.max(0, totalBudget - spent);
  const pct = totalBudget > 0 ? Math.min(100, (spent / totalBudget) * 100) : 0;

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Project Budget</h3>
          <Wallet className="h-4 w-4 text-orange-500" />
        </div>

        {totalBudget === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Add a project to track budget here.</p>
        ) : (
          <>
            <div>
              <p className="text-3xl font-bold">{formatINR(remaining)}</p>
              <p className="text-xs text-muted-foreground">Remaining of {formatINR(totalBudget)}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{formatINR(spent)} spent ({pct.toFixed(0)}%)</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
