import Link from "next/link";
import {
  ShoppingBag, HardHat, Sparkles, Boxes, Ruler, Video, ScanLine, Building2,
  Rocket, ShieldCheck, Truck, Headphones, Star, ArrowRight, BadgeCheck, RotateCcw, PartyPopper, Gift, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTrending } from "@/features/catalog/queries";
import { ProductGrid } from "@/components/shop/product-grid";

const QUICK = [
  { icon: ShoppingBag, label: "Shopping", href: "/products", color: "from-rose-500 to-pink-500" },
  { icon: Boxes, label: "Construction", href: "/materials", color: "from-amber-500 to-orange-500" },
  { icon: Building2, label: "Architects", href: "/architects", color: "from-blue-500 to-indigo-500" },
  { icon: HardHat, label: "Contractors", href: "/contractors", color: "from-emerald-500 to-teal-500" },
  { icon: Ruler, label: "Estimator", href: "/estimator", color: "from-cyan-500 to-blue-500" },
  { icon: ScanLine, label: "AR Try Room", href: "/ar-try", color: "from-fuchsia-500 to-purple-500" },
  { icon: Video, label: "Creator Hub", href: "/reels", color: "from-violet-500 to-purple-500" },
  { icon: Sparkles, label: "AI Assistant", href: "/assistant", color: "from-purple-600 to-indigo-600" },
  { icon: Gift, label: "Gift Finder", href: "/gift-finder", color: "from-rose-500 to-pink-600" },
  { icon: RefreshCw, label: "Refurbished", href: "/refurbished", color: "from-teal-500 to-emerald-600" },
];

const FEATURES = [
  { icon: Rocket, title: "Best Prices", desc: "Compare prices from multiple sellers and get the best deals" },
  { icon: ShieldCheck, title: "Secure Shopping", desc: "100% secure payments and your data is always protected" },
  { icon: Truck, title: "Fast Delivery", desc: "Quick delivery at your doorstep with real-time tracking" },
  { icon: Headphones, title: "24/7 Support", desc: "We're here to help you anytime, anywhere" },
];

const PILLARS = [
  {
    badge: "Commerce",
    title: "Shop products & materials",
    desc: "D2C brands, construction materials, and verified suppliers — one cart, one checkout, fast delivery.",
    href: "/products",
    cta: "Start shopping",
    gradient: "from-purple-600 via-fuchsia-600 to-pink-500",
    icon: ShoppingBag,
  },
  {
    badge: "Build",
    title: "Design & build your dream home",
    desc: "Hire architects, engineers & contractors. Generate floor plans, 3D models and material estimates with AI.",
    href: "/house-builder",
    cta: "Try AI House Builder",
    gradient: "from-amber-500 via-orange-600 to-rose-600",
    icon: HardHat,
  },
];

const TRUST = [
  { icon: ShieldCheck, title: "Secure Payments", sub: "100% safe and secure" },
  { icon: RotateCcw, title: "Easy Returns", sub: "7-day return policy" },
  { icon: BadgeCheck, title: "Best Price Guarantee", sub: "Find a lower price? We'll match it" },
  { icon: Truck, title: "Pan India Delivery", sub: "Across 29,000+ pin codes" },
];

export async function MarketingLanding() {
  const trending = await getTrending(8);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-950/40 dark:via-background dark:to-indigo-950/40" />
        <div className="absolute -top-20 right-0 -z-10 h-72 w-72 rounded-full bg-purple-300/30 blur-3xl dark:bg-purple-700/20" />
        <div className="absolute bottom-0 left-0 -z-10 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-700/20" />

        <div className="container mx-auto px-4 py-20 text-center md:py-28">
          <Badge variant="secondary" className="mb-4 gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
            <Sparkles className="h-3 w-3" /> India&apos;s AI Commerce + Construction super-app
          </Badge>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Shop. Build. Create.{" "}
            <span className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
              All in one place.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            From black shoes under ₹2000 to estimating materials for a 1500 sq.ft house — SmartBuyX does it with AI.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" variant="gradient" className="bg-gradient-to-r from-purple-600 to-indigo-600" asChild>
              <Link href="/register">Get started <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/products">Explore marketplace</Link>
            </Button>
          </div>

          {/* Trust strip */}
          <div className="mx-auto mt-10 inline-flex items-center gap-4 rounded-2xl border bg-card/80 p-3 shadow-sm backdrop-blur">
            <div className="flex -space-x-2">
              {["A", "B", "C", "D"].map((c) => (
                <span key={c} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-gradient-to-br from-purple-200 to-indigo-200 text-xs font-bold text-purple-800">
                  {c}
                </span>
              ))}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-purple-600">Trusted by 100K+ shoppers</p>
              <p className="text-xs text-muted-foreground">across India</p>
            </div>
            <div className="hidden items-center gap-1 border-l pl-4 sm:flex">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="ml-2 text-left">
                <p className="text-sm font-bold">4.8/5</p>
                <p className="text-[10px] text-muted-foreground">from 20K+ reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-6 text-center text-2xl font-bold">Where do you want to start?</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {QUICK.map(({ icon: Icon, label, href, color }) => (
            <Link key={label} href={href} className="group">
              <Card className="transition-shadow group-hover:shadow-md">
                <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-3">Why SmartBuyX</Badge>
          <h2 className="text-3xl font-bold">Everything you need, beautifully built</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="h-full">
              <CardContent className="space-y-3 p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Two pillars showcase */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <Badge variant="secondary" className="mb-3">Two pillars, one app</Badge>
          <h2 className="text-3xl font-bold">Shop &amp; Build, side by side</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${p.gradient} p-8 text-white shadow-lg transition-transform hover:-translate-y-1`}>
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
              <div className="relative">
                <Badge variant="secondary" className="mb-3 bg-white/20 text-white hover:bg-white/30">{p.badge}</Badge>
                <p.icon className="h-10 w-10 text-white/80" />
                <h3 className="mt-4 text-2xl font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-white/85">{p.desc}</p>
                <Button className="mt-6 bg-white text-purple-700 hover:bg-white/90" asChild>
                  <Link href={p.href}>{p.cta} <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending */}
      {trending.length > 0 ? (
        <section className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <PartyPopper className="h-6 w-6 text-amber-500" /> Trending now
            </h2>
            <Button variant="ghost" asChild><Link href="/products">View all <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
          <ProductGrid products={trending} />
        </section>
      ) : null}

      {/* CTA banner */}
      <section className="container mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 p-8 text-center text-white shadow-xl">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-fuchsia-400/30 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-bold">Ready to start saving?</h2>
            <p className="mt-2 text-white/85">Join 100,000+ Indians shopping smarter every day.</p>
            <Button size="lg" className="mt-6 bg-white text-purple-700 hover:bg-white/90" asChild>
              <Link href="/register">Create your free account <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                <t.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{t.title}</p>
                <p className="truncate text-xs text-muted-foreground">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
