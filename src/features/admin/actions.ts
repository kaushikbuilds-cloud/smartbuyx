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
    .select("user_id, requested_role")
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
  }
  await logAdminAction(user.id, approve ? "approve_pro_application" : "reject_pro_application", "pro_application", applicationId, {
    requested_role: app.requested_role,
  });
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
