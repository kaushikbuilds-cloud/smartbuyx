"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name is too short").max(80),
  phone: z.string().regex(/^\+?\d{8,15}$/, "Enter a valid phone number").optional().or(z.literal("")),
});

export type ProfileActionState = { error?: string; success?: string } | null;

export async function updateProfile(_prev: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const { user } = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/customer", "layout");
  return { success: "Profile updated." };
}
