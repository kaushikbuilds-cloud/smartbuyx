import Link from "next/link";
import { CreditCard, CheckCircle2, ShieldCheck, Coins, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listPaymentMethods } from "@/features/account/payment-methods";
import { getWalletBalance } from "@/features/account/wallet-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SettingsSection, SettingsCard } from "@/components/dashboard/settings-section";
import { UpiForm } from "@/components/shop/upi-form";
import { PaymentMethodRowActions } from "@/components/shop/payment-method-row-actions";
import { formatINR } from "@/lib/utils/format";

export const metadata = { title: "Payments" };

export default async function PaymentSettingsPage() {
  const { user } = await requireUser();
  const [methods, balance] = await Promise.all([
    listPaymentMethods(user.id),
    getWalletBalance(user.id),
  ]);

  return (
    <SettingsSection title="Payments" description="Saved UPI IDs, wallet, and refund preferences.">
      <SettingsCard title="Saved UPI IDs">
        {methods.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <CreditCard className="h-10 w-10" />
            <p>No UPI saved yet.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {methods.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                  <CreditCard className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.label ?? m.upi_id ?? m.kind.toUpperCase()}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.upi_id}</p>
                </div>
                {m.is_default ? (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Default
                  </Badge>
                ) : null}
                <PaymentMethodRowActions id={m.id} isDefault={m.is_default} />
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>

      <SettingsCard title="Add UPI">
        <UpiForm />
        <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <p>We never store card numbers or CVVs. Card payments are tokenized through Razorpay automatically.</p>
        </div>
      </SettingsCard>

      <SettingsCard title="Wallet balance">
        <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
              <Coins className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold">{formatINR(balance)}</p>
              <p className="text-xs text-muted-foreground">{Math.round(balance).toLocaleString("en-IN")} Smart Coins</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/wallet">View transactions <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard title="Auto refund method" description="Where we send your money on returns.">
        <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
          Refunds always credit to your SmartBuyX <strong>wallet</strong> within 24 hours of pickup. You can withdraw anytime to your default UPI ID — coming with our payouts module.
        </p>
      </SettingsCard>
    </SettingsSection>
  );
}
