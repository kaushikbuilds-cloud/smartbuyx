import { Boxes, TrendingUp, AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getInventoryIntelligence } from "@/features/seller/inventory-intelligence";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Inventory Intelligence" };

const STATUS_META: Record<string, { label: string; variant: "destructive" | "default" | "success" | "secondary" }> = {
  critical: { label: "Restock now", variant: "destructive" },
  low: { label: "Low stock", variant: "default" },
  healthy: { label: "Healthy", variant: "success" },
  no_sales: { label: "No recent sales", variant: "secondary" },
};

export default async function SellerInventoryPage() {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const insights = await getInventoryIntelligence(user.id);
  const critical = insights.filter((i) => i.status === "critical").length;

  return (
    <main className="container mx-auto space-y-4 px-4 py-8">
      <div className="flex items-center gap-2">
        <Boxes className="h-6 w-6 text-purple-600" />
        <h1 className="text-2xl font-bold">Inventory Intelligence</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        AI-predicted stockouts and 30-day demand forecast, based on your last 30 days of sales.
      </p>

      {critical > 0 ? (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20">
          <CardContent className="flex items-center gap-2 p-4 text-sm">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span><strong>{critical}</strong> item{critical === 1 ? "" : "s"} will stock out within 7 days at current sales pace.</span>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3 text-right">Stock</th>
                <th className="p-3 text-right">Sold (30d)</th>
                <th className="p-3 text-right">Daily velocity</th>
                <th className="p-3 text-right">Days left</th>
                <th className="p-3 text-right">30d forecast</th>
                <th className="p-3 text-right">Suggested reorder</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {insights.map((i) => {
                const meta = STATUS_META[i.status];
                return (
                  <tr key={i.variantId} className="border-b last:border-0">
                    <td className="p-3">
                      <p className="font-medium">{i.title}</p>
                      <p className="text-xs text-muted-foreground">{i.sku}</p>
                    </td>
                    <td className="p-3 text-right">{i.quantity}</td>
                    <td className="p-3 text-right">{i.unitsSoldLast30d}</td>
                    <td className="p-3 text-right">{i.dailyVelocity}</td>
                    <td className="p-3 text-right">{i.daysUntilStockout ?? "—"}</td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" /> {i.forecastNext30d}
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {i.suggestedReorderQty > 0 ? i.suggestedReorderQty : "—"}
                    </td>
                    <td className="p-3"><Badge variant={meta.variant}>{meta.label}</Badge></td>
                  </tr>
                );
              })}
              {insights.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No products with inventory yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
