import Link from "next/link";
import { ShoppingBag, Rocket, ShieldCheck, Truck, Headphones, ShieldCheck as Shield, Star } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { SocialButtons } from "@/components/auth/social-buttons";

export const metadata = { title: "Log in" };

const FEATURES = [
  { icon: Rocket, title: "Best Prices", desc: "Compare prices from multiple sellers and get the best deals" },
  { icon: ShieldCheck, title: "Secure Shopping", desc: "100% secure payments and your data is always protected" },
  { icon: Truck, title: "Fast Delivery", desc: "Quick delivery at your doorstep with real-time tracking" },
  { icon: Headphones, title: "24/7 Support", desc: "We're here to help you anytime, anywhere" },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-purple-950/40 dark:via-background dark:to-indigo-950/40">
      <div className="container mx-auto flex flex-1 flex-col px-4 py-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="mb-8 flex items-center gap-2 self-start">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="text-2xl font-bold tracking-tight">
            Smart<span className="text-purple-600">BuyX</span>
          </span>
        </Link>

        <div className="grid flex-1 gap-12 lg:grid-cols-[1.1fr,1fr]">
          {/* Left — welcome + features */}
          <section className="hidden flex-col justify-center lg:flex">
            <p className="text-base font-medium text-muted-foreground">Welcome back! 👋</p>
            <h1 className="mt-1 text-5xl font-bold tracking-tight">
              Smart shopping<br />
              starts <span className="text-purple-600">here</span>
            </h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              Login to your account and discover, compare and save more with SmartBuyX.
            </p>

            <ul className="mt-8 space-y-4">
              {FEATURES.map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{f.title}</p>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Trust strip */}
            <div className="mt-10 flex items-center gap-3 rounded-2xl border bg-card/60 p-3 backdrop-blur">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-gradient-to-br from-purple-200 to-indigo-200 text-xs font-bold text-purple-800"
                  >
                    {String.fromCharCode(64 + i)}
                  </span>
                ))}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-600">Trusted by 100K+</p>
                <p className="text-xs text-muted-foreground">shoppers across India</p>
              </div>
              <div className="flex items-center gap-1 border-l pl-4">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="ml-2">
                  <p className="text-sm font-bold">4.8/5</p>
                  <p className="text-[10px] text-muted-foreground">from 20K+ reviews</p>
                </div>
              </div>
            </div>
          </section>

          {/* Right — login card */}
          <section className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl">
              <div className="mb-6 flex items-center justify-end">
                <p className="text-sm text-muted-foreground">
                  New here?{" "}
                  <Link href="/register" className="font-medium text-purple-600 hover:underline">Sign up</Link>
                </p>
              </div>

              <h2 className="text-2xl font-bold">Login to SmartBuyX</h2>
              <p className="mt-1 text-sm text-muted-foreground">Enter your details to continue</p>

              <div className="mt-6">
                <LoginForm next={next} />
              </div>

              <div className="my-5"><SocialButtons /></div>

              <div className="flex items-start gap-3 rounded-xl bg-purple-50 p-4 text-sm dark:bg-purple-900/20">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
                <div>
                  <p className="font-semibold text-purple-700 dark:text-purple-300">Your security, our priority</p>
                  <p className="text-xs text-muted-foreground">Your data is protected with industry-leading encryption and security.</p>
                </div>
              </div>

              <p className="mt-5 text-center text-xs text-muted-foreground">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="text-purple-600 hover:underline">Terms of Service</Link>{" "}and{" "}
                <Link href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom trust bar */}
      <div className="border-t bg-background">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-4 sm:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Secure Payments", sub: "100% safe and secure" },
            { icon: Truck, title: "Easy Returns", sub: "7-day return policy" },
            { icon: Rocket, title: "Best Price Guarantee", sub: "Find a lower price? We'll match it" },
            { icon: Truck, title: "Pan India Delivery", sub: "Delivery across 29,000+ pin codes" },
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-purple-600">
                <b.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
