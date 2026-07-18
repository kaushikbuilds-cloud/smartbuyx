"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guards";
import { logAdminAction } from "./audit";
import type { UserRole } from "@/types/auth";

const ADMIN = ["admin", "superadmin"] as const;
const ADMIN_TIER = ["admin", "superadmin"] as const;

function logIfError(label: string, error: unknown) {
  if (error) console.error(`[admin/actions:${label}]`, error);
}

export async function setUserRole(userId: string, role: UserRole): Promise<{ error?: string }> {
  const { user, role: callerRole } = await requireRole(...ADMIN);

  const db = createAdminClient();
  const { data: target } = await db.from("profiles").select("role").eq("id", userId).single();

  // Only superadmin can grant or revoke admin-tier access. A regular admin can
  // manage every other role, but can't create a peer admin, promote themselves
  // to superadmin, or demote another admin/superadmin out of the tier.
  const grantingAdminTier = (ADMIN_TIER as readonly string[]).includes(role);
  const targetIsAdminTier = Boolean(target && (ADMIN_TIER as readonly string[]).includes(target.role));
  if ((grantingAdminTier || targetIsAdminTier) && callerRole !== "superadmin") {
    return { error: "Only a superadmin can grant or revoke admin access." };
  }
  if (userId === user.id && role !== callerRole) {
    return { error: "You can't change your own role." };
  }

  const { error } = await db.from("profiles").update({ role }).eq("id", userId);
  logIfError("setUserRole", error);
  if (error) return { error: "Failed to update role. Check server logs." };
  await logAdminAction(user.id, "set_user_role", "profile", userId, { from: target?.role, to: role });
  revalidatePath("/dashboard/admin/users");
  return {};
}

export async function setProductStatus(productId: string, status: "active" | "archived"): Promise<void> {
  const { user } = await requireRole(...ADMIN);
  const db = createAdminClient();
  const { error } = await db.from("products").update({ status }).eq("id", productId);
  logIfError("setProductStatus", error);
  await logAdminAction(user.id, "set_product_status", "product", productId, { status });
  revalidatePath("/dashboard/admin/products");
}

export async function setProductFeatured(productId: string, featured: boolean): Promise<void> {
  const { user } = await requireRole(...ADMIN);
  const db = createAdminClient();
  const { error } = await db.from("products").update({ is_featured: featured }).eq("id", productId);
  logIfError("setProductFeatured", error);
  await logAdminAction(user.id, "set_product_featured", "product", productId, { featured });
  revalidatePath("/dashboard/admin/products");
}

export async function reviewProApplication(
  applicationId: string,
  approve: boolean
): Promise<void> {
  const { user } = await requireRole(...ADMIN);
  const db = createAdminClient();

  const { data: app } = await db
    .from("pro_applications")
    .select("user_id, requested_role, business_name, gstin, description")
    .eq("id", applicationId)
    .single();
  if (!app) return;

  const { error: appError } = await db
    .from("pro_applications")
    .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", applicationId);
  logIfError("reviewProApplication.application", appError);

  if (approve) {
    // Promote the user to their requested pro role.
    const { error: roleError } = await db.from("profiles").update({ role: app.requested_role }).eq("id", app.user_id);
    logIfError("reviewProApplication.role", roleError);

    // Each pro role reads from its own profile table (supplier_profiles,
    // architect_profiles, contractor_profiles), each with a differently named
    // "name" column -- promoting the role alone leaves that row missing, so
    // the account is a "supplier" that never shows up in the directory/search.
    let profileError;
    if (app.requested_role === "supplier") {
      ({ error: profileError } = await db
        .from("supplier_profiles")
        .upsert(
          { user_id: app.user_id, business_name: app.business_name, gstin: app.gstin ?? null, bio: app.description ?? null },
          { onConflict: "user_id" }
        ));
    } else if (app.requested_role === "architect") {
      ({ error: profileError } = await db
        .from("architect_profiles")
        .upsert({ user_id: app.user_id, firm_name: app.business_name, bio: app.description ?? null }, { onConflict: "user_id" }));
    } else {
      ({ error: profileError } = await db
        .from("contractor_profiles")
        .upsert({ user_id: app.user_id, company_name: app.business_name, bio: app.description ?? null }, { onConflict: "user_id" }));
    }
    logIfError("reviewProApplication.profileRow", profileError);
  }
  await logAdminAction(user.id, approve ? "approve_pro_application" : "reject_pro_application", "pro_application", applicationId, {
    requested_role: app.requested_role,
  });
  revalidatePath("/dashboard/admin/suppliers");
}

