import { requireRole } from "@/lib/auth/guards";

export default async function BrandDashboard() {
  await requireRole("d2c_brand", "admin", "superadmin");
  return <main className="p-8"><h1 className="text-2xl font-bold">Brand Dashboard</h1></main>;
}
