import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { listAdmins } from "@/features/admin/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleSelect } from "@/components/admin/role-select";
import { SuspendUserButton } from "@/components/admin/suspend-user-button";

export const metadata = { title: "Admins · Admin" };

export default async function AdminsPage() {
  const { role: viewerRole } = await requireRole("superadmin");
  const admins = await listAdmins();

  return (
    <main className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-rose-600" />
        <h1 className="text-2xl font-bold">Admins</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Superadmin-only. Create admins by promoting a user from the Users page — only a superadmin can
        grant or revoke admin-tier access.
      </p>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Since</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{a.full_name ?? "—"}</td>
                  <td className="p-3"><RoleSelect userId={a.id} role={a.role} viewerRole={viewerRole} /></td>
                  <td className="p-3 text-muted-foreground">{new Date(a.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="p-3">
                    {a.is_suspended ? <Badge variant="destructive">Suspended</Badge> : <Badge variant="success">Active</Badge>}
                  </td>
                  <td className="p-3"><SuspendUserButton userId={a.id} isSuspended={a.is_suspended} /></td>
                </tr>
              ))}
              {admins.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No admins yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
