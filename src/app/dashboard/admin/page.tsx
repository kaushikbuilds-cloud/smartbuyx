import { IndianRupee, ShoppingBag, Users, Store, Package, FileClock, RotateCcw, TrendingUp } from "lucide-react";
import { getPlatformStats } from "@/features/admin/queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Admin Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const s = await getPlatformStats();

  const stats = [
    { icon: IndianRupee, label: "GMV", value: formatINR(s.gmv), color: "from-emerald-500 to-teal-500" },
    { icon: ShoppingBag, label: "Orders", value: s.orders.toLocaleString("en-IN"), color: "from-blue-500 to-indigo-500" },
    { icon: TrendingUp, label: "Paid orders", value: s.paidOrders.toLocaleString("en-IN"), color: "from-purple-500 to-fuchsia-500" },
    { icon: Users, label: "Users", value: s.users.toLocaleString("en-IN"), color: "from-cyan-500 to-blue-500" },
    { icon: Store, label: "Sellers", value: s.sellers.toLocaleString("en-IN"), color: "from-amber-500 to-orange-500" },
    { icon: Package, label: "Products", value: s.products.toLocaleString("en-IN"), color: "from-rose-500 to-pink-500" },
    { icon: FileClock, label: "Pending applications", value: s.pendingApplications, color: "from-violet-500 to-purple-500" },
    { icon: RotateCcw, label: "Open returns", value: s.openReturns, color: "from-red-500 to-rose-500" },
  ];

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-sm text-muted-foreground">Platform health at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((st) => (
          <Card key={st.label}>
            <CardContent className="p-5">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${st.color} text-white`}>
                <st.icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-2xl font-bold">{st.value}</p>
              <p className="text-sm text-muted-foreground">{st.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
