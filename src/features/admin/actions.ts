"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/guards";
import type { UserRole } from "@/types/auth";

const ADMIN = ["admin", "superadmin"] as const;

export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  await requireRole(...ADMIN);
  const db = createAdminClient();
  await db.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/dashboard/admin/users");
}

export async function setProductStatus(productId: string, status: "active" | "archived"): Promise<void> {
  await requireRole(...ADMIN);
  const db = createAdminClient();
  await db.from("products").update({ status }).eq("id", productId);
  revalidatePath("/dashboard/admin/products");
}

export async function reviewProApplication(
  applicationId: string,
  approve: boolean
): Promise<void> {
  await requireRole(...ADMIN);
  const db = createAdminClient();

  const { data: app } = await db
    .from("pro_applications")
    .select("user_id, requested_role")
    .eq("id", applicationId)
    .single();
  if (!app) return;

  await db
    .from("pro_applications")
    .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (approve) {
    // Promote the user to their requested pro role.
    await db.from("profiles").update({ role: app.requested_role }).eq("id", app.user_id);
  }
  revalidatePath("/dashboard/admin/suppliers");
}

export async function verifySupplierGst(userId: string, verified: boolean): Promise<void> {
  await requireRole(...ADMIN);
  const db = createAdminClient();
  await db
    .from("supplier_profiles")
    .update({
      gstin_verified: verified,
      gstin_verified_at: verified ? new Date().toISOString() : null,
      verified_business: verified,
    })
    .eq("user_id", userId);
  // Recompute trust score after verification.
  await db.rpc("recompute_trust_score", { p_supplier: userId }).then(() => {}, () => {});
  revalidatePath("/dashboard/admin/suppliers");
}
