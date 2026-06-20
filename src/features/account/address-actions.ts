"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";

const addressSchema = z.object({
  label: z.string().max(40).optional().or(z.literal("")),
  line1: z.string().min(3, "Address line 1 is required"),
  line2: z.string().max(120).optional().or(z.literal("")),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

export type AddressActionState = { error?: string; success?: string } | null;

export async function addAddress(_prev: AddressActionState, formData: FormData): Promise<AddressActionState> {
  const { user } = await requireUser();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { error } = await supabase.from("addresses").insert({
    user_id: user.id,
    ...parsed.data,
    label: parsed.data.label || null,
    line2: parsed.data.line2 || null,
    is_default: (count ?? 0) === 0,
  });
  if (error) return { error: error.message };

  revalidatePath("/checkout");
  return { success: "Address added." };
}

export async function setDefaultAddress(id: string): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createClient();
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  await supabase.from("addresses").update({ is_default: true }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/checkout");
}

export async function deleteAddress(id: string): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createClient();
  await supabase.from("addresses").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/checkout");
}
