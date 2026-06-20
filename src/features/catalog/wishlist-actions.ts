"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/guards";

export async function toggleWishlist(productId: string): Promise<{ wishlisted: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { wishlisted: false, error: "Please log in to save items." };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlist_items").delete().eq("id", existing.id);
    revalidatePath("/wishlist");
    return { wishlisted: false };
  }

  const { error } = await supabase.from("wishlist_items").insert({ user_id: session.user.id, product_id: productId });
  if (error) return { wishlisted: false, error: error.message };
  revalidatePath("/wishlist");
  return { wishlisted: true };
}
