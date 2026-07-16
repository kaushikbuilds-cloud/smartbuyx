"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser, requireRole } from "@/lib/auth/guards";
import { computeBuyerRisk } from "@/features/ai/fraud";

const RETURN_WINDOW_DAYS = 7;

// Returnless refund: low-value items from trusted buyers get an instant wallet
// refund with no pickup (cheaper than reverse logistics). Abusers are excluded.
const RETURNLESS_MAX_VALUE = 300; // ₹
const RETURNLESS_MAX_RISK = 30;   // buyer risk score must be below this

const initiateSchema = z.object({
  orderItemId: z.string().uuid(),
  reason: z.enum(["damaged", "wrong_item", "not_as_described", "size_fit", "no_longer_needed", "better_price", "other"]),
  notes: z.string().max(500).optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  wantsExchange: z.string().optional(), // checkbox: "on" when checked
});

export type ReturnActionState = { error?: string; success?: string } | null;

export async function initiateReturn(_prev: ReturnActionState, formData: FormData): Promise<ReturnActionState> {
  const { user } = await requireUser();
  const parsed = initiateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();

  // Validate: this order item belongs to the user, order is delivered, within window.
  const { data: item } = await supabase
    .from("order_items")
    .select("id, order_id, total, orders!inner(buyer_id, status, updated_at)")
    .eq("id", parsed.data.orderItemId)
    .single();
  if (!item) return { error: "Item not found." };

  const order = item.orders as unknown as { buyer_id: string; status: string; updated_at: string };
  if (order.buyer_id !== user.id) return { error: "Not your order." };
  if (order.status !== "delivered") return { error: "Only delivered items can be returned." };

  const deliveredAt = new Date(order.updated_at);
  const days = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
  if (days > RETURN_WINDOW_DAYS) return { error: `Return window of ${RETURN_WINDOW_DAYS} days has passed.` };

  // Decide returnless-refund eligibility: low value + trusted buyer + not the
  // reasons where we'd want the item back to inspect (damaged/wrong item can be
  // returnless too since they're low value, but keep quality issues reviewable).
  const amount = Number(item.total);
  const risk = await computeBuyerRisk(user.id);
  const wantsExchange = parsed.data.wantsExchange === "on";
  const trusted = risk.score < RETURNLESS_MAX_RISK && parsed.data.reason !== "better_price";
  const returnless = !wantsExchange && amount <= RETURNLESS_MAX_VALUE && trusted;
  // Instant exchange: same trust bar as returnless refund, but no value cap since
  // no cash leaves the platform — a replacement ships instead of a refund.
  const instantExchange = wantsExchange && trusted;

  const { data: created, error } = await supabase
    .from("return_requests")
    .insert({
      user_id: user.id,
      order_id: item.order_id,
      order_item_id: item.id,
      reason: parsed.data.reason,
      notes: parsed.data.notes || null,
      video_url: parsed.data.videoUrl || null,
      is_exchange: wantsExchange,
      amount,
      status: returnless || instantExchange ? "approved" : "requested",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (returnless && created) {
    // Instant refund to wallet, no pickup. The status trigger credits the wallet.
    const admin = createAdminClient();
    await admin.from("return_requests").update({ status: "refunded" }).eq("id", created.id);
    revalidatePath("/dashboard/customer/returns");
    revalidatePath("/wallet");
    revalidatePath(`/orders/${item.order_id}`);
    return { success: `Returnless refund approved! ₹${amount} credited to your wallet — keep the item.` };
  }

  if (instantExchange && created) {
    revalidatePath("/dashboard/customer/returns");
    revalidatePath(`/orders/${item.order_id}`);
    return { success: "Instant exchange approved — your replacement will ship automatically, no pickup needed." };
  }

  revalidatePath("/dashboard/customer/returns");
  revalidatePath(`/orders/${item.order_id}`);
  return { success: "Return requested. We'll review within 24 hours." };
}

export async function cancelReturn(id: string): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("return_requests")
    .update({ status: "cancelled", resolved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .in("status", ["requested", "approved"]);
  revalidatePath("/dashboard/customer/returns");
}

export type ReturnWithItem = {
  id: string;
  order_id: string;
  order_item_id: string;
  reason: string;
  status: string;
  amount: number;
  created_at: string;
  resolved_at: string | null;
  title: string;
};

export async function listMyReturns(userId: string): Promise<ReturnWithItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("return_requests")
    .select("id, order_id, order_item_id, reason, status, amount, created_at, resolved_at, order_items(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => {
    const item = row.order_items as unknown as { title: string };
    return {
      id: row.id,
      order_id: row.order_id,
      order_item_id: row.order_item_id,
      reason: row.reason,
      status: row.status,
      amount: Number(row.amount),
      created_at: row.created_at,
      resolved_at: row.resolved_at,
      title: item?.title ?? "Item",
    };
  });
}

export type SellerReturnRow = ReturnWithItem & {
  notes: string | null;
  video_url: string | null;
  is_exchange: boolean;
  disputed: boolean;
  seller_notes: string | null;
};

// Returns against this seller's products, newest first — feeds the seller dispute dashboard.
export async function listSellerReturns(sellerId: string): Promise<SellerReturnRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("return_requests")
    .select(
      "id, order_id, order_item_id, reason, status, amount, notes, video_url, is_exchange, disputed, seller_notes, created_at, resolved_at, order_items!inner(title, supplier_id)"
    )
    .eq("order_items.supplier_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((row) => {
    const item = row.order_items as unknown as { title: string };
    return {
      id: row.id,
      order_id: row.order_id,
      order_item_id: row.order_item_id,
      reason: row.reason,
      status: row.status,
      amount: Number(row.amount),
      notes: row.notes,
      video_url: row.video_url,
      is_exchange: row.is_exchange,
      disputed: row.disputed,
      seller_notes: row.seller_notes,
      created_at: row.created_at,
      resolved_at: row.resolved_at,
      title: item?.title ?? "Item",
    };
  });
}

const disputeSchema = z.object({
  returnId: z.string().uuid(),
  sellerNotes: z.string().min(1).max(500),
});

// A seller flags a return as contested (e.g. suspected abuse); admins resolve it from there.
export async function disputeReturn(_prev: ReturnActionState, formData: FormData): Promise<ReturnActionState> {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const parsed = disputeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("return_requests")
    .select("id, order_items!inner(supplier_id)")
    .eq("id", parsed.data.returnId)
    .single();
  const supplierId = (item?.order_items as unknown as { supplier_id: string } | undefined)?.supplier_id;
  if (!item || supplierId !== user.id) return { error: "Return not found." };

  const { error } = await supabase
    .from("return_requests")
    .update({ disputed: true, seller_notes: parsed.data.sellerNotes })
    .eq("id", parsed.data.returnId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/supplier/returns");
  return { success: "Marked as disputed. Our team will review it." };
}
