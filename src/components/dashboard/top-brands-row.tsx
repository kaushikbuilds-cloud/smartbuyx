import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const BRANDS = [
  { name: "Apple", short: "" },
  { name: "Samsung", short: "S" },
  { name: "boAt", short: "b" },
  { name: "Realme", short: "R" },
  { name: "Xiaomi", short: "Mi" },
  { name: "ASUS", short: "A" },
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
              <span className="flex h-16 w-16 items-center justify-center rounded-full border bg-card text-xl font-bold text-foreground/80 transition-shadow group-hover:shadow-md">
                {b.short || b.name[0]}
              </span>
              <span className="text-xs font-medium">{b.name}</span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
