import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/format";
import type { Product } from "@/features/catalog/types";

export function PriceAlertsCard({ products }: { products: Product[] }) {
  // Treat products with compare_at_price > base_price as "price dropped" demos.
  const alerts = products
    .filter((p) => p.compare_at_price && p.compare_at_price > p.base_price)
    .slice(0, 3)
    .map((p) => ({
      product: p,
      drop: Number(p.compare_at_price) - Number(p.base_price),
      timeAgo: ["6m ago", "1d ago", "2d ago"][Math.floor(Math.random() * 3)],
    }));

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Price Alerts</h3>
          <Link href="/dashboard/customer/alerts" className="text-xs text-primary hover:underline">View All</Link>
        </div>

        {alerts.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No alerts yet.</p>
        ) : (
          <ul className="space-y-3">
            {alerts.map(({ product, drop, timeAgo }) => {
              const img = product.images?.[0]?.url;
              return (
                <li key={product.id}>
                  <Link href={`/products/${product.slug}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-muted">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {img ? (
                        <Image src={img} alt={product.title} fill sizes="48px" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <ImageOff className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.title}</p>
                      <p className="text-xs text-emerald-600">Price dropped by {formatINR(drop)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatINR(product.base_price)}</p>
                      <p className="text-[10px] text-muted-foreground line-through">{formatINR(Number(product.compare_at_price))}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
