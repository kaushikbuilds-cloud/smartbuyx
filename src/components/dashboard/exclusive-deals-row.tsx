import Link from "next/link";
import { PartyPopper, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ExclusiveDealsRow({ smartCoins }: { smartCoins: number }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
      {/* Exclusive deals */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 p-5 text-white shadow-md shadow-purple-600/20">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold">
              Exclusive Deals for You <PartyPopper className="h-5 w-5 text-amber-300" />
            </h3>
            <p className="mt-1 text-sm text-white/80">Grab the best offers handpicked just for you!</p>
            <Button asChild variant="secondary" className="mt-3 bg-white text-purple-700 hover:bg-white/90">
              <Link href="/products?sort=rating">Explore Deals</Link>
            </Button>
          </div>
          <div className="hidden text-6xl md:block" aria-hidden>🎁</div>
        </div>
      </div>

      {/* Smart Coins */}
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex-1">
            <h3 className="font-semibold">Smart Coins</h3>
            <p className="text-xs text-muted-foreground">You have {smartCoins.toLocaleString("en-IN")} Coins</p>
            <Button size="sm" variant="outline" className="mt-3" asChild>
              <Link href="/wallet">View Rewards Store</Link>
            </Button>
          </div>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-400/30">
            <Coins className="h-7 w-7" />
          </span>
        </CardContent>
      </Card>
    </section>
  );
}
