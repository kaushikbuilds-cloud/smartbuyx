export type NotificationRow = {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

// Safe for both server and client components: no Supabase or Next imports.
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
