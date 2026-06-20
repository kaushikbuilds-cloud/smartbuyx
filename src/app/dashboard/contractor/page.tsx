import { requireRole } from "@/lib/auth/guards";

export default async function ContractorDashboard() {
  await requireRole("contractor", "admin", "superadmin");
  return <main className="p-8"><h1 className="text-2xl font-bold">Contractor Dashboard</h1></main>;
}
