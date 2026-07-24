import Link from "next/link";
import Image from "next/image";
import { RefreshCw, ImageOff, BatteryMedium, ShieldCheck } from "lucide-react";
import { getRefurbishedListings } from "@/features/refurbished/queries";
import { CONDITION_LABELS } from "@/features/refurbished/types";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Refurbished Products" };

export default async function RefurbishedCategoryPage() {
  const products = await getRefurbishedListings();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md">
          <RefreshCw className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">Refurbished Products</h1>
          <p className="text-sm text-muted-foreground">
            Professionally tested phones, laptops, tablets, and more — every item is quality-inspected before listing.
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
          No refurbished items available right now — check back soon.
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`} className="group">
              <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
                <div className="relative aspect-square bg-muted">
                  {p.images[0]?.url ? (
                    <Image src={p.images[0].url} alt={p.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground"><ImageOff className="h-8 w-8" /></div>
                  )}
                  <Badge variant="success" className="absolute left-2 top-2">{CONDITION_LABELS[p.condition_grade]}</Badge>
                </div>
                <CardContent className="space-y-1.5 p-3">
                  {p.brand ? <p className="text-xs text-muted-foreground">{p.brand}</p> : null}
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold">{formatINR(p.base_price)}</span>
                    {p.compare_at_price && p.compare_at_price > p.base_price ? (
                      <span className="text-xs text-muted-foreground line-through">{formatINR(p.compare_at_price)}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    {p.battery_health != null ? (
                      <span className="flex items-center gap-1"><BatteryMedium className="h-3 w-3" /> {p.battery_health}%</span>
                    ) : null}
                    {p.warranty_months > 0 ? (
                      <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {p.warranty_months}mo warranty</span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
