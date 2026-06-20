import { requireRole } from "@/lib/auth/guards";

export default async function AdminDashboard() {
  await requireRole("admin", "superadmin");
  return <main className="p-8"><h1 className="text-2xl font-bold">Admin Console</h1></main>;
}