export async function setApplicationStatus(
  applicationId: string,
  status: "under_review" | "info_requested",
  note?: string
): Promise<void> {
  const { user } = await requireRole(...ADMIN);
  const db = createAdminClient();
  const { error } = await db
    .from("pro_applications")
    .update({ status, review_note: note?.trim() || null })
    .eq("id", applicationId);
  logIfError("setApplicationStatus", error);
  await logAdminAction(
    user.id,
    status === "under_review" ? "application_under_review" : "application_info_requested",
    "pro_application",
    applicationId,
    { note: note?.trim() || undefined }
  );
  revalidatePath("/dashboard/admin/suppliers");
}

export async function verifySupplierGst(userId: string, verified: boolean): Promise<void> {
  const { user } = await requireRole(...ADMIN);
  const db = createAdminClient();
  const { error } = await db
    .from("supplier_profiles")
    .update({
      gstin_verified: verified,
      gstin_verified_at: verified ? new Date().toISOString() : null,
      verified_business: verified,
    })
    .eq("user_id", userId);
  logIfError("verifySupplierGst", error);
  // Recompute trust score after verification.
  await db.rpc("recompute_trust_score", { p_supplier: userId }).then(() => {}, () => {});
  await logAdminAction(user.id, "verify_supplier_gst", "supplier_profile", userId, { verified });
  revalidatePath("/dashboard/admin/suppliers");
}

export async function setKycStatus(
  documentId: string,
  status: "approved" | "rejected"
): Promise<void> {
  const { user } = await requireRole(...ADMIN);
  const db = createAdminClient();
  const { data: doc } = await db
    .from("seller_kyc_documents")
    .select("user_id, doc_type")
    .eq("id", documentId)
    .single();
  const { error } = await db.from("seller_kyc_documents").update({ status }).eq("id", documentId);
  logIfError("setKycStatus", error);
  await logAdminAction(user.id, "set_kyc_status", "kyc_document", documentId, {
    status,
    doc_type: doc?.doc_type,
    subject: doc?.user_id,
  });
  revalidatePath("/dashboard/admin/kyc");
}

export async function setUserSuspended(
  userId: string,
  suspended: boolean,
  reason?: string
): Promise<{ error?: string }> {
  const { user, role: callerRole } = await requireRole(...ADMIN);
  if (userId === user.id) return { error: "You can't suspend your own account." };

  const db = createAdminClient();
  const { data: target } = await db.from("profiles").select("role").eq("id", userId).single();
  // A regular admin can suspend ordinary users, but not another admin/superadmin
  // — that would let one admin silently lock out another. Only superadmin can.
  const targetIsAdminTier = Boolean(target && (ADMIN_TIER as readonly string[]).includes(target.role));
  if (targetIsAdminTier && callerRole !== "superadmin") {
    return { error: "Only a superadmin can suspend an admin account." };
  }

  const { error } = await db
    .from("profiles")
    .update({
      is_suspended: suspended,
      suspended_at: suspended ? new Date().toISOString() : null,
      suspended_reason: suspended ? reason || null : null,
    })
    .eq("id", userId);
  logIfError("setUserSuspended", error);
  if (error) return { error: "Failed to update suspension. Check server logs." };
  await logAdminAction(user.id, suspended ? "suspend_user" : "unsuspend_user", "profile", userId, { reason });
  revalidatePath("/dashboard/admin/users");
  return {};
}
