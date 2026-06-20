import Link from "next/link";
import { Heart, Bell, TrendingDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  wishlistCount: number;
  priceAlertsActive: number;
  droppedPrices: number;
};

export function SavedAlertsCard({ wishlistCount, priceAlertsActive, droppedPrices }: Props) {
  const rows = [
    { icon: Heart, label: "Wishlist", count: wishlistCount, sub: `${wishlistCount} Items`, href: "/wishlist", iconColor: "text-rose-500" },
    { icon: Bell, label: "Price Alerts", count: priceAlertsActive, sub: `${priceAlertsActive} Active`, href: "/dashboard/customer/alerts", iconColor: "text-amber-500" },
    { icon: TrendingDown, label: "Recently Dropped Prices", count: droppedPrices, sub: `${droppedPrices} New Deals`, href: "/products?sort=price_asc", iconColor: "text-emerald-500" },
  ];

  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <h3 className="mb-3 font-semibold">Saved &amp; Alerts</h3>
        <ul className="space-y-1">
          {rows.map((r) => (
            <li key={r.label}>
              <Link href={r.href} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted">
                <div className="flex items-center gap-3">
                  <r.icon className={`h-5 w-5 ${r.iconColor}`} />
                  <div>
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.sub}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
