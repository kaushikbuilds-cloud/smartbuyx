import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { RefurbishedListing } from "./types";

const SELLER_COLS =
  "id, title, slug, brand, base_price, compare_at_price, images, status, refurbished_details(condition_grade, battery_health, warranty_months, accessories_included, qc_status, qc_notes)";

type Row = Omit<RefurbishedListing, "condition_grade" | "battery_health" | "warranty_months" | "accessories_included" | "qc_status" | "qc_notes"> & {
  refurbished_details: {
    condition_grade: RefurbishedListing["condition_grade"];
    battery_health: number | null;
    warranty_months: number;
    accessories_included: string | null;
    qc_status: RefurbishedListing["qc_status"];
    qc_notes: string | null;
  } | null;
};

function flatten(row: Row): RefurbishedListing {
  const d = row.refurbished_details;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    brand: row.brand,
    base_price: Number(row.base_price),
    compare_at_price: row.compare_at_price ? Number(row.compare_at_price) : null,
    images: row.images ?? [],
    status: row.status,
    condition_grade: d?.condition_grade ?? "good",
    battery_health: d?.battery_health ?? null,
    warranty_months: d?.warranty_months ?? 0,
    accessories_included: d?.accessories_included ?? null,
    qc_status: d?.qc_status ?? "pending",
    qc_notes: d?.qc_notes ?? null,
  };
}

// Seller's own refurbished listings, any QC status (their own dashboard).
export async function getMyRefurbishedProducts(sellerId: string): Promise<RefurbishedListing[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(SELLER_COLS)
    .eq("supplier_id", sellerId)
    .eq("is_refurbished", true)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as Row[]).map(flatten);
}

export type RefurbishedEditData = RefurbishedListing & { description: string | null; serial_or_imei: string };

// For the edit form -- includes the seller-only serial/IMEI field.
export async function getMyRefurbishedProduct(sellerId: string, id: string): Promise<RefurbishedEditData | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(`${SELLER_COLS}, description, refurbished_serials(serial_or_imei)`)
    .eq("id", id)
    .eq("supplier_id", sellerId)
    .eq("is_refurbished", true)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as Row & { description: string | null; refurbished_serials: { serial_or_imei: string } | null };
  return { ...flatten(row), description: row.description, serial_or_imei: row.refurbished_serials?.serial_or_imei ?? "" };
}

const PUBLIC_COLS =
  "id, title, slug, brand, base_price, compare_at_price, images, status, refurbished_details!inner(condition_grade, battery_health, warranty_months, accessories_included, qc_status, qc_notes)";

// Customer-facing: only QC-passed, active listings (RLS on refurbished_details
// already restricts to qc_status='passed' for non-owner/admin reads, but the
// explicit filters here keep the query self-documenting and correct even if
// RLS is bypassed by a service-role caller elsewhere).
export async function getRefurbishedListings(limit = 24): Promise<RefurbishedListing[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PUBLIC_COLS)
    .eq("is_refurbished", true)
    .eq("status", "active")
    .eq("refurbished_details.qc_status", "passed")
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as Row[]).map(flatten);
}

// Condition report for the product detail page -- returns null for
// pending/failed items (RLS hides those from non-owners automatically).
export async function getRefurbishedDetails(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("refurbished_details")
    .select("condition_grade, battery_health, warranty_months, accessories_included, qc_status")
    .eq("product_id", productId)
    .maybeSingle();
  return data;
}
