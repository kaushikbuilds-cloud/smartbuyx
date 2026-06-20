import Link from "next/link";
import { Gift, ArrowRight } from "lucide-react";

export function InviteBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 p-5 text-white shadow-lg shadow-purple-600/20">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Gift className="h-8 w-8" />
          <div>
            <h3 className="font-bold">Invite Friends &amp; Earn Smart Coins!</h3>
            <p className="text-sm text-white/80">Share SmartBuyX with your friends and earn exciting rewards</p>
          </div>
        </div>
        <Link
          href="/dashboard/customer/invite"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-purple-700 transition-transform hover:scale-[1.03]"
        >
          Invite Now <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
