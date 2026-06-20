"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag, Sparkles, Send, PartyPopper } from "lucide-react";

const CHIPS = ["Best deals today", "Compare prices", "Price drops", "Trending now"];

export function AIAssistantHero({ firstName }: { firstName: string }) {
  const router = useRouter();

  function ask(q: string) {
    router.push(`/assistant?q=${encodeURIComponent(q)}`);
  }

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 px-8 py-7 text-white shadow-lg shadow-purple-600/20">
      <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-fuchsia-400/30 blur-3xl" />
      <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-blue-400/20 blur-3xl" />

      <div className="relative grid items-center gap-6 md:grid-cols-[1fr,auto]">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-white/80">
            Welcome back, {firstName}! <PartyPopper className="h-4 w-4 text-amber-300" />
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">
            Smart shopping<br />starts here
          </h1>
          <p className="mt-2 text-sm text-white/80">Discover, compare and save more with SmartBuyX</p>

          <form
            className="mt-5 flex max-w-xl items-center gap-2 rounded-xl bg-white/95 p-1.5 text-foreground shadow-lg"
            onSubmit={(e) => {
              e.preventDefault();
              const q = (new FormData(e.currentTarget).get("q") as string).trim();
              if (q) ask(q);
            }}
          >
            <span className="flex h-9 w-9 items-center justify-center text-purple-600">
              <Sparkles className="h-5 w-5" />
            </span>
            <input
              name="q"
              placeholder="Ask SmartBuyX AI anything..."
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Ask AI <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => ask(c)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur transition-colors hover:bg-white/20"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Decorative shopping bag emoji */}
        <div className="hidden text-[120px] leading-none drop-shadow-2xl md:block" aria-hidden>
          <ShoppingBag className="h-32 w-32 text-white/90" />
        </div>
      </div>
    </section>
  );
}
