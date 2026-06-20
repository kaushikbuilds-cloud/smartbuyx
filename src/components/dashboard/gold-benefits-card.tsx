import Link from "next/link";
import { Crown, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";

const GOLD_THRESHOLD = 5000;

export function GoldBenefitsCard({ saved }: { saved: number }) {
  const remaining = Math.max(0, GOLD_THRESHOLD - saved);
  const pct = Math.min(100, (saved / GOLD_THRESHOLD) * 100);

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-semibold">
              You are saving more! <Flame className="h-4 w-4 text-orange-500" />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Save {formatINR(remaining)} more to unlock Gold Benefits
            </p>
          </div>
          <Crown className="h-8 w-8 text-amber-400" />
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatINR(saved)} / {formatINR(GOLD_THRESHOLD)}
          </span>
          <Button variant="gradient" size="sm" asChild>
            <Link href="/wallet">View Benefits</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
