"use client";

import { useRouter } from "next/navigation";
import { HardHat, Sparkles, Upload } from "lucide-react";

const CHIPS = ["1 BHK plan", "2 BHK with vastu", "3 BHK 2 floors", "Modern villa"];

export function BuildHero({ firstName }: { firstName: string }) {
  const router = useRouter();
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 px-8 py-7 text-white shadow-lg shadow-orange-500/20">
      <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-amber-300/30 blur-3xl" />
      <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-rose-400/20 blur-3xl" />

      <div className="relative grid items-center gap-6 md:grid-cols-[1fr,auto]">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-white/80">
            Welcome to Build Mode, {firstName} <HardHat className="h-4 w-4" />
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">
            Design &amp; build<br />your dream home
          </h1>
          <p className="mt-2 text-sm text-white/80">Sketch a plot → AI generates floor plans, 3D model, BOQ & cost.</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/house-builder")}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-orange-700 shadow-md transition-transform hover:scale-[1.02]"
            >
              <Upload className="h-4 w-4" /> Upload sketch / plot
            </button>
            <button
              onClick={() => router.push("/estimator")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur hover:bg-white/20"
            >
              <Sparkles className="h-4 w-4" /> AI Material Estimator
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => router.push(`/house-builder?prompt=${encodeURIComponent(c)}`)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur transition-colors hover:bg-white/20"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden md:block" aria-hidden>
          <HardHat className="h-32 w-32 text-white/90" />
        </div>
      </div>
    </section>
  );
}
