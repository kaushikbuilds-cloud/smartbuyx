import Link from "next/link";
import { Scale, Bell, Tag, Sparkles, HardHat, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ACTIONS = [
  { icon: Scale, label: "Compare Products", href: "/dashboard/customer/compare", color: "from-blue-500 to-cyan-500" },
  { icon: Bell, label: "Track Prices", href: "/dashboard/customer/alerts", color: "from-rose-500 to-pink-500" },
  { icon: Tag, label: "Browse Deals", href: "/products?sort=rating", color: "from-amber-500 to-orange-500" },
  { icon: Sparkles, label: "Ask AI", href: "/assistant", color: "from-purple-600 to-indigo-600" },
  { icon: HardHat, label: "Build Cost Estimator", href: "/cost-calculator", color: "from-emerald-500 to-teal-500" },
  { icon: Gift, label: "Refer & Earn", href: "/dashboard/customer/invite", color: "from-fuchsia-500 to-purple-600" },
];

export function QuickActionsRow() {
  return (
    <section>
      <h2 className="mb-3 font-semibold">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {ACTIONS.map((a) => (
          <Link key={a.label} href={a.href} className="group">
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${a.color} text-white shadow-md`}>
                  <a.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium leading-tight">{a.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
