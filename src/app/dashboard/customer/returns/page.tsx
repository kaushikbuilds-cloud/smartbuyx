import Link from "next/link";
import { RotateCcw, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listMyReturns } from "@/features/orders/returns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/dashboard/page-shell";
import { CancelReturnButton } from "@/components/shop/cancel-return-button";
import { formatINR } from "@/lib/utils/format";

export const metadata = { title: "Returns & Refunds" };

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive"> = {
  requested: "secondary",
  approved: "default",
  rejected: "destructive",
  pickup_scheduled: "default",
  picked_up: "default",
  refunded: "success",
  cancelled: "destructive",
};

const REASON_LABELS: Record<string, string> = {
  damaged: "Damaged",
  wrong_item: "Wrong item",
  not_as_described: "Not as described",
  size_fit: "Size / fit",
  no_longer_needed: "No longer needed",
  better_price: "Better price",
  other: "Other",
};

export default async function ReturnsPage() {
  const { user } = await requireUser();
  const returns = await listMyReturns(user.id);

  return (
    <PageShell
      title="Returns & Refunds"
      description="Initiate returns from a delivered order. Refunds credit to your wallet within 24h of pickup."
      actions={<Button variant="outline" asChild><Link href="/orders">View orders</Link></Button>}
    >
      {returns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
            <RotateCcw className="h-10 w-10" />
            <p>No returns yet. Start one from any delivered order.</p>
            <Button variant="gradient" asChild>
              <Link href="/orders">Open orders <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => {
            const cancellable = ["requested", "approved"].includes(r.status);
            return (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {REASON_LABELS[r.reason] ?? r.reason} ·{" "}
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatINR(r.amount)}</span>
                    <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"} className="capitalize">
                      {r.status.replace(/_/g, " ")}
                    </Badge>
                    {cancellable ? <CancelReturnButton id={r.id} /> : null}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/orders/${r.order_id}`}>View order</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
