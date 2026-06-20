import { createClient } from "@/lib/supabase/server";

export type RfqSummary = {
  id: string;
  title: string;
  status: string;
  pincode: string | null;
  target_supplier_count: number;
  created_at: string;
};

export type Quote = {
  id: string;
  pro_id: string;
  amount: number;
  message: string | null;
  accepted: boolean;
  created_at: string;
  supplier_name?: string;
  trust_score?: number;
};

export async function listMyRfqs(userId: string): Promise<RfqSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rfqs")
    .select("id, title, status, pincode, target_supplier_count, created_at")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as RfqSummary[];
}

export async function getRfq(id: string) {
  const supabase = await createClient();
  const { data: rfq } = await supabase
    .from("rfqs")
    .select("id, buyer_id, title, description, pincode, budget_min, budget_max, target_supplier_count, status, created_at")
    .eq("id", id)
    .single();
  return rfq;
}

export async function getQuotesForRfq(rfqId: string): Promise<Quote[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("id, pro_id, amount, message, accepted, created_at, supplier_profiles!quotes_pro_id_fkey(business_name, trust_score)")
    .eq("rfq_id", rfqId)
    .order("amount", { ascending: true });
  return (data ?? []).map((q) => {
    const sp = q.supplier_profiles as unknown as { business_name: string; trust_score: number } | null;
    return {
      id: q.id,
      pro_id: q.pro_id,
      amount: Number(q.amount),
      message: q.message,
      accepted: q.accepted,
      created_at: q.created_at,
      supplier_name: sp?.business_name,
      trust_score: sp?.trust_score,
    };
  });
}

export async function listSupplierRfqs(supplierId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rfq_recipients")
    .select("notified_at, viewed_at, rfqs!inner(id, title, pincode, budget_min, budget_max, status, created_at)")
    .eq("supplier_id", supplierId)
    .order("notified_at", { ascending: false });
  return (data ?? []).map((r) => {
    const rfq = r.rfqs as unknown as {
      id: string; title: string; pincode: string | null;
      budget_min: number | null; budget_max: number | null; status: string; created_at: string;
    };
    return { ...rfq, notified_at: r.notified_at, viewed_at: r.viewed_at };
  });
}
