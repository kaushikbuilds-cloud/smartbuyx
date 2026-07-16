"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";

const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/;

const upiSchema = z.object({
  label: z.string().max(40).optional().or(z.literal("")),
  upi_id: z.string().regex(upiRegex, "Enter a valid UPI ID like name@upi"),
});

export type PaymentMethodState = { error?: string; success?: string } | null;

export async function addUpi(_prev: PaymentMethodState, formData: FormData): Promise<PaymentMethodState> {
  const { user } = await requireUser();
  const parsed = upiSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("payment_methods")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("kind", "upi");

  const { error } = await supabase.from("payment_methods").insert({
    user_id: user.id,
    kind: "upi",
    label: parsed.data.label || null,
    upi_id: parsed.data.upi_id.toLowerCase(),
    is_default: (count ?? 0) === 0,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/customer/payments");
  return { success: "UPI saved." };
}

export async function deletePaymentMethod(id: string): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createClient();
  await supabase.from("payment_methods").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/customer/payments");
}

export async function setDefaultPaymentMethod(id: string): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createClient();
  await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user.id);
  await supabase.from("payment_methods").update({ is_default: true }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/customer/payments");
}

export type SavedPaymentMethod = {
  id: string;
  kind: "upi" | "cod" | "card_token";
  label: string | null;
  upi_id: string | null;
  is_default: boolean;
  created_at: string;
};

export async function listPaymentMethods(userId: string): Promise<SavedPaymentMethod[]> {
  const { user } = await requireUser();
  if (user.id !== userId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_methods")
    .select("id, kind, label, upi_id, is_default, created_at")
    .eq("user_id", userId)
    .order("is_default", { ascending: false });
  return (data ?? []) as SavedPaymentMethod[];
}
