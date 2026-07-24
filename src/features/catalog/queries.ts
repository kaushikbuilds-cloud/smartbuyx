import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ListingKind, Product, ProductVariant, Review } from "./types";

const PRODUCT_COLS =
  "id, supplier_id, category_id, kind, title, slug, description, brand, unit, base_price, compare_at_price, currency, images, attributes, status, rating_avg, rating_count, sales_count, is_featured, created_at, model_glb_url, model_usdz_url, is_refurbished";

export type ListParams = {
  kind?: ListingKind;
  q?: string;
  categoryId?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "rating";
  limit?: number;
  offset?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
};

export async function listProducts(params: ListParams = {}) {
  if (!isSupabaseConfigured()) return { products: [] as Product[], total: 0 };
  const { kind = "product", q, categoryId, sort = "newest", limit = 24, offset = 0, minPrice, maxPrice, minRating } = params;
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_COLS, { count: "exact" })
    .eq("status", "active")
    .eq("kind", kind);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (q) query = query.textSearch("search_tsv", q, { type: "websearch", config: "simple" });
  if (minPrice && minPrice > 0) query = query.gte("base_price", minPrice);
  if (maxPrice && maxPrice > 0) query = query.lte("base_price", maxPrice);
  if (minRating && minRating > 0) query = query.gte("rating_avg", minRating);

  switch (sort) {
    case "price_asc": query = query.order("base_price", { ascending: true }); break;
    case "price_desc": query = query.order("base_price", { ascending: false }); break;
    case "rating": query = query.order("rating_avg", { ascending: false }); break;
    default: query = query.order("created_at", { ascending: false });
  }

  try {
    const { data, count, error } = await query.range(offset, offset + limit - 1);
    if (error) return { products: [] as Product[], total: 0 };
    return { products: (data ?? []) as unknown as Product[], total: count ?? 0 };
  } catch {
    return { products: [] as Product[], total: 0 };
  }
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLS)
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data as unknown as Product;
}

export async function getProductVariants(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_variants")
    .select("id, product_id, sku, options, price, inventory(quantity)")
    .eq("product_id", productId)
    .order("price", { ascending: true });
  return (data ?? []).map((v) => {
    const inv = v.inventory as unknown as { quantity: number } | { quantity: number }[] | null;
    const quantity = Array.isArray(inv) ? (inv[0]?.quantity ?? 0) : (inv?.quantity ?? 0);
    return { ...v, stock: quantity } as unknown as ProductVariant & { stock: number };
  });
}

export async function listCategories(kind: ListingKind) {
  if (!isSupabaseConfigured()) return [] as { id: string; name: string; slug: string }[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("kind", kind)
    .order("name", { ascending: true });
  return (data ?? []) as { id: string; name: string; slug: string }[];
}

export async function getProductReviews(productId: string, limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, author_id, rating, title, comment, verified_purchase, helpful_count, created_at")
    .eq("target_type", "product")
    .eq("target_id", productId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Review[];
}

export async function getTrending(limit = 8) {
  if (!isSupabaseConfigured()) return [] as Product[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLS)
    .eq("status", "active")
    .order("sales_count", { ascending: false })
    .order("rating_avg", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Product[];
}

export async function getFeatured(limit = 8) {
  if (!isSupabaseConfigured()) return [] as Product[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLS)
    .eq("status", "active")
    .eq("is_featured", true)
    .limit(limit);
  return (data ?? []) as unknown as Product[];
}

// Products with a 3D model uploaded -- powers the "AR Try Room" listing.
export async function getArEnabledProducts(limit = 24) {
  if (!isSupabaseConfigured()) return [] as Product[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLS)
    .eq("status", "active")
    .not("model_glb_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Product[];
}

export async function getSellerProducts(sellerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLS)
    .eq("supplier_id", sellerId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as Product[];
}

export async function getSellerProduct(sellerId: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_COLS)
    .eq("supplier_id", sellerId)
    .eq("id", id)
    .single();
  return (data ?? null) as unknown as Product | null;
}
