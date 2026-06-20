import { ShoppingBag, PiggyBank, Award, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/format";

type Props = {
  totalSpent: number;
  moneySaved: number;
  rewardsEarned: number;
  reviewsGiven: number;
};

export function ActivitySummaryCard({ totalSpent, moneySaved, rewardsEarned, reviewsGiven }: Props) {
  const rows = [
    { icon: ShoppingBag, label: "Total Orders", value: formatINR(totalSpent), iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300" },
    { icon: PiggyBank, label: "Money Saved", value: formatINR(moneySaved), iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300" },
    { icon: Award, label: "Rewards Earned", value: `${rewardsEarned.toLocaleString("en-IN")} Coins`, iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300" },
    { icon: Star, label: "Reviews Given", value: reviewsGiven, iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300" },
  ];

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">My Activity Summary</h3>
          <span className="text-xs text-muted-foreground">This Month</span>
        </div>
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${r.iconBg}`}>
                  <r.icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-muted-foreground">{r.label}</span>
              </div>
              <span className="font-semibold">{r.value}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
