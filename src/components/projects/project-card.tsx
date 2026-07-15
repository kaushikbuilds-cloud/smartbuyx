import Link from "next/link";
import { Hammer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils/format";
import { STAGE_PROGRESS, type ProjectSummary } from "@/features/projects/types";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const pct = STAGE_PROGRESS[project.current_stage] ?? 0;
  return (
    <Link href={`/projects/${project.id}`} className="group">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="flex h-28 items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <Hammer className="h-8 w-8 opacity-80" />
        </div>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{project.title}</p>
              <p className="text-xs text-muted-foreground">
                {project.plot_size_sqft ? `${project.plot_size_sqft} sqft` : "Size TBD"}
                {project.bhk ? ` · ${project.bhk} BHK` : ""}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 capitalize">{project.current_stage}</Badge>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{pct}% complete</span>
            {project.budget ? <span>{formatINR(project.budget)}</span> : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
