import { requireRole } from "@/lib/auth/guards";

export default async function InteriorDesignerDashboard() {
  await requireRole("interior_designer", "admin", "superadmin");
  return <main className="p-8"><h1 className="text-2xl font-bold">Interior Designer Dashboard</h1></main>;
}
