import Link from "next/link";
import {
  Package, PlusCircle, TrendingUp, Boxes, Scale, FileText, IndianRupee, RotateCcw, ShieldCheck,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getSellerStats } from "@/features/orders/seller-analytics";
import { getInventoryIntelligence } from "@/features/seller/inventory-intelligence";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Seller Hub" };

const TOOLS = [
  { href: "/dashboard/supplier/products/new", label: "Add product", desc: "AI-assisted listing", icon: PlusCircle, color: "from-purple-600 to-indigo-600" },
  { href: "/dashboard/supplier/products", label: "My Products", desc: "Manage listings", icon: Package, color: "from-blue-600 to-cyan-600" },
  { href: "/dashboard/supplier/orders", label: "Orders", desc: "Fulfil & track", icon: FileText, color: "from-emerald-600 to-teal-600" },
  { href: "/dashboard/supplier/analytics", label: "Analytics", desc: "Revenue & returns", icon: TrendingUp, color: "from-amber-500 to-orange-600" },
  { href: "/dashboard/supplier/returns", label: "Returns & Disputes", desc: "Review & flag returns", icon: RotateCcw, color: "from-red-500 to-rose-600" },
  { href: "/dashboard/supplier/inventory", label: "Inventory Intelligence", desc: "Stockout alerts & forecast", icon: Boxes, color: "from-rose-600 to-pink-600" },
  { href: "/dashboard/supplier/competitors", label: "Competitor Analysis", desc: "Pricing guidance", icon: Scale, color: "from-fuchsia-600 to-purple-600" },
  { href: "/dashboard/supplier/rfqs", label: "Incoming RFQs", desc: "Quote requests", icon: FileText, color: "from-cyan-600 to-blue-600" },
  { href: "/dashboard/supplier/verification", label: "Verification & Payouts", desc: "Bank details & KYC", icon: ShieldCheck, color: "from-emerald-600 to-teal-600" },
];

export default async function SupplierDashboard() {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const [stats, inventory] = await Promise.all([
    getSellerStats(user.id),
    getInventoryIntelligence(user.id),
  ]);
  const criticalStock = inventory.filter((i) => i.status === "critical").length;

  return (
    <main className="container mx-auto space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Seller Hub</h1>
        <p className="text-sm text-muted-foreground">Everything you need to run your store.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
              <IndianRupee className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-bold">{formatINR(stats.revenue)}</p>
              <p className="text-xs text-muted-foreground">Total revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
              <Package className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-bold">{stats.orderCount}</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
              <Boxes className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-bold">{criticalStock}</p>
              <p className="text-xs text-muted-foreground">Items need restock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {criticalStock > 0 ? (
        <Link href="/dashboard/supplier/inventory">
          <Card className="border-rose-200 bg-rose-50 transition-shadow hover:shadow-md dark:border-rose-900/40 dark:bg-rose-950/20">
            <CardContent className="flex items-center justify-between p-4">
              <p className="text-sm">
                <Badge variant="destructive" className="mr-2">Urgent</Badge>
                {criticalStock} product{criticalStock === 1 ? "" : "s"} will stock out within 7 days.
              </p>
              <span className="text-sm font-medium text-rose-700 dark:text-rose-300">View →</span>
            </CardContent>
          </Card>
        </Link>
      ) : null}

      <div>
        <h2 className="mb-3 font-semibold">Tools</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardContent className="space-y-2 p-5">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-md`}>
                    <t.icon className="h-5 w-5" />
                  </span>
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
