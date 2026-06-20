import Link from "next/link";
import { Coins, ArrowRight, Gift } from "lucide-react";

export function SmartCoinsCard({ balance }: { balance: number }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0d3b] via-[#2d1465] to-[#1a0d3b] p-5 text-white shadow-xl shadow-purple-900/30">
      {/* Decorative glow */}
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
            <Coins className="h-4 w-4" />
          </span>
          <h3 className="font-semibold">Smart Coins</h3>
        </div>

        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-bold">{balance.toLocaleString("en-IN")}</p>
            <p className="text-xs text-white/60">Available Balance</p>
          </div>
          <Gift className="h-12 w-12 text-fuchsia-300/80" />
        </div>

        <Link
          href="/wallet"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-600 px-4 py-2 text-sm font-medium shadow-lg shadow-purple-500/30 transition-transform hover:scale-[1.02]"
        >
          View Rewards Store <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
