"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import type { PoItem } from "./queries";

export type PoActionState = { error?: string; success?: string; poId?: string } | null;

const itemSchema = z.object({
  title: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().nullable().optional(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

const createSchema = z.object({
  title: z.string().min(2).max(120),
  items: z.array(itemSchema).min(1),
  supplierId: z.string().uuid().nullable().optional(),
  rfqId: z.string().uuid().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export type CreatePoInput = z.infer<typeof createSchema>;

// Persist a purchase order (typically drafted by the AI procurement assistant,
// confirmed by the buyer). Server recomputes totals — never trusts client sums.
export async function createPurchaseOrder(input: CreatePoInput): Promise<PoActionState> {
  const { user } = await requireUser();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const items: PoItem[] = parsed.data.items.map((i) => ({
    title: i.title,
    quantity: i.quantity,
    unit: i.unit ?? null,
    unitPrice: i.unitPrice,
    total: Math.round(i.quantity * i.unitPrice * 100) / 100,
  }));
  const subtotal = Math.round(items.reduce((s, i) => s + i.total, 0) * 100) / 100;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({
      buyer_id: user.id,
      supplier_id: parsed.data.supplierId ?? null,
      rfq_id: parsed.data.rfqId ?? null,
      title: parsed.data.title,
      items,
      subtotal,
      total: subtotal,
      notes: parsed.data.notes ?? null,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/dashboard/customer/procurement");
  return { success: "Purchase order created.", poId: data.id };
}

const statusSchema = z.object({
  poId: z.string().uuid(),
  status: z.enum(["sent", "cancelled"]),
});

// Buyer sends a draft PO to the supplier, or cancels it.
export async function updatePoStatus(_prev: PoActionState, formData: FormData): Promise<PoActionState> {
  const { user } = await requireUser();
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_orders")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.poId)
    .eq("buyer_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/customer/procurement");
  revalidatePath(`/dashboard/customer/procurement/${parsed.data.poId}`);
  return { success: parsed.data.status === "sent" ? "Sent to supplier." : "Cancelled." };
}
