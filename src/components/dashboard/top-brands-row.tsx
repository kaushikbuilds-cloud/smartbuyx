import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "./brand-logo";

// slug = Simple Icons slug (https://simpleicons.org). Omit if no official icon.
const BRANDS: { name: string; slug?: string }[] = [
  { name: "Apple", slug: "apple" },
  { name: "Samsung", slug: "samsung" },
  { name: "boAt" },
  { name: "Realme", slug: "realme" },
  { name: "Xiaomi", slug: "xiaomi" },
  { name: "ASUS", slug: "asus" },
];

export function TopBrandsRow() {
  return (
    <section>
      <h2 className="mb-3 font-semibold">Top Brands</h2>
      <Card>
        <CardContent className="grid grid-cols-3 gap-4 p-5 md:grid-cols-6">
          {BRANDS.map((b) => (
            <Link
              key={b.name}
              href={`/products?q=${encodeURIComponent(b.name)}`}
              className="group flex flex-col items-center gap-2 text-center"
            >
              <BrandLogo name={b.name} slug={b.slug} />
              <span className="text-xs font-medium">{b.name}</span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
