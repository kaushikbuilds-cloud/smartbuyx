import Link from "next/link";
import { Scale, HardHat, ArrowRight } from "lucide-react";

export function PromoBannersRow() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {/* AI Compare Products */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-500 p-6 text-white shadow-lg shadow-purple-600/20">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <h3 className="text-xl font-bold">AI Compare Products</h3>
          <p className="mt-1 text-sm text-white/85">Compare any product &amp; find the best one for you</p>
          <ul className="mt-3 space-y-1 text-xs text-white/80">
            <li>✓ Best Price</li>
            <li>✓ Top Features</li>
            <li>✓ User Ratings</li>
          </ul>
          <Link
            href="/dashboard/customer/compare"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-purple-700 shadow-md transition-transform hover:scale-[1.02]"
          >
            Compare Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <Scale className="absolute right-6 top-6 h-16 w-16 text-white/30" aria-hidden />
      </div>

      {/* Build Cost Estimator */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 p-6 text-white shadow-lg shadow-blue-600/20">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <h3 className="text-xl font-bold">Build Cost Estimator</h3>
          <p className="mt-1 text-sm text-white/85">Plan your construction smartly with accurate material calculation</p>
          <Link
            href="/cost-calculator"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-md transition-transform hover:scale-[1.02]"
          >
            Calculate Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <HardHat className="absolute right-6 top-6 h-16 w-16 text-white/30" aria-hidden />
      </div>
    </section>
  );
}
