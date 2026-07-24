import { RefreshCw } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { listRefurbishedQcQueue } from "@/features/admin/queries";
import { CONDITION_LABELS } from "@/features/refurbished/types";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefurbishedQcActions } from "@/components/admin/refurbished-qc-actions";

export const metadata = { title: "Refurbished QC · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminRefurbishedQcPage() {
  await requireRole("admin", "superadmin");
  const queue = await listRefurbishedQcQueue();

  return (
    <main className="space-y-4">
      <div className="flex items-center gap-2">
        <RefreshCw className="h-5 w-5 text-rose-600" />
        <h1 className="text-2xl font-bold">Refurbished QC</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Every refurbished listing must pass inspection before shoppers can see it. Serial/IMEI is shown here only — never public.
      </p>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Seller</th>
                <th className="p-3">Condition</th>
                <th className="p-3">Battery</th>
                <th className="p-3">Warranty</th>
                <th className="p-3">Serial / IMEI</th>
                <th className="p-3">Price</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="p-3">
                    <p className="font-medium">{item.title}</p>
                    {item.brand ? <p className="text-xs text-muted-foreground">{item.brand}</p> : null}
                    {item.accessories_included ? (
                      <p className="text-xs text-muted-foreground">Includes: {item.accessories_included}</p>
                    ) : null}
                  </td>
                  <td className="p-3">{item.supplier_name ?? "—"}</td>
                  <td className="p-3"><Badge variant="outline">{CONDITION_LABELS[item.condition_grade as keyof typeof CONDITION_LABELS] ?? item.condition_grade}</Badge></td>
                  <td className="p-3">{item.battery_health != null ? `${item.battery_health}%` : "—"}</td>
                  <td className="p-3">{item.warranty_months} mo</td>
                  <td className="p-3 font-mono text-xs">{item.serial_or_imei ?? "—"}</td>
                  <td className="p-3 font-semibold">{formatINR(item.base_price)}</td>
                  <td className="p-3"><RefurbishedQcActions productId={item.id} /></td>
                </tr>
              ))}
              {queue.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No refurbished items awaiting inspection.</td></tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
