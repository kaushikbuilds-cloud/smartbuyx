import { createClient } from "@/lib/supabase/server";

export type Address = {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
};

export async function listAddresses(userId: string): Promise<Address[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("addresses")
    .select("id, label, line1, line2, city, state, pincode, country, is_default")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });
  return (data ?? []) as Address[];
}
