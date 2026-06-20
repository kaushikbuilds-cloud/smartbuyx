import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/format";
import type { Product } from "@/features/catalog/types";

export function RecentlyViewedCard({ products }: { products: Product[] }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Recently Viewed</h3>
          <Link href="/products" className="text-xs text-primary hover:underline">View All</Link>
        </div>

        {products.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Browse products to populate this.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 4).map((p) => {
              const img = p.images?.[0]?.url;
              return (
                <Link key={p.id} href={`/products/${p.slug}`} className="group">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    {img ? (
                      <Image src={img} alt={p.title} fill sizes="100px" className="object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ImageOff className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs font-medium">{p.title}</p>
                  <p className="text-xs font-bold">{formatINR(p.base_price)}</p>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
