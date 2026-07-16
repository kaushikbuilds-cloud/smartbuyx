import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type PoItem = {
  title: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  total: number;
};

export type PurchaseOrder = {
  id: string;
  po_number: string;
  title: string;
  supplier_id: string | null;
  supplier_name: string | null;
  items: PoItem[];
  subtotal: number;
  total: number;
  notes: string | null;
  status: string;
  created_at: string;
};

export async function listMyPurchaseOrders(userId: string): Promise<PurchaseOrder[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchase_orders")
    .select("id, po_number, title, supplier_id, items, subtotal, total, notes, status, created_at, supplier_profiles!purchase_orders_supplier_id_fkey(business_name)")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((po) => {
    const sp = po.supplier_profiles as unknown as { business_name: string } | null;
    return {
      id: po.id,
      po_number: po.po_number,
      title: po.title,
      supplier_id: po.supplier_id,
      supplier_name: sp?.business_name ?? null,
      items: (po.items ?? []) as PoItem[],
      subtotal: Number(po.subtotal),
      total: Number(po.total),
      notes: po.notes,
      status: po.status,
      created_at: po.created_at,
    };
  });
}

export async function getPurchaseOrder(userId: string, id: string): Promise<PurchaseOrder | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: po } = await supabase
    .from("purchase_orders")
    .select("id, po_number, title, supplier_id, items, subtotal, total, notes, status, created_at, supplier_profiles!purchase_orders_supplier_id_fkey(business_name)")
    .eq("id", id)
    .eq("buyer_id", userId)
    .maybeSingle();
  if (!po) return null;
  const sp = po.supplier_profiles as unknown as { business_name: string } | null;
  return {
    id: po.id,
    po_number: po.po_number,
    title: po.title,
    supplier_id: po.supplier_id,
    supplier_name: sp?.business_name ?? null,
    items: (po.items ?? []) as PoItem[],
    subtotal: Number(po.subtotal),
    total: Number(po.total),
    notes: po.notes,
    status: po.status,
    created_at: po.created_at,
  };
}
