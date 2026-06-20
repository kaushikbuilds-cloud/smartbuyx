import { createClient } from "@/lib/supabase/server";
import type { Product } from "./types";

const PRODUCT_COLS =
  "id, supplier_id, category_id, kind, title, slug, description, brand, unit, base_price, compare_at_price, currency, images, attributes, status, rating_avg, rating_count, sales_count, is_featured, created_at";

export async function listWishlist(userId: string): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlist_items")
    .select(`product_id, products!inner(${PRODUCT_COLS})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => row.products as unknown as Product);
}

export async function getWishlistedIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("wishlist_items").select("product_id").eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.product_id));
}
