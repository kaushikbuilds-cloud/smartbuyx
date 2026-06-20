import { IndianRupee, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getSellerStats } from "@/features/orders/seller-analytics";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Revenue Analytics" };

export default async function SellerAnalyticsPage() {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const stats = await getSellerStats(user.id);

  const cards = [
    { icon: IndianRupee, label: "Revenue", value: formatINR(stats.revenue) },
    { icon: ShoppingBag, label: "Orders", value: stats.orderCount },
    { icon: Package, label: "Units sold", value: stats.unitsSold },
  ];

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Revenue Analytics</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <c.icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Top products</h2>
          </div>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="pb-2">Product</th><th className="pb-2 text-right">Units</th><th className="pb-2 text-right">Revenue</th></tr>
              </thead>
              <tbody>
                {stats.topProducts.map((p) => (
                  <tr key={p.title} className="border-t">
                    <td className="py-2">{p.title}</td>
                    <td className="py-2 text-right">{p.units}</td>
                    <td className="py-2 text-right">{formatINR(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
