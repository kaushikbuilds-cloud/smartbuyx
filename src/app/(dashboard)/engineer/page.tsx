import { requireRole } from "@/lib/auth/guards";

export default async function EngineerDashboard() {
  await requireRole("engineer", "admin", "superadmin");
  return <main className="p-8"><h1 className="text-2xl font-bold">Engineer Dashboard</h1></main>;
}
