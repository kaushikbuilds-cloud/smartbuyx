import { Wallet as WalletIcon } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Wallet" };

export default async function WalletPage() {
  const { user } = await requireUser();
  const supabase = await createClient();

  const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
  const { data: txns } = await supabase
    .from("wallet_transactions")
    .select("id, kind, amount, reference, balance_after, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Wallet</h1>

      <Card className="mb-6">
        <CardContent className="flex items-center gap-4 p-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <WalletIcon className="h-7 w-7" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Available balance</p>
            <p className="text-3xl font-bold">{formatINR(Number(wallet?.balance ?? 0))}</p>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 font-semibold">Transactions</h2>
      {!txns || txns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No transactions yet.</p>
      ) : (
        <div className="space-y-2">
          {txns.map((t) => {
            const credit = ["credit", "refund", "cashback"].includes(t.kind);
            return (
              <Card key={t.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <Badge variant={credit ? "success" : "secondary"} className="capitalize">{t.kind}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={credit ? "font-semibold text-emerald-600" : "font-semibold"}>
                      {credit ? "+" : "−"} {formatINR(Number(t.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">Bal {formatINR(Number(t.balance_after))}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
