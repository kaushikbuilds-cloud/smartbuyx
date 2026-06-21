import Link from "next/link";
import {
  Smartphone, Laptop, Shirt, UtensilsCrossed, Cpu, Armchair, HardHat, Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const CATEGORIES = [
  { label: "Mobiles", href: "/products?q=mobile", icon: Smartphone, color: "from-rose-400 to-pink-500" },
  { label: "Laptops", href: "/products?q=laptop", icon: Laptop, color: "from-blue-400 to-indigo-500" },
  { label: "Fashion", href: "/products?q=fashion", icon: Shirt, color: "from-fuchsia-400 to-purple-500" },
  { label: "Home & Kitchen", href: "/products?q=kitchen", icon: UtensilsCrossed, color: "from-amber-400 to-orange-500" },
  { label: "Electronics", href: "/products?q=electronics", icon: Cpu, color: "from-cyan-400 to-teal-500" },
  { label: "Furniture", href: "/products?q=furniture", icon: Armchair, color: "from-emerald-400 to-green-500" },
  { label: "Construction", href: "/materials", icon: HardHat, color: "from-slate-400 to-slate-600" },
  { label: "Beauty", href: "/products?q=beauty", icon: Sparkles, color: "from-pink-400 to-rose-500" },
];

export function PopularCategoriesRow() {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Popular Categories</h2>
        <Link href="/products" className="text-sm text-primary hover:underline">View All</Link>
      </div>
      <Card>
        <CardContent className="grid grid-cols-4 gap-3 p-5 md:grid-cols-8">
          {CATEGORIES.map((c) => (
            <Link key={c.label} href={c.href} className="group flex flex-col items-center gap-2 text-center">
              <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${c.color} text-white shadow-md transition-transform group-hover:scale-105`}>
                <c.icon className="h-6 w-6" />
              </span>
              <span className="text-[11px] font-medium leading-tight">{c.label}</span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
