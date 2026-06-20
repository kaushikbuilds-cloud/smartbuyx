import { createClient } from "@/lib/supabase/server";

export async function getWalletBalance(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  return Number(data?.balance ?? 0);
}

export async function getCartCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data: cart } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (!cart) return 0;
  const { count } = await supabase
    .from("cart_items")
    .select("id", { count: "exact", head: true })
    .eq("cart_id", cart.id);
  return count ?? 0;
}
