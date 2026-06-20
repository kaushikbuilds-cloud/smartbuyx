import { requireRole } from "@/lib/auth/guards";

export default async function ArchitectDashboard() {
  await requireRole("architect", "admin", "superadmin");
  return <main className="p-8"><h1 className="text-2xl font-bold">Architect Dashboard</h1></main>;
}
