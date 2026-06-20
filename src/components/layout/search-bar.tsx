"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar() {
  const router = useRouter();
  return (
    <form
      className="relative hidden w-full max-w-md md:block"
      onSubmit={(e) => {
        e.preventDefault();
        const q = (new FormData(e.currentTarget).get("q") as string).trim();
        router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
      }}
    >
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input name="q" placeholder="Search products, materials, brands..." className="pl-9" />
    </form>
  );
}
