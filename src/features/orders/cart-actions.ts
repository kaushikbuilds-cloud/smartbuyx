"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/guards";

export type CartActionResult = { error?: string } | void;

async function getOrCreateCartId(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("carts").select("id").eq("user_id", userId).single();
  if (existing) return existing.id;
  const { data: created } = await supabase.from("carts").insert({ user_id: userId }).select("id").single();
  return created!.id;
}

export async function addToCart(variantId: string, quantity = 1): Promise<CartActionResult> {
  const session = await getSession();
  if (!session) return { error: "Please log in to add items to your cart." };

  const supabase = await createClient();
  const cartId = await getOrCreateCartId(session.user.id);

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("variant_id", variantId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("cart_items")
      .insert({ cart_id: cartId, variant_id: variantId, quantity });
    if (error) return { error: error.message };
  }

  revalidatePath("/cart");
}

export async function updateCartItem(itemId: string, quantity: number): Promise<CartActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };
  const supabase = await createClient();

  if (quantity <= 0) {
    await supabase.from("cart_items").delete().eq("id", itemId);
  } else {
    await supabase.from("cart_items").update({ quantity }).eq("id", itemId);
  }
  revalidatePath("/cart");
}

export async function removeCartItem(itemId: string): Promise<CartActionResult> {
  const session = await getSession();
  if (!session) return { error: "Not authenticated." };
  const supabase = await createClient();
  await supabase.from("cart_items").delete().eq("id", itemId);
  revalidatePath("/cart");
}
