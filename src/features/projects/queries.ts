import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  ProjectSummary, ProjectDetail, Milestone, ProjectMaterial, ProjectExpense, SiteReport,
} from "./types";

export async function getMyProjects(userId: string): Promise<ProjectSummary[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, title, plot_size_sqft, bhk, budget, current_stage, status, cover_image_url, created_at")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ProjectSummary[];
}

export async function getProject(projectId: string): Promise<ProjectDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(`
      id, title, plot_size_sqft, bhk, budget, current_stage, status, cover_image_url, created_at,
      floors, pincode, style, facing, vastu_compliant, budget_tier,
      architect_id, engineer_id, contractor_id, interior_designer_id, start_date, target_end_date
    `)
    .eq("id", projectId)
    .single();
  return (data ?? null) as ProjectDetail | null;
}

export async function getMilestones(projectId: string): Promise<Milestone[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_milestones")
    .select("id, stage, title, due_date, completed_at, notes")
    .eq("project_id", projectId)
    .order("due_date", { ascending: true, nullsFirst: false });
  return (data ?? []) as Milestone[];
}

export async function getProjectMaterials(projectId: string): Promise<ProjectMaterial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_materials")
    .select("id, name, unit, planned_qty, ordered_qty, delivered_qty, estimated_cost")
    .eq("project_id", projectId);
  return (data ?? []).map((m) => ({
    ...m,
    planned_qty: Number(m.planned_qty),
    ordered_qty: Number(m.ordered_qty),
    delivered_qty: Number(m.delivered_qty),
    estimated_cost: m.estimated_cost != null ? Number(m.estimated_cost) : null,
  })) as ProjectMaterial[];
}

export async function getProjectExpenses(projectId: string): Promise<ProjectExpense[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_expenses")
    .select("id, category, amount, description, incurred_at")
    .eq("project_id", projectId)
    .order("incurred_at", { ascending: false });
  return (data ?? []).map((e) => ({ ...e, amount: Number(e.amount) })) as ProjectExpense[];
}

export async function getSiteReports(projectId: string): Promise<SiteReport[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_reports")
    .select("id, author_id, kind, body, attachments, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data ?? []) as SiteReport[];
}
