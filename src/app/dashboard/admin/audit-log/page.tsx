import { ScrollText } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { listAuditLog } from "@/features/admin/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Audit Log · Admin" };

const ACTION_LABELS: Record<string, string> = {
  set_user_role: "Changed role",
  set_product_status: "Changed product status",
  set_product_featured: "Toggled featured product",
  approve_pro_application: "Approved application",
  reject_pro_application: "Rejected application",
  verify_supplier_gst: "Verified GST",
  suspend_user: "Suspended user",
  unsuspend_user: "Unsuspended user",
};

export default async function AuditLogPage() {
  await requireRole("superadmin");
  const entries = await listAuditLog();

  return (
    <main className="space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-rose-600" />
        <h1 className="text-2xl font-bold">Audit Log</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Superadmin-only. Every sensitive admin action (role changes, suspensions, application reviews,
        GST verification, product moderation) is recorded here — most recent first.
      </p>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Admin</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-3 font-medium">{e.actor_name ?? "—"}</td>
                  <td className="p-3"><Badge variant="secondary">{ACTION_LABELS[e.action] ?? e.action}</Badge></td>
                  <td className="p-3 text-xs text-muted-foreground">{e.target_type}</td>
                  <td className="p-3 max-w-xs truncate text-xs text-muted-foreground">{JSON.stringify(e.metadata)}</td>
                </tr>
              ))}
              {entries.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No audit entries yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
