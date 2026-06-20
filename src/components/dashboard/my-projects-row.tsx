import Link from "next/link";
import { Hammer, ArrowRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/format";

export type ProjectCard = {
  id: string;
  title: string;
  budget: number | null;
  current_stage: string;
  status: string;
  plot_size_sqft: number | null;
};

const STAGE_PROGRESS: Record<string, number> = {
  planning: 10, foundation: 25, structure: 45, roofing: 65, finishing: 85, handover: 100,
};

export function MyProjectsRow({ projects }: { projects: ProjectCard[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">My Projects</h2>
        <div className="flex items-center gap-2">
          <Button variant="gradient" size="sm" asChild>
            <Link href="/projects/new"><Plus className="h-4 w-4" /> New project</Link>
          </Button>
          <Link href="/projects" className="text-sm text-primary hover:underline">View All</Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-muted-foreground">
            <Hammer className="h-10 w-10" />
            <p className="text-sm">No projects yet. Start your first one and we&apos;ll track budget, materials and stages.</p>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/projects/new">Start a project <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {projects.slice(0, 4).map((p) => {
            const pct = STAGE_PROGRESS[p.current_stage] ?? 0;
            return (
              <Card key={p.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.plot_size_sqft ? `${p.plot_size_sqft} sqft · ` : ""}{p.status}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{p.current_stage}</Badge>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{pct}% complete</span>
                    {p.budget ? <span>{formatINR(p.budget)} budget</span> : null}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/projects/${p.id}`}>Open project</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
