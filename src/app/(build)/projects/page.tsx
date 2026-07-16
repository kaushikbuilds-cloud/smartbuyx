import Link from "next/link";
import { Hammer, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getMyProjects } from "@/features/projects/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";

export const metadata = { title: "My Projects" };

export default async function ProjectsPage() {
  const { user } = await requireUser();
  const projects = await getMyProjects(user.id);

  return (
    <main className="container mx-auto space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-sm text-muted-foreground">Track budget, materials and progress in one place.</p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/projects/new"><Plus className="h-4 w-4" /> New project</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center text-muted-foreground">
            <Hammer className="h-10 w-10" />
            <p>No projects yet. Start one and we&apos;ll track stages, budget and materials.</p>
            <Button variant="gradient" asChild>
              <Link href="/projects/new">Start a project</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </main>
  );
}
