"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function CatalogToolbar({ placeholder = "Search products..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form
        className="relative w-full sm:max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          update("q", new FormData(e.currentTarget).get("q") as string);
        }}
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={params.get("q") ?? ""} placeholder={placeholder} className="pl-9" />
      </form>
      <select
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        defaultValue={params.get("sort") ?? "newest"}
        onChange={(e) => update("sort", e.target.value)}
      >
        <option value="newest">Newest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="rating">Top Rated</option>
      </select>
    </div>
  );
}
