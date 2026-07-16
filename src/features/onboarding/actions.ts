"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";

export type ProApplicationState = { error?: string; success?: string } | null;

const applySchema = z.object({
  requestedRole: z.enum(["supplier", "architect", "contractor"]),
  businessName: z.string().min(2).max(120),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

// Buyer applies to become a pro (supplier/architect/contractor). Goes into
// pro_applications as 'pending' — an admin reviews and approves via
// reviewProApplication, which promotes profiles.role on approval.
export async function submitProApplication(_prev: ProApplicationState, formData: FormData): Promise<ProApplicationState> {
  const { user, role } = await requireUser();
  if (role !== "customer") return { error: "Only customer accounts can apply for a pro role." };

  const parsed = applySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("pro_applications")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return { error: "You already have a pending application." };

  const { error } = await supabase.from("pro_applications").insert({
    user_id: user.id,
    requested_role: parsed.data.requestedRole,
    business_name: parsed.data.businessName,
    notes: parsed.data.notes || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/customer/become-seller");
  return { success: "Application submitted! We'll review it within 24-48 hours." };
}

export async function getMyProApplication(userId: string) {
  const { user } = await requireUser();
  if (user.id !== userId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("pro_applications")
    .select("id, requested_role, business_name, status, created_at, reviewed_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
