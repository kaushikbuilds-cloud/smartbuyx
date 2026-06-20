import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/format";
import type { Product } from "@/features/catalog/types";

export function TrendingDealsCard({ products }: { products: Product[] }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Trending Deals</h3>
          <Link href="/products?sort=rating" className="text-xs text-primary hover:underline">View All</Link>
        </div>

        {products.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No deals yet.</p>
        ) : (
          <ul className="space-y-3">
            {products.slice(0, 2).map((p) => {
              const img = p.images?.[0]?.url;
              const discount =
                p.compare_at_price && p.compare_at_price > p.base_price
                  ? Math.round(((p.compare_at_price - p.base_price) / p.compare_at_price) * 100)
                  : 0;
              return (
                <li key={p.id}>
                  <Link href={`/products/${p.slug}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                      {img ? (
                        <Image src={img} alt={p.title} fill sizes="56px" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <ImageOff className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="flex items-baseline gap-2 text-sm">
                        <span className="font-bold">{formatINR(p.base_price)}</span>
                        {p.compare_at_price && p.compare_at_price > p.base_price ? (
                          <span className="text-xs text-muted-foreground line-through">{formatINR(p.compare_at_price)}</span>
                        ) : null}
                        {discount > 0 ? (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">{discount}% OFF</span>
                        ) : null}
                      </p>
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
