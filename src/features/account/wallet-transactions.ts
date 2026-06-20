import { createClient } from "@/lib/supabase/server";

export type WalletTxn = {
  id: string;
  kind: "credit" | "debit" | "refund" | "cashback" | "payout";
  amount: number;
  reference: string | null;
  balance_after: number;
  created_at: string;
};

export async function listWalletTransactions(userId: string, limit = 50): Promise<WalletTxn[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("id, kind, amount, reference, balance_after, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => ({
    ...r,
    amount: Number(r.amount),
    balance_after: Number(r.balance_after),
  })) as WalletTxn[];
}
