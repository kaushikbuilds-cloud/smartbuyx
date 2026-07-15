import { listAllOrders } from "@/features/admin/queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/shop/order-status-badge";

export const metadata = { title: "Orders · Admin" };

export default async function AdminOrdersPage() {
  const orders = await listAllOrders();
  const gmv = orders
    .filter((o) => ["paid", "processing", "shipped", "delivered"].includes(o.status))
    .reduce((s, o) => s + o.total, 0);

  return (
    <main className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">GMV (last 100): <span className="font-semibold text-foreground">{formatINR(gmv)}</span></p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="p-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                  <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="p-3 text-right font-semibold">{formatINR(o.total)}</td>
                  <td className="p-3"><OrderStatusBadge status={o.status} /></td>
                </tr>
              ))}
              {orders.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No orders yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
