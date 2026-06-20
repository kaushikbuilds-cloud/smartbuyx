import { PackageOpen } from "lucide-react";
import { ProductCard } from "./product-card";
import type { Product } from "@/features/catalog/types";

export function ProductGrid({ products, wishlisted }: { products: Product[]; wishlisted?: Set<string> }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground">
        <PackageOpen className="h-12 w-12" />
        <p>No products found.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} wishlisted={wishlisted?.has(p.id)} />
      ))}
    </div>
  );
}
