import { requireRole } from "@/lib/auth/guards";

export default async function CreatorDashboard() {
  await requireRole("creator", "admin", "superadmin");
  return <main className="p-8"><h1 className="text-2xl font-bold">Creator Studio</h1></main>;
}
