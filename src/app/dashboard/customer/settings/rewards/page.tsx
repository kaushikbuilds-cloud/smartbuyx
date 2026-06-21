import Link from "next/link";
import { Coins, Gift, Copy, Crown, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getWalletBalance } from "@/features/account/wallet-queries";
import { listWalletTransactions } from "@/features/account/wallet-transactions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SettingsSection, SettingsCard } from "@/components/dashboard/settings-section";
import { formatINR } from "@/lib/utils/format";

export const metadata = { title: "Rewards" };

export default async function RewardsSettingsPage() {
  const { user } = await requireUser();
  const [balance, txns] = await Promise.all([
    getWalletBalance(user.id),
    listWalletTransactions(user.id, 5),
  ]);

  const code = `SMART-${user.id.slice(0, 6).toUpperCase()}`;
  const link = `https://smartbuyx.in/?ref=${code}`;

  // Simple loyalty tier ladder.
  const tier =
    balance >= 5000 ? { label: "Platinum", color: "from-slate-700 to-slate-900" } :
    balance >= 2000 ? { label: "Gold", color: "from-amber-400 to-yellow-600" } :
    balance >= 500 ? { label: "Silver", color: "from-slate-300 to-slate-500" } :
                     { label: "Bronze", color: "from-orange-300 to-amber-500" };

  return (
    <SettingsSection title="Rewards &amp; Membership" description="Smart Coins, history and referrals.">
      <SettingsCard title="Smart Coins balance">
        <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
              <Coins className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold">{Math.round(balance).toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground">≈ {formatINR(balance)}</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/wallet">Open wallet <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title="Membership status">
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${tier.color} p-5 text-white`}>
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <Crown className="h-5 w-5" />
              <p className="mt-2 text-2xl font-bold">{tier.label}</p>
              <p className="text-xs text-white/80">Based on lifetime savings &amp; coins earned</p>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">Active</Badge>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Recent rewards history">
        {txns.length === 0 ? (
          <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">No rewards yet — refer a friend to earn 100 coins.</p>
        ) : (
          <ul className="divide-y">
            {txns.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <span className="capitalize">{t.kind}</span>
                <span className={t.kind === "debit" || t.kind === "payout" ? "text-rose-600" : "text-emerald-600"}>
                  {(t.kind === "debit" || t.kind === "payout") ? "−" : "+"}{formatINR(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>

      <SettingsCard title="Referral code" description="Earn 100 coins per friend who shops.">
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3 font-mono">
            <span className="flex-1 text-lg font-bold">{code}</span>
            <Button size="sm" variant="outline"><Copy className="h-4 w-4" /> Copy</Button>
          </div>
          <p className="truncate text-xs text-muted-foreground">{link}</p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/dashboard/customer/invite"><Gift className="h-4 w-4" /> Share invite</Link>
        </Button>
      </SettingsCard>
    </SettingsSection>
  );
}
