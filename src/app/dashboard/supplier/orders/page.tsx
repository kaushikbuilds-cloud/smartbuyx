import { Package } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getSellerOrders } from "@/features/orders/seller-order-queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { ShipmentStatusControl } from "@/components/dashboard/seller/shipment-status-control";

export const metadata = { title: "Orders" };

export default async function SellerOrdersPage() {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const orders = await getSellerOrders(user.id);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Incoming Orders</h1>

      {orders.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
          <Package className="h-10 w-10" />
          No orders yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.shipmentId ?? o.orderId}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{o.orderId.slice(0, 8)}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {o.items.map((i) => `${i.title} ×${i.quantity}`).join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.placedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="text-right font-semibold">{formatINR(o.amount)}</div>
                <ShipmentStatusControl shipmentId={o.shipmentId} status={o.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
