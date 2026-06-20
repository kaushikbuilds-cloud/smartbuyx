import { requireUser } from "@/lib/auth/guards";

export default async function ProjectsPage() {
  await requireUser();
  return <main className="p-8"><h1 className="text-2xl font-bold">Construction Projects</h1></main>;
}
