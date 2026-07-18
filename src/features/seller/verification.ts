"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";

export type PayoutState = { error?: string; success?: string } | null;

const payoutSchema = z.object({
  accountHolder: z.string().min(2, "Account holder name is required").max(120),
  bankName: z.string().min(2, "Bank name is required").max(120),
  accountNumber: z.string().regex(/^\d{9,18}$/, "Enter a valid account number (9–18 digits)"),
  confirmAccountNumber: z.string(),
  ifsc: z.string().regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, "Enter a valid IFSC code"),
  upiId: z.string().max(120).optional().or(z.literal("")),
}).refine((d) => d.accountNumber === d.confirmAccountNumber, {
  message: "Account numbers don't match",
  path: ["confirmAccountNumber"],
});

export async function savePayoutDetails(_prev: PayoutState, formData: FormData): Promise<PayoutState> {
  const { user } = await requireUser();
  const parsed = payoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const supabase = await createClient();
  // Re-entering payout details resets verification — the bank account changed.
  const { error } = await supabase.from("seller_payout_details").upsert({
    user_id: user.id,
    account_holder: d.accountHolder,
    bank_name: d.bankName,
    account_number: d.accountNumber,
    ifsc: d.ifsc.toUpperCase(),
    upi_id: d.upiId || null,
    verified: false,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/supplier/verification");
  return { success: "Payout details saved. We'll verify them before your first payout." };
}

const KYC_DOC_TYPES = ["pan", "gst_certificate", "government_id", "address_proof", "business_registration"] as const;

// Records metadata for a KYC file the client already uploaded to the private
// kyc-docs bucket (under the caller's own uid/ prefix, enforced by storage RLS).
export async function recordKycDocument(docType: string, storagePath: string): Promise<{ error?: string }> {
  const { user } = await requireUser();
  if (!(KYC_DOC_TYPES as readonly string[]).includes(docType)) return { error: "Unknown document type." };
  // Defence in depth: the storage RLS already blocks writes outside the caller's
  // prefix, but reject a mismatched path before we ever store it.
  if (!storagePath.startsWith(`${user.id}/`)) return { error: "Invalid file path." };

  const supabase = await createClient();
  const { error } = await supabase.from("seller_kyc_documents").insert({
    user_id: user.id,
    doc_type: docType,
    storage_path: storagePath,
    status: "pending",
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/supplier/verification");
  return {};
}

// Saves the public store-logo URL (uploaded client-side to the public
// product-images bucket) onto the seller's supplier_profiles row.
export async function saveStoreLogo(url: string): Promise<{ error?: string }> {
  const { user } = await requireUser();
  if (url && !/^https?:\/\//.test(url)) return { error: "Invalid image URL." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("supplier_profiles")
    .update({ store_logo_url: url || null })
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/supplier/verification");
  return {};
}

export async function getMyStoreLogo(userId: string): Promise<string | null> {
  const { user } = await requireUser();
  if (user.id !== userId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_profiles")
    .select("store_logo_url")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.store_logo_url ?? null;
}

export async function getMyPayoutDetails(userId: string) {
  const { user } = await requireUser();
  if (user.id !== userId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("seller_payout_details")
    .select("account_holder, bank_name, account_number, ifsc, upi_id, verified")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export type KycDocument = {
  id: string;
  doc_type: string;
  status: string;
  created_at: string;
};

export async function getMyKycDocuments(userId: string): Promise<KycDocument[]> {
  const { user } = await requireUser();
  if (user.id !== userId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("seller_kyc_documents")
    .select("id, doc_type, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as KycDocument[];
}

export type OnboardingStatus = {
  hasProduct: boolean;
  hasPayout: boolean;
  kycSubmitted: boolean;
  kycApproved: boolean;
  gstVerified: boolean;
  hasLogo: boolean;
};

// Drives the seller onboarding checklist. Reads only the caller's own rows.
export async function getSellerOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const { user } = await requireUser();
  const empty: OnboardingStatus = {
    hasProduct: false, hasPayout: false, kycSubmitted: false,
    kycApproved: false, gstVerified: false, hasLogo: false,
  };
  if (user.id !== userId) return empty;
  const supabase = await createClient();

  const [productRes, payoutRes, kycRes, profileRes] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("supplier_id", userId),
    supabase.from("seller_payout_details").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("seller_kyc_documents").select("status").eq("user_id", userId),
    supabase.from("supplier_profiles").select("gstin_verified, store_logo_url").eq("user_id", userId).maybeSingle(),
  ]);

  const kyc = kycRes.data ?? [];
  return {
    hasProduct: (productRes.count ?? 0) > 0,
    hasPayout: Boolean(payoutRes.data),
    kycSubmitted: kyc.length > 0,
    kycApproved: kyc.some((d) => d.status === "approved"),
    gstVerified: Boolean(profileRes.data?.gstin_verified),
    hasLogo: Boolean(profileRes.data?.store_logo_url),
  };
}
