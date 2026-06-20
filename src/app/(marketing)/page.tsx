import Link from "next/link";
import {
  ShoppingBag, HardHat, Building2, Sparkles, Boxes, Ruler, Video, ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTrending } from "@/features/catalog/queries";
import { ProductGrid } from "@/components/shop/product-grid";

const QUICK = [
  { icon: ShoppingBag, label: "Shopping", href: "/products" },
  { icon: Boxes, label: "Construction", href: "/materials" },
  { icon: Building2, label: "Architects", href: "/architects" },
  { icon: HardHat, label: "Contractors", href: "/contractors" },
  { icon: Ruler, label: "Estimator", href: "/estimator" },
  { icon: ScanLine, label: "AR Try Room", href: "/ar-try" },
  { icon: Video, label: "Creator Hub", href: "/reels" },
  { icon: Sparkles, label: "AI Assistant", href: "/assistant" },
];

const PILLARS = [
  {
    badge: "Commerce",
    title: "Shop products & materials",
    desc: "D2C brands, construction materials, and verified suppliers — one cart, one checkout, fast delivery.",
    href: "/products",
    cta: "Start shopping",
    gradient: "from-blue-600 to-cyan-500",
  },
  {
    badge: "Build",
    title: "Design & build your dream home",
    desc: "Hire architects, engineers & contractors. Generate floor plans, 3D models and material estimates with AI.",
    href: "/house-builder",
    cta: "Try AI House Builder",
    gradient: "from-indigo-600 to-purple-500",
  },
];

export default async function HomePage() {
  const trending = await getTrending(8);
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-background to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30" />
        <div className="container mx-auto px-4 py-24 text-center">
          <Badge variant="secondary" className="mb-4">India&apos;s AI Commerce + Construction super-app</Badge>
          <h1 className="mx-auto max-w-3xl text-balance text-5xl font-bold tracking-tight md:text-6xl">
            Shop. Build. Create.{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              All in one place.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            From black shoes under ₹2000 to estimating materials for a 1500 sq.ft house — SmartBuyX does it with AI.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" variant="gradient" asChild><Link href="/products">Explore marketplace</Link></Button>
            <Button size="lg" variant="outline" asChild><Link href="/house-builder">AI House Builder</Link></Button>
          </div>
        </div>
      </section>

      {/* Quick categories */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {QUICK.map(({ icon: Icon, label, href }) => (
            <Link key={label} href={href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      {trending.length > 0 ? (
        <section className="container mx-auto px-4 py-12">
          <h2 className="mb-6 text-2xl font-bold">Trending now</h2>
          <ProductGrid products={trending} />
        </section>
      ) : null}

      {/* Two pillars */}
      <section className="container mx-auto grid gap-6 px-4 py-12 md:grid-cols-2">
        {PILLARS.map((p) => (
          <Card key={p.title} className="overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${p.gradient}`} />
            <CardContent className="p-8">
              <Badge variant="secondary" className="mb-3">{p.badge}</Badge>
              <h2 className="text-2xl font-bold">{p.title}</h2>
              <p className="mt-2 text-muted-foreground">{p.desc}</p>
              <Button className="mt-6" asChild><Link href={p.href}>{p.cta}</Link></Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
