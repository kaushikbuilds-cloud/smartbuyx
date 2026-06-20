"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser, requireRole } from "@/lib/auth/guards";
import { rfqSchema, quoteSchema } from "./schemas";

export type RfqActionState = { error?: string; success?: string } | null;

// 1) Buyer posts one RFQ → system fans it out to top suppliers (one-click).
export async function createRfq(_prev: RfqActionState, formData: FormData): Promise<RfqActionState> {
  const { user } = await requireUser();
  const parsed = rfqSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const r = parsed.data;

  const categorySlugs = (r.categories ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  const supabase = await createClient();
  const { data: rfq, error } = await supabase
    .from("rfqs")
    .insert({
      buyer_id: user.id,
      title: r.title,
      description: r.description || null,
      pincode: r.pincode || null,
      budget_min: r.budgetMin ?? null,
      budget_max: r.budgetMax ?? null,
      categories: categorySlugs,
      pincodes: r.pincode ? [r.pincode] : [],
      status: "open",
    })
    .select("id")
    .single();
  if (error || !rfq) return { error: error?.message ?? "Failed to create RFQ." };

  // Fan out to top suppliers — admin bypass so we can target across users.
  const admin = createAdminClient();
  let q = admin.from("supplier_profiles").select("user_id, service_pincodes").limit(200);
  if (r.pincode) q = q.contains("service_pincodes", [r.pincode]);
  const { data: suppliers } = await q;

  // Rank by trust_score (separate small query keeps the contains() filter simple).
  const ids = (suppliers ?? []).map((s) => s.user_id);
  const { data: ranked } = await admin
    .from("supplier_profiles")
    .select("user_id, trust_score")
    .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
    .order("trust_score", { ascending: false })
    .limit(100);

  if (ranked && ranked.length > 0) {
    await admin.from("rfq_recipients").insert(
      ranked.map((s) => ({ rfq_id: rfq.id, supplier_id: s.user_id }))
    );
    await admin.from("rfqs").update({ target_supplier_count: ranked.length }).eq("id", rfq.id);

    // Notify each targeted supplier.
    await admin.from("notifications").insert(
      ranked.map((s) => ({
        user_id: s.user_id,
        kind: "rfq.new",
        payload: { rfq_id: rfq.id, title: r.title },
      }))
    );
  }

  revalidatePath("/rfq");
  redirect(`/rfq/${rfq.id}`);
}

// 2) Supplier quotes on an RFQ they received.
export async function submitQuote(_prev: RfqActionState, formData: FormData): Promise<RfqActionState> {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const parsed = quoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  // Ensure this supplier was actually targeted.
  const { data: recipient } = await supabase
    .from("rfq_recipients")
    .select("id")
    .eq("rfq_id", parsed.data.rfqId)
    .eq("supplier_id", user.id)
    .maybeSingle();
  if (!recipient) return { error: "You weren't targeted for this RFQ." };

  const { error } = await supabase.from("quotes").insert({
    rfq_id: parsed.data.rfqId,
    pro_id: user.id,
    amount: parsed.data.amount,
    message: parsed.data.message || null,
  });
  if (error) return { error: error.message };

  await supabase.from("rfqs").update({ status: "quoted" }).eq("id", parsed.data.rfqId);
  revalidatePath(`/rfq/${parsed.data.rfqId}`);
  return { success: "Quote sent to buyer." };
}
