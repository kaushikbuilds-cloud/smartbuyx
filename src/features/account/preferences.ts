"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";

export type Preferences = {
  notifications?: {
    order_updates?: boolean;
    price_drops?: boolean;
    wishlist_alerts?: boolean;
    promos?: boolean;
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  ui?: {
    language?: "en" | "hi" | "ta" | "te" | "kn" | "ml" | "bn" | "mr";
    currency?: "INR" | "USD";
    region?: string;
  };
  ai?: {
    recs_on?: boolean;
    brands?: string[];
    categories?: string[];
    budget_min?: number;
    budget_max?: number;
  };
  orders?: {
    delivery_window?: "anytime" | "morning" | "afternoon" | "evening";
    default_address_id?: string | null;
  };
};

export type PrefsActionState = { error?: string; success?: string } | null;

const accountSchema = z.object({
  full_name: z.string().min(2, "Name is too short").max(80),
  username: z
    .string()
    .regex(/^[a-z0-9_.]{3,24}$/i, "3-24 chars, letters/digits/_/. only")
    .optional()
    .or(z.literal("")),
  phone: z.string().regex(/^\+?\d{8,15}$/, "Enter a valid phone number").optional().or(z.literal("")),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

export async function updateAccount(_prev: PrefsActionState, formData: FormData): Promise<PrefsActionState> {
  const { user } = await requireUser();
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      username: parsed.data.username ? parsed.data.username.toLowerCase() : null,
      phone: parsed.data.phone || null,
      date_of_birth: parsed.data.date_of_birth || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  // Revalidate the whole app so the header greeting + avatar update everywhere.
  revalidatePath("/", "layout");
  return { success: "Saved." };
}

// Merge-style update: shallow-merge `patch` into preferences JSONB.
async function patchPreferences(patch: Preferences): Promise<PrefsActionState> {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: current } = await supabase.from("profiles").select("preferences").eq("id", user.id).single();
  const next: Preferences = { ...(current?.preferences ?? {}) };
  for (const key of Object.keys(patch) as (keyof Preferences)[]) {
    next[key] = { ...(next[key] as Record<string, unknown> | undefined), ...(patch[key] as Record<string, unknown>) };
  }
  const { error } = await supabase.from("profiles").update({ preferences: next }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/customer/settings", "layout");
  return { success: "Saved." };
}

const NOTIF_KEYS = ["order_updates", "price_drops", "wishlist_alerts", "promos", "email", "sms", "push"] as const;

export async function updateNotifications(_prev: PrefsActionState, formData: FormData): Promise<PrefsActionState> {
  const notifications: Preferences["notifications"] = {};
  for (const k of NOTIF_KEYS) notifications[k] = formData.get(k) === "on";
  return patchPreferences({ notifications });
}

export async function updateUiPrefs(_prev: PrefsActionState, formData: FormData): Promise<PrefsActionState> {
  type Ui = NonNullable<Preferences["ui"]>;
  const ui: Ui = {
    language: (formData.get("language") as Ui["language"]) ?? "en",
    currency: (formData.get("currency") as Ui["currency"]) ?? "INR",
    region: (formData.get("region") as string) || "IN",
  };
  return patchPreferences({ ui });
}

export async function updateAiPrefs(_prev: PrefsActionState, formData: FormData): Promise<PrefsActionState> {
  const ai: Preferences["ai"] = {
    recs_on: formData.get("recs_on") === "on",
    brands: ((formData.get("brands") as string) || "").split(",").map((s) => s.trim()).filter(Boolean),
    categories: ((formData.get("categories") as string) || "").split(",").map((s) => s.trim()).filter(Boolean),
    budget_min: Number(formData.get("budget_min")) || 0,
    budget_max: Number(formData.get("budget_max")) || 0,
  };
  return patchPreferences({ ai });
}

export async function updateOrderPrefs(_prev: PrefsActionState, formData: FormData): Promise<PrefsActionState> {
  type Orders = NonNullable<Preferences["orders"]>;
  const orders: Orders = {
    delivery_window: (formData.get("delivery_window") as Orders["delivery_window"]) ?? "anytime",
    default_address_id: (formData.get("default_address_id") as string) || null,
  };
  return patchPreferences({ orders });
}

export async function updateWishlistVisibility(_prev: PrefsActionState, formData: FormData): Promise<PrefsActionState> {
  const { user } = await requireUser();
  const wishlist_public = formData.get("wishlist_public") === "on";
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ wishlist_public }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/customer/settings", "layout");
  return { success: "Saved." };
}

export async function requestPasswordResetEmail(): Promise<PrefsActionState> {
  const { user } = await requireUser();
  if (!user.email) return { error: "No email on file." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/callback?next=/reset-password`,
  });
  if (error) return { error: error.message };
  return { success: "Password reset email sent." };
}
