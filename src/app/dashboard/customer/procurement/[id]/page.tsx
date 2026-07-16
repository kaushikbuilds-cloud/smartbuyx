import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getPurchaseOrder } from "@/features/procurement/queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PoStatusActions } from "@/components/procurement/po-status-actions";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive"> = {
  draft: "secondary",
  sent: "default",
  accepted: "success",
  fulfilled: "success",
  cancelled: "destructive",
};

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser();
  const { id } = await params;
  const po = await getPurchaseOrder(user.id, id);
  if (!po) notFound();

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">{po.title}</h1>
              <p className="text-xs text-muted-foreground">{po.po_number}</p>
            </div>
            <Badge variant={STATUS_VARIANT[po.status] ?? "secondary"} className="capitalize">{po.status}</Badge>
          </div>

          {po.supplier_name ? (
            <p className="text-sm text-muted-foreground">Supplier: {po.supplier_name}</p>
          ) : null}

          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="pb-2">Item</th><th className="pb-2 text-right">Qty</th><th className="pb-2 text-right">Rate</th><th className="pb-2 text-right">Amount</th></tr>
            </thead>
            <tbody>
              {po.items.map((it, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{it.title}</td>
                  <td className="py-2 text-right">{it.quantity}{it.unit ? ` ${it.unit}` : ""}</td>
                  <td className="py-2 text-right">{formatINR(it.unitPrice)}</td>
                  <td className="py-2 text-right">{formatINR(it.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-semibold"><td colSpan={3} className="py-2">Total</td><td className="py-2 text-right">{formatINR(po.total)}</td></tr>
            </tfoot>
          </table>

          {po.notes ? <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{po.notes}</p> : null}

          <PoStatusActions poId={po.id} status={po.status} />
        </CardContent>
      </Card>
    </main>
  );
}
