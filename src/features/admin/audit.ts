import { createAdminClient } from "@/lib/supabase/admin";

// Best-effort audit trail for sensitive admin actions. Never blocks the
// action itself — a logging failure shouldn't prevent a real admin operation.
export async function logAdminAction(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const db = createAdminClient();
    const { error } = await db.from("audit_logs").insert({
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata,
    });
    if (error) console.error("[admin/audit:logAdminAction]", error);
  } catch (err) {
    // Swallow — logging is best-effort, never the reason an admin action fails.
    console.error("[admin/audit:logAdminAction]", err);
  }
}
