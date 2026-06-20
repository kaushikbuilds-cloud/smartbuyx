import Link from "next/link";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listOrders } from "@/features/orders/order-queries";
import { formatINR } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";

export const metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const { user } = await requireUser();
  const orders = await listOrders(user.id);

  if (orders.length === 0) {
    return (
      <main className="container mx-auto flex flex-col items-center gap-4 px-4 py-24 text-center">
        <Package className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">No orders yet</h1>
        <Button variant="gradient" asChild><Link href="/products">Start shopping</Link></Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>
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
    </main>
  );
}
