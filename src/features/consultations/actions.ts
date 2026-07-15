"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import type { UserRole } from "@/types/auth";

export type ConsultationActionState = { error?: string; success?: string } | null;

const schema = z.object({
  proId: z.string().uuid(),
  proRole: z.string(),
  scheduledAt: z.string().min(1, "Pick a date & time"),
  mode: z.enum(["video", "in_person", "chat"]).default("video"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function requestConsultation(_prev: ConsultationActionState, formData: FormData): Promise<ConsultationActionState> {
  const { user } = await requireUser();
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;

  const scheduledDate = new Date(p.scheduledAt);
  if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
    return { error: "Pick a valid future date & time." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("consultations").insert({
    customer_id: user.id,
    pro_id: p.proId,
    pro_role: p.proRole as UserRole,
    scheduled_at: scheduledDate.toISOString(),
    mode: p.mode,
    notes: p.notes || null,
    status: "scheduled",
  });
  if (error) return { error: error.message };

  await supabase.from("notifications").insert({
    user_id: p.proId,
    kind: "consultation.requested",
    payload: { customer_id: user.id, scheduled_at: scheduledDate.toISOString() },
  });

  revalidatePath("/dashboard/customer/consultations");
  return { success: "Consultation requested — you'll be notified once confirmed." };
}

export async function cancelConsultation(id: string): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createClient();
  await supabase
    .from("consultations")
    .update({ status: "cancelled" })
    .eq("id", id)
    .or(`customer_id.eq.${user.id},pro_id.eq.${user.id}`);
  revalidatePath("/dashboard/customer/consultations");
}
