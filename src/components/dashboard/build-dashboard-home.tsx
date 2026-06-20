import { createClient } from "@/lib/supabase/server";
import { listProducts } from "@/features/catalog/queries";
import { listMyRfqs } from "@/features/rfq/queries";
import { listSuppliers } from "@/features/suppliers/queries";

import { BuildHero } from "./build-hero";
import { MyProjectsRow, type ProjectCard } from "./my-projects-row";
import { BuildToolsRow } from "./build-tools-row";
import { TrendingMaterialsCard } from "./trending-materials-card";
import { ActiveRfqsCard } from "./active-rfqs-card";
import { ProjectBudgetCard } from "./project-budget-card";
import { TopSuppliersCard } from "./top-suppliers-card";
import { NeedHelpCard } from "./need-help-card";

export async function BuildDashboardHome({ userId, firstName }: { userId: string; firstName: string }) {
  const supabase = await createClient();

  const [projectsRes, rfqs, suppliers, materials] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, budget, current_stage, status, plot_size_sqft")
      .eq("customer_id", userId)
      .order("created_at", { ascending: false }),
    listMyRfqs(userId),
    listSuppliers(),
    listProducts({ kind: "material", sort: "rating", limit: 6 }),
  ]);

  const projects = (projectsRes.data ?? []) as ProjectCard[];
  const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) ?? 0), 0);
  const spent = 0; // TODO: sum from project_expenses once data exists

  return (
    <main className="grid gap-6 p-6 xl:grid-cols-[1fr,360px]">
      {/* Main column */}
      <div className="min-w-0 space-y-6">
        <BuildHero firstName={firstName} />
        <MyProjectsRow projects={projects} />
        <BuildToolsRow />
      </div>

      {/* Right rail */}
      <aside className="space-y-4">
        <ProjectBudgetCard totalBudget={totalBudget} spent={spent} />
        <ActiveRfqsCard rfqs={rfqs} />
        <TrendingMaterialsCard products={materials.products} />
        <TopSuppliersCard suppliers={suppliers} />
        <NeedHelpCard />
      </aside>
    </main>
  );
}
