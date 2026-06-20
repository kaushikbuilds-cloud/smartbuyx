import { requireUser } from "@/lib/auth/guards";

export default async function NewProjectPage() {
  await requireUser();
  return <main className="container mx-auto p-8"><h1 className="text-2xl font-bold">New Project</h1></main>;
}
