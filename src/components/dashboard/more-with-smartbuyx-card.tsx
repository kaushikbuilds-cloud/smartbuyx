import { Truck, RotateCcw, ShieldCheck, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ITEMS = [
  { icon: Truck, title: "Fast Delivery", sub: "On orders above ₹499" },
  { icon: RotateCcw, title: "Easy Returns", sub: "Within 7 days" },
  { icon: ShieldCheck, title: "Secure Payments", sub: "100% protected" },
  { icon: BadgeCheck, title: "Best Price Guarantee", sub: "We'll match the price" },
];

export function MoreWithSmartBuyxCard() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="font-semibold">More with SmartBuyX</h3>
        <ul className="space-y-2">
          {ITEMS.map((it) => (
            <li key={it.title} className="flex items-center gap-3 rounded-lg p-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                <it.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{it.title}</p>
                <p className="text-xs text-muted-foreground">{it.sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
