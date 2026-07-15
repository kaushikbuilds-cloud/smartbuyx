import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type NotificationRow = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export async function getUnreadCount(userId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function getRecentNotifications(userId: string, limit = 8): Promise<NotificationRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, payload, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as NotificationRow[];
}

// Human-friendly line for a notification, derived from its kind + payload.
export function describeNotification(n: NotificationRow): string {
  const p = n.payload ?? {};
  switch (n.kind) {
    case "price.drop":
      return `Price drop: ${p.title ?? "an item"} is now ₹${p.price ?? "?"}`;
    case "rfq.new":
      return `New RFQ: ${p.title ?? "a buyer request"}`;
    case "consultation.requested":
      return "New consultation requested";
    default:
      return n.kind.replace(/[._]/g, " ");
  }
}
