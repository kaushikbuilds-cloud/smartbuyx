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
};

export async function listSuppliers(): Promise<SupplierListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_profiles")
    .select("user_id, business_name, bio, rating_avg, rating_count, trust_score, gstin_verified, verified_business")
    .order("trust_score", { ascending: false })
    .limit(50);
  return (data ?? []) as SupplierListItem[];
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
