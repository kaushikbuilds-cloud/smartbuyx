import { PlayCircle, RotateCcw, Repeat } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { listSellerReturns } from "@/features/orders/returns";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DisputeReturnForm } from "@/components/dashboard/seller/dispute-return-form";

export const metadata = { title: "Returns & Disputes" };

const STATUS_VARIANT: Record<string, "default" | "destructive" | "secondary"> = {
  requested: "secondary",
  approved: "default",
  refunded: "default",
  rejected: "destructive",
  cancelled: "secondary",
};

export default async function SellerReturnsPage() {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const returns = await listSellerReturns(user.id);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Returns & Disputes</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Returns filed against your products. If a return looks abusive, dispute it — our team will review.
      </p>

      {returns.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">No returns yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{r.title}</p>
                    {r.is_exchange ? (
                      <Badge variant="secondary" className="gap-1"><Repeat className="h-3 w-3" /> Exchange</Badge>
                    ) : null}
                    {r.disputed ? <Badge variant="destructive">Disputed</Badge> : null}
                  </div>
                  <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"} className="capitalize">{r.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Reason: <span className="capitalize">{r.reason.replace(/_/g, " ")}</span> · {formatINR(r.amount)} ·{" "}
                  {new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
                {r.notes ? <p className="text-xs text-muted-foreground">Buyer notes: {r.notes}</p> : null}
                {r.video_url ? (
                  <a
                    href={r.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <PlayCircle className="h-3.5 w-3.5" /> View proof
                  </a>
                ) : null}
                {r.seller_notes ? (
                  <p className="rounded-md bg-muted px-2 py-1.5 text-xs">
                    <RotateCcw className="mr-1 inline h-3 w-3" /> Your dispute note: {r.seller_notes}
                  </p>
                ) : (
                  <DisputeReturnForm returnId={r.id} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
