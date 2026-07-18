import { requireRole } from "@/lib/auth/guards";
import { listUsers } from "@/features/admin/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleSelect } from "@/components/admin/role-select";

export const metadata = { title: "Users · Admin" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { role: viewerRole } = await requireRole("admin", "superadmin");
  const { q } = await searchParams;
  const users = await listUsers(q);

  return (
    <main className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Users</h1>
        <form action="/dashboard/admin/users">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search name..."
            className="h-9 w-56 rounded-md border border-input bg-background px-3 text-sm"
          />
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">KYC</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{u.full_name ?? "—"}</td>
                  <td className="p-3">
                    <Badge variant={u.kyc_status === "approved" ? "success" : "secondary"}>{u.kyc_status}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="p-3"><RoleSelect userId={u.id} role={u.role} viewerRole={viewerRole} /></td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No users found.</td></tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
