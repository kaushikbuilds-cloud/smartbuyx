"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function CategoryChips({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("category") ?? "";

  function select(id: string) {
    const next = new URLSearchParams(params.toString());
    if (id) next.set("category", id);
    else next.delete("category");
    router.push(`${pathname}?${next.toString()}`);
  }

  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => select("")}
        className={cn(
          "rounded-full border px-3 py-1 text-sm transition-colors",
          !active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
        )}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => select(c.id)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            active === c.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          )}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
