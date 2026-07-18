"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";

export type ProApplicationState = { error?: string; success?: string } | null;

const BUSINESS_TYPES = ["individual", "sole_proprietorship", "partnership", "private_limited", "llp", "other"] as const;
const CATEGORIES = ["electronics", "fashion", "home_kitchen", "beauty", "books", "grocery", "construction", "other"] as const;

const optionalStr = (max: number) => z.string().max(max).optional().or(z.literal(""));

const applySchema = z.object({
  requestedRole: z.enum(["supplier", "architect", "contractor"]),
  businessName: z.string().min(2, "Store name is required").max(120),
  phone: z.string().min(6, "A contact number is required").max(20),
  businessType: z.enum(BUSINESS_TYPES, { message: "Select a business type" }),
  category: z.enum(CATEGORIES, { message: "Select a primary category" }),
  gstin: optionalStr(20),
  yearsInBusiness: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(0).max(200).optional()
  ),
  description: z.string().min(10, "Tell customers a little about your store").max(1000),
  website: optionalStr(200),
  addressLine1: z.string().min(3, "Address is required").max(200),
  addressLine2: optionalStr(200),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  postalCode: z.string().min(3, "Postal code is required").max(12),
  country: z.string().min(2).max(60).default("IN"),
  termsAccepted: z.literal("on", { message: "You must accept the seller terms to continue" }),
  notes: optionalStr(1000),
});

// Buyer applies to become a pro (supplier/architect/contractor). Goes into
// pro_applications as 'pending' — an admin reviews and approves via
// reviewProApplication, which promotes profiles.role on approval.
export async function submitProApplication(_prev: ProApplicationState, formData: FormData): Promise<ProApplicationState> {
  const { user, role } = await requireUser();
  // 'buyer' is a legacy DB value not in the UserRole type (the default wasn't
  // corrected until migration 0016) — some sessions may still carry it in
  // their JWT until they next log in. Cast to compare against it so legacy
  // accounts aren't blocked from applying.
  if (role !== "customer" && (role as string) !== "buyer") {
    return { error: "Only customer accounts can apply for a pro role." };
  }

  const parsed = applySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("pro_applications")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["pending", "under_review"])
    .maybeSingle();
  if (existing) return { error: "You already have an application in progress." };

  const d = parsed.data;
  const { error } = await supabase.from("pro_applications").insert({
    user_id: user.id,
    requested_role: d.requestedRole,
    business_name: d.businessName,
    phone: d.phone,
    business_type: d.businessType,
    category: d.category,
    gstin: d.gstin || null,
    years_in_business: typeof d.yearsInBusiness === "number" ? d.yearsInBusiness : null,
    description: d.description,
    website: d.website || null,
    address_line1: d.addressLine1,
    address_line2: d.addressLine2 || null,
    city: d.city,
    state: d.state,
    postal_code: d.postalCode,
    country: d.country || "IN",
    terms_accepted: true,
    notes: d.notes || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/customer/become-seller");
  revalidatePath("/dashboard/admin/suppliers");
  return { success: "Application submitted! We'll review it within 24-48 hours." };
}

export async function getMyProApplication(userId: string) {
  const { user } = await requireUser();
  if (user.id !== userId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("pro_applications")
    .select("id, requested_role, business_name, status, created_at, reviewed_at, category, city, state, review_note")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
