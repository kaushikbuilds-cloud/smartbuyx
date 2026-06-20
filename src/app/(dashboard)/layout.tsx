import { requireUser } from "@/lib/auth/guards";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <div className="flex min-h-screen">{children}</div>;
}
