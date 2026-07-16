import { notFound } from "next/navigation";
import { MapPin, Layers, Compass, IndianRupee } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import {
  getProject, getMilestones, getProjectMaterials, getProjectExpenses, getSiteReports,
} from "@/features/projects/queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StageTimeline } from "@/components/projects/stage-timeline";
import { ExpenseForm } from "@/components/projects/expense-form";
import { MaterialForm } from "@/components/projects/material-form";
import { ReportForm } from "@/components/projects/report-form";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser();
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [materials, expenses, reports] = await Promise.all([
    getProjectMaterials(id),
    getProjectExpenses(id),
    getSiteReports(id),
  ]);
  void getMilestones; // milestones reserved for future timeline detail view

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const budget = project.budget ?? 0;
  const budgetPct = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0;
  const canAdvance = [project.architect_id, project.engineer_id, project.contractor_id].includes(user.id) ||
    project.status !== "cancelled";

  return (
    <main className="container mx-auto space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {project.plot_size_sqft ? (
              <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {project.plot_size_sqft} sqft · {project.floors ?? 1} floor(s)</span>
            ) : null}
            {project.pincode ? <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {project.pincode}</span> : null}
            {project.facing ? <span className="flex items-center gap-1"><Compass className="h-3.5 w-3.5" /> {project.facing.replace("_", "-")}-facing</span> : null}
          </div>
        </div>
        <div className="flex gap-2">
          {project.style ? <Badge variant="secondary" className="capitalize">{project.style}</Badge> : null}
          {project.vastu_compliant ? <Badge variant="success">Vastu</Badge> : null}
          <Badge variant="secondary" className="capitalize">{project.status}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-semibold">Construction stages</h2>
          <StageTimeline projectId={project.id} currentStage={project.current_stage} canAdvance={canAdvance} />
        </CardContent>
      </Card>

      <Tabs defaultValue="budget">
        <TabsList>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="reports">Site Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-emerald-600" />
                  <span className="text-lg font-bold">{formatINR(totalSpent)}</span>
                  {budget > 0 ? <span className="text-sm text-muted-foreground">of {formatINR(budget)} budget</span> : null}
                </div>
                {budget > 0 ? <span className="text-sm font-medium">{budgetPct}%</span> : null}
              </div>
              {budget > 0 ? (
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${budgetPct > 90 ? "bg-rose-500" : "bg-gradient-to-r from-amber-500 to-orange-600"}`}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
              ) : null}

              <ExpenseForm projectId={project.id} />

              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses logged yet.</p>
              ) : (
                <ul className="divide-y">
                  {expenses.map((e) => (
                    <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <span className="capitalize font-medium">{e.category}</span>
                        {e.description ? <span className="text-muted-foreground"> — {e.description}</span> : null}
                        <p className="text-xs text-muted-foreground">{new Date(e.incurred_at).toLocaleDateString("en-IN")}</p>
                      </div>
                      <span className="font-semibold">{formatINR(e.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardContent className="space-y-4 p-6">
              <MaterialForm projectId={project.id} />
              {materials.length === 0 ? (
                <p className="text-sm text-muted-foreground">No materials planned yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr><th className="pb-2">Material</th><th className="pb-2 text-right">Planned</th><th className="pb-2 text-right">Ordered</th><th className="pb-2 text-right">Delivered</th></tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => (
                      <tr key={m.id} className="border-t">
                        <td className="py-2">{m.name}</td>
                        <td className="py-2 text-right">{m.planned_qty} {m.unit}</td>
                        <td className="py-2 text-right">{m.ordered_qty} {m.unit}</td>
                        <td className="py-2 text-right">{m.delivered_qty} {m.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="space-y-4 p-6">
              <ReportForm projectId={project.id} />
              {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground">No site updates yet.</p>
              ) : (
                <ul className="space-y-3">
                  {reports.map((r) => (
                    <li key={r.id} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{r.kind}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("en-IN")}</span>
                      </div>
                      {r.body ? <p className="mt-1 text-sm">{r.body}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
