import Link from "next/link";
import { FileText } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listMyPurchaseOrders } from "@/features/procurement/queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProcurementChat } from "@/components/procurement/procurement-chat";

export const metadata = { title: "Procurement Assistant" };

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive"> = {
  draft: "secondary",
  sent: "default",
  accepted: "success",
  fulfilled: "success",
  cancelled: "destructive",
};

export default async function ProcurementPage() {
  const { user } = await requireUser();
  const orders = await listMyPurchaseOrders(user.id);

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold">Procurement</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Your AI buying assistant — source materials, compare suppliers, and generate purchase orders.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-3">
            <ProcurementChat />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4" /> Purchase orders
          </h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No purchase orders yet. Ask the assistant to draft one.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((po) => (
                <Link key={po.id} href={`/dashboard/customer/procurement/${po.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="space-y-1 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{po.title}</p>
                        <Badge variant={STATUS_VARIANT[po.status] ?? "secondary"} className="capitalize">{po.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {po.po_number} · {po.items.length} item{po.items.length === 1 ? "" : "s"} · {formatINR(po.total)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
