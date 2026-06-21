import Link from "next/link";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listOrders } from "@/features/orders/order-queries";
import { formatINR } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { CatalogBreadcrumb } from "@/components/shop/catalog-breadcrumb";

export const metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const { user } = await requireUser();
  const orders = await listOrders(user.id);

  return (
    <main className="container mx-auto space-y-4 px-4 py-4">
      <CatalogBreadcrumb trail={[{ label: "My Orders" }]} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">My Orders</h1>
          <p className="text-xs text-muted-foreground">
            {orders.length} order{orders.length === 1 ? "" : "s"} · track delivery, returns &amp; invoices
          </p>
        </div>
        <Button variant="gradient" size="sm" asChild>
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
          <Package className="h-12 w-12" />
          <h2 className="text-xl font-bold text-foreground">No orders yet</h2>
          <Button variant="gradient" asChild><Link href="/products">Start shopping</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`}>
              <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
                <div>
                  <p className="font-medium">{o.firstTitle}{o.itemCount > 1 ? ` +${o.itemCount - 1} more` : ""}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString("en-IN")} · {formatINR(o.total)}
                  </p>
                </div>
                <OrderStatusBadge status={o.status} />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
