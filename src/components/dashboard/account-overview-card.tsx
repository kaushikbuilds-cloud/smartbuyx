import Link from "next/link";
import { Wallet, Package, PiggyBank, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/format";

type Props = {
  totalSpent: number;
  ordersCount: number;
  moneySaved: number;
  smartCoins: number;
};

export function AccountOverviewCard({ totalSpent, ordersCount, moneySaved, smartCoins }: Props) {
  const items = [
    { icon: Wallet, label: "Total Spent", value: formatINR(totalSpent), iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300" },
    { icon: Package, label: "Orders", value: ordersCount, iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300" },
    { icon: PiggyBank, label: "Money Saved", value: formatINR(moneySaved), iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300" },
    { icon: Coins, label: "Smart Coins", value: smartCoins.toLocaleString("en-IN"), iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300" },
  ];

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">My Account Overview</h3>
          <Link href="/dashboard/customer" className="text-xs text-primary hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <div key={it.label} className="rounded-xl border bg-muted/20 p-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${it.iconBg}`}>
                <it.icon className="h-4 w-4" />
              </span>
              <p className="mt-2 text-lg font-bold leading-tight">{it.value}</p>
              <p className="text-xs text-muted-foreground">{it.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
