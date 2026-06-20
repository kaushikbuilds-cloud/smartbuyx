import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";
import { formatINR } from "@/lib/utils/format";
import type { OrderSummary } from "@/features/orders/order-queries";

export function MyOrdersRow({ orders }: { orders: OrderSummary[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">My Orders</h2>
        <Link href="/orders" className="text-sm text-primary hover:underline">View All Orders</Link>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-muted-foreground">
            <Package className="h-10 w-10" />
            <p className="text-sm">No orders yet.</p>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/products">Start shopping <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {orders.slice(0, 4).map((o) => (
            <Card key={o.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Order #{o.id.slice(0, 7).toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="line-clamp-2 text-sm font-medium">{o.firstTitle}{o.itemCount > 1 ? ` +${o.itemCount - 1} more` : ""}</p>
                <p className="text-sm font-semibold">{formatINR(o.total)}</p>
                <div className="flex gap-2">
                  <Button variant="gradient" size="sm" className="flex-1" asChild>
                    <Link href={`/orders/${o.id}`}>{o.status === "delivered" ? "Buy Again" : "Track Order"}</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/orders/${o.id}/invoice`}>Invoice</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
