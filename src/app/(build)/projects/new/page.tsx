import { requireUser } from "@/lib/auth/guards";
import { NewProjectForm } from "@/components/projects/new-project-form";

export const metadata = { title: "New Project" };

export default async function NewProjectPage() {
  await requireUser();
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Start a new project</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        We&apos;ll set up a 6-stage tracker (planning → handover) and let you assign pros, log expenses and track materials.
      </p>
      <NewProjectForm />
    </main>
  );
}
