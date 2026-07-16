import { createClient } from "@/lib/supabase/server";

export type SupplierListItem = {
  user_id: string;
  business_name: string;
  bio: string | null;
  rating_avg: number;
  rating_count: number;
  trust_score: number;
  gstin_verified: boolean;
  verified_business: boolean;
  isLocal: boolean;
};

// Local Supplier Marketplace: suppliers who service the buyer's pincode rank
// first (isLocal), everyone else follows, both ordered by trust score.
export async function listSuppliers(nearPincode?: string | null, localOnly = false): Promise<SupplierListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("supplier_profiles")
    .select("user_id, business_name, bio, rating_avg, rating_count, trust_score, gstin_verified, verified_business, service_pincodes")
    .order("trust_score", { ascending: false })
    .limit(100);
  if (nearPincode && localOnly) query = query.contains("service_pincodes", [nearPincode]);

  const { data } = await query;
  const rows = (data ?? []) as (SupplierListItem & { service_pincodes: string[] | null })[];
  const mapped = rows.map(({ service_pincodes, ...rest }) => ({
    ...rest,
    isLocal: Boolean(nearPincode && service_pincodes?.includes(nearPincode)),
  }));
  return mapped.sort((a, b) => Number(b.isLocal) - Number(a.isLocal)).slice(0, 50);
}

// The buyer's default (or most recent) delivery pincode, used to surface local suppliers.
export async function getBuyerPincode(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("addresses")
    .select("pincode")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.pincode ?? null;
}

export async function getSupplier(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_profiles")
    .select("user_id, business_name, bio, gstin, service_pincodes, rating_avg, rating_count, trust_score, gstin_verified, verified_business, business_started_on, avg_response_minutes")
    .eq("user_id", userId)
    .single();
  return data;
}
