import { requireRole } from "@/lib/auth/guards";

export default async function SupplierDashboard() {
  await requireRole("supplier", "admin", "superadmin");
  return <main className="p-8"><h1 className="text-2xl font-bold">Supplier Dashboard</h1></main>;
}
