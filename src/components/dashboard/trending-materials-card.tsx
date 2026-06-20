import Link from "next/link";
import Image from "next/image";
import { ImageOff, Boxes } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/format";
import type { Product } from "@/features/catalog/types";

export function TrendingMaterialsCard({ products }: { products: Product[] }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Trending Materials</h3>
          <Link href="/materials" className="text-xs text-primary hover:underline">View All</Link>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center text-muted-foreground">
            <Boxes className="h-8 w-8" />
            <p className="text-xs">No materials listed yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {products.slice(0, 3).map((p) => {
              const img = p.images?.[0]?.url;
              return (
                <li key={p.id}>
                  <Link href={`/products/${p.slug}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-muted">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {img ? (
                        <Image src={img} alt={p.title} fill sizes="48px" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <ImageOff className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      {p.brand ? <p className="text-xs text-muted-foreground">{p.brand}</p> : null}
                    </div>
                    <p className="text-sm font-bold">
                      {formatINR(p.base_price)}
                      {p.unit ? <span className="ml-1 text-xs font-normal text-muted-foreground">/ {p.unit}</span> : null}
                    </p>
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
