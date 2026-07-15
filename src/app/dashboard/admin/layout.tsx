import { requireRole } from "@/lib/auth/guards";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin", "superadmin");
  return (
    <div className="container mx-auto grid gap-6 p-6 lg:grid-cols-[224px,1fr]">
      <AdminNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
