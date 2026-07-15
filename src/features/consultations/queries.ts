import { createClient } from "@/lib/supabase/server";

export type ConsultationRow = {
  id: string;
  customerId: string;
  proId: string;
  proRole: string;
  scheduledAt: string;
  mode: string;
  status: string;
  notes: string | null;
  counterpartyName: string | null;
};

export async function getMyConsultations(userId: string): Promise<ConsultationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("consultations")
    .select("id, customer_id, pro_id, pro_role, scheduled_at, mode, status, notes")
    .or(`customer_id.eq.${userId},pro_id.eq.${userId}`)
    .order("scheduled_at", { ascending: true });

  const rows = data ?? [];
  const counterpartyIds = [...new Set(rows.map((r) => (r.customer_id === userId ? r.pro_id : r.customer_id)))];
  const { data: profiles } = counterpartyIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", counterpartyIds)
    : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name] as const));

  return rows.map((r) => ({
    id: r.id,
    customerId: r.customer_id,
    proId: r.pro_id,
    proRole: r.pro_role,
    scheduledAt: r.scheduled_at,
    mode: r.mode,
    status: r.status,
    notes: r.notes,
    counterpartyName: nameById.get(r.customer_id === userId ? r.pro_id : r.customer_id) ?? null,
  }));
}
