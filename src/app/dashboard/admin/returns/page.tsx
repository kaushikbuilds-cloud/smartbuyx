import { RotateCcw } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { listPendingReturns } from "@/features/admin/queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReturnResolutionActions } from "@/components/admin/return-resolution-actions";

export const metadata = { title: "Returns · Admin" };
export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  damaged: "Damaged",
  wrong_item: "Wrong item",
  not_as_described: "Not as described",
  size_fit: "Size / fit",
  no_longer_needed: "No longer needed",
  better_price: "Found better price",
  other: "Other",
};

export default async function AdminReturnsPage() {
  await requireRole("admin", "superadmin");
  const returns = await listPendingReturns();

  return (
    <main className="space-y-4">
      <div className="flex items-center gap-2">
        <RotateCcw className="h-5 w-5 text-rose-600" />
        <h1 className="text-2xl font-bold">Returns</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Returns that didn't qualify for an instant refund or exchange (higher value, or the buyer didn't clear the trust bar) wait here for manual resolution.
      </p>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Buyer</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Notes</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Flags</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr key={r.id} className="border-b last:border-0 align-top">
                  <td className="p-3 font-medium">{r.itemTitle}</td>
                  <td className="p-3">{r.buyerName ?? "—"}</td>
                  <td className="p-3">{REASON_LABELS[r.reason] ?? r.reason}</td>
                  <td className="p-3 max-w-xs">
                    {r.notes ? <p className="text-muted-foreground">{r.notes}</p> : null}
                    {r.videoUrl ? (
                      <a href={r.videoUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                        View proof
                      </a>
                    ) : null}
                    {r.sellerNotes ? <p className="mt-1 text-xs text-rose-600">Seller: {r.sellerNotes}</p> : null}
                  </td>
                  <td className="p-3 font-semibold">{formatINR(r.amount)}</td>
                  <td className="p-3 space-x-1">
                    {r.isExchange ? <Badge variant="outline">Exchange</Badge> : null}
                    {r.disputed ? <Badge variant="destructive">Disputed</Badge> : null}
                  </td>
                  <td className="p-3"><ReturnResolutionActions returnId={r.id} /></td>
                </tr>
              ))}
              {returns.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No returns awaiting review.</td></tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
