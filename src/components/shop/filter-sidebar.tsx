"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Star, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Category = { id: string; name: string; slug: string };

export function FilterSidebar({
  categories,
  showRating = true,
  showDiscount = true,
}: {
  categories: Category[];
  showRating?: boolean;
  showDiscount?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [min, setMin] = useState(params.get("min") ?? "");
  const [max, setMax] = useState(params.get("max") ?? "");

  useEffect(() => {
    setMin(params.get("min") ?? "");
    setMax(params.get("max") ?? "");
  }, [params]);

  const activeCategory = params.get("category") ?? "";
  const activeRating = Number(params.get("rating") ?? 0);
  const activeDiscount = Number(params.get("discount") ?? 0);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  function applyPrice() {
    const next = new URLSearchParams(params.toString());
    if (min) next.set("min", min);
    else next.delete("min");
    if (max) next.set("max", max);
    else next.delete("max");
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  function clear() {
    router.push(pathname);
  }

  const hasFilters =
    activeCategory || activeRating || activeDiscount || params.get("min") || params.get("max");

  return (
    <aside className="space-y-5 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasFilters ? (
          <button onClick={clear} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <X className="h-3 w-3" /> Clear all
          </button>
        ) : null}
      </div>

      {/* Categories */}
      {categories.length > 0 ? (
        <FilterGroup title="Category">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => update("category", "")}
                className={cn(
                  "w-full rounded px-2 py-1 text-left text-xs hover:bg-muted",
                  !activeCategory && "bg-purple-50 font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                )}
              >
                All
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => update("category", c.id)}
                  className={cn(
                    "w-full rounded px-2 py-1 text-left text-xs hover:bg-muted",
                    activeCategory === c.id && "bg-purple-50 font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  )}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </FilterGroup>
      ) : null}

      {/* Price */}
      <FilterGroup title="Price">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="Min"
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="Max"
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
          />
        </div>
        <button
          onClick={applyPrice}
          className="mt-2 w-full rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white"
        >
          Apply
        </button>
      </FilterGroup>

      {/* Rating */}
      {showRating ? (
        <FilterGroup title="Customer rating">
          <ul className="space-y-1">
            {[4, 3, 2].map((r) => (
              <li key={r}>
                <button
                  onClick={() => update("rating", activeRating === r ? "" : String(r))}
                  className={cn(
                    "flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs hover:bg-muted",
                    activeRating === r && "bg-purple-50 font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  )}
                >
                  <span className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < r ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </span>
                  & up
                </button>
              </li>
            ))}
          </ul>
        </FilterGroup>
      ) : null}

      {/* Discount */}
      {showDiscount ? (
        <FilterGroup title="Discount">
          <ul className="space-y-1">
            {[10, 25, 50, 70].map((d) => (
              <li key={d}>
                <button
                  onClick={() => update("discount", activeDiscount === d ? "" : String(d))}
                  className={cn(
                    "w-full rounded px-2 py-1 text-left text-xs hover:bg-muted",
                    activeDiscount === d && "bg-purple-50 font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  )}
                >
                  {d}% or more
                </button>
              </li>
            ))}
          </ul>
        </FilterGroup>
      ) : null}
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-4 first:border-t-0 first:pt-0">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
