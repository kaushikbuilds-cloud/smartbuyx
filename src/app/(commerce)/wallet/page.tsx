import Link from "next/link";
import { Coins, ArrowDownLeft, ArrowUpRight, Gift, RotateCcw, Wallet, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getWalletBalance } from "@/features/account/wallet-queries";
import { listWalletTransactions, type WalletTxn } from "@/features/account/wallet-transactions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/dashboard/page-shell";
import { formatINR } from "@/lib/utils/format";

export const metadata = { title: "Smart Coins" };

const TXN_META: Record<WalletTxn["kind"], { label: string; color: string; Icon: typeof Coins; sign: 1 | -1 }> = {
  credit: { label: "Credit", color: "text-emerald-600", Icon: ArrowDownLeft, sign: 1 },
  refund: { label: "Refund", color: "text-emerald-600", Icon: RotateCcw, sign: 1 },
  cashback: { label: "Cashback", color: "text-amber-600", Icon: Gift, sign: 1 },
  debit: { label: "Debit", color: "text-rose-600", Icon: ArrowUpRight, sign: -1 },
  payout: { label: "Payout", color: "text-rose-600", Icon: ArrowUpRight, sign: -1 },
};

export default async function WalletPage() {
  const { user } = await requireUser();
  const [balance, txns] = await Promise.all([
    getWalletBalance(user.id),
    listWalletTransactions(user.id),
  ]);

  return (
    <PageShell title="Smart Coins" description="Your in-app wallet and reward balance.">
      {/* Hero balance card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#1a0d3b] via-[#2d1465] to-[#1a0d3b] text-white">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <CardContent className="relative grid items-center gap-4 p-6 md:grid-cols-[1fr,auto]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
                <Coins className="h-4 w-4" />
              </span>
              <p className="font-semibold">Available balance</p>
            </div>
            <p className="mt-3 text-4xl font-bold">{Math.round(balance).toLocaleString("en-IN")}</p>
            <p className="text-sm text-white/60">≈ {formatINR(balance)} · 1 Coin = ₹1</p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="bg-white text-purple-700 hover:bg-white/90" asChild>
                <Link href="/products">Shop with coins</Link>
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                <Link href="/dashboard/customer/invite"><Gift className="h-4 w-4" /> Earn more</Link>
              </Button>
            </div>
          </div>
          <Wallet className="hidden h-24 w-24 text-fuchsia-300/80 md:block" />
        </CardContent>
      </Card>

      {/* Ways to earn */}
      <section>
        <h2 className="mb-3 font-semibold">Ways to earn</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardContent className="space-y-2 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
                <Gift className="h-4 w-4" />
              </span>
              <p className="font-semibold">Invite friends</p>
              <p className="text-xs text-muted-foreground">Get 100 coins per friend who shops.</p>
              <Button variant="outline" size="sm" asChild><Link href="/dashboard/customer/invite">Get your code</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="font-semibold">Review products</p>
              <p className="text-xs text-muted-foreground">Earn coins for verified-purchase reviews.</p>
              <Button variant="outline" size="sm" asChild><Link href="/dashboard/customer/reviews">My reviews</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
                <RotateCcw className="h-4 w-4" />
              </span>
              <p className="font-semibold">Refunds &amp; cashback</p>
              <p className="text-xs text-muted-foreground">Auto-credited to your wallet.</p>
              <Button variant="outline" size="sm" asChild><Link href="/dashboard/customer/returns">Returns</Link></Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Transactions */}
      <section>
        <h2 className="mb-3 font-semibold">Transactions</h2>
        {txns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
              <Coins className="h-10 w-10" />
              <p className="text-sm">No transactions yet. Earn coins via referrals, reviews, and refunds.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y p-0">
              {txns.map((t) => {
                const meta = TXN_META[t.kind];
                return (
                  <div key={t.id} className="flex items-center gap-4 p-4">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-muted ${meta.color}`}>
                      <meta.Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {t.reference ? ` · ref ${t.reference.slice(0, 8)}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${meta.color}`}>{meta.sign > 0 ? "+" : "−"}{formatINR(t.amount)}</p>
                      <Badge variant="secondary" className="text-[10px]">Bal {formatINR(t.balance_after)}</Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </section>
    </PageShell>
  );
}
