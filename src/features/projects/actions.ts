"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import { STAGES, type ProjectStage } from "./types";

export type ProjectActionState = { error?: string; success?: string } | null;

const createSchema = z.object({
  title: z.string().min(3, "Title is too short"),
  plotSizeSqft: z.coerce.number().positive().optional(),
  floors: z.coerce.number().int().min(1).max(20).default(1),
  bhk: z.coerce.number().int().min(1).max(10).optional(),
  pincode: z.string().regex(/^\d{6}$/).optional().or(z.literal("")),
  budget: z.coerce.number().nonnegative().optional(),
  style: z.enum(["traditional", "modern", "contemporary", "minimal", "colonial", "industrial", "scandinavian", "vastu"]).optional(),
  facing: z.enum(["north", "south", "east", "west", "north_east", "north_west", "south_east", "south_west"]).optional(),
  vastuCompliant: z.coerce.boolean().optional(),
});

export async function createProject(_prev: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const { user } = await requireUser();
  const raw = Object.fromEntries(formData);
  const parsed = createSchema.safeParse({
    ...raw,
    vastuCompliant: raw.vastuCompliant === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const p = parsed.data;

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      customer_id: user.id,
      title: p.title,
      plot_size_sqft: p.plotSizeSqft ?? null,
      floors: p.floors,
      bhk: p.bhk ?? null,
      pincode: p.pincode || null,
      budget: p.budget ?? null,
      style: p.style ?? null,
      facing: p.facing ?? null,
      vastu_compliant: p.vastuCompliant ?? false,
      status: "active",
      current_stage: "planning",
    })
    .select("id")
    .single();
  if (error || !project) return { error: error?.message ?? "Failed to create project." };

  // Seed the standard 6-stage milestone checklist.
  await supabase.from("project_milestones").insert(
    STAGES.map((stage) => ({ project_id: project.id, stage, title: stageLabel(stage) }))
  );

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

function stageLabel(stage: ProjectStage): string {
  const labels: Record<ProjectStage, string> = {
    planning: "Planning & design finalized",
    foundation: "Foundation complete",
    structure: "Structure complete",
    roofing: "Roofing complete",
    finishing: "Finishing complete",
    handover: "Handover",
  };
  return labels[stage];
}

export async function advanceStage(projectId: string, nextStage: ProjectStage): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createClient();

  // Only the customer or an assigned pro can advance the stage.
  const { data: project } = await supabase
    .from("projects")
    .select("customer_id, architect_id, engineer_id, contractor_id, interior_designer_id")
    .eq("id", projectId)
    .single();
  if (!project) return;
  const allowed = [project.customer_id, project.architect_id, project.engineer_id, project.contractor_id, project.interior_designer_id];
  if (!allowed.includes(user.id)) return;

  await supabase.from("projects").update({ current_stage: nextStage, updated_at: new Date().toISOString() }).eq("id", projectId);
  await supabase
    .from("project_milestones")
    .update({ completed_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .eq("stage", nextStage)
    .is("completed_at", null);

  revalidatePath(`/projects/${projectId}`);
}

const expenseSchema = z.object({
  projectId: z.string().uuid(),
  category: z.string().min(2),
  amount: z.coerce.number().positive(),
  description: z.string().max(300).optional().or(z.literal("")),
});

export async function addExpense(_prev: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const { user } = await requireUser();
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("customer_id, architect_id, engineer_id, contractor_id")
    .eq("id", parsed.data.projectId)
    .single();
  if (!project || ![project.customer_id, project.architect_id, project.engineer_id, project.contractor_id].includes(user.id)) {
    return { error: "Project not found." };
  }
  const { error } = await supabase.from("project_expenses").insert({
    project_id: parsed.data.projectId,
    category: parsed.data.category,
    amount: parsed.data.amount,
    description: parsed.data.description || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: "Expense logged." };
}

const reportSchema = z.object({
  projectId: z.string().uuid(),
  kind: z.enum(["progress", "inspection", "issue"]),
  body: z.string().min(3).max(1000),
});

export async function addSiteReport(_prev: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const { user } = await requireUser();
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("customer_id, architect_id, engineer_id, contractor_id, interior_designer_id")
    .eq("id", parsed.data.projectId)
    .single();
  if (!project || ![project.customer_id, project.architect_id, project.engineer_id, project.contractor_id, project.interior_designer_id].includes(user.id)) {
    return { error: "Project not found." };
  }
  const { error } = await supabase.from("site_reports").insert({
    project_id: parsed.data.projectId,
    author_id: user.id,
    kind: parsed.data.kind,
    body: parsed.data.body,
  });
  if (error) return { error: error.message };

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: "Site report added." };
}

const materialSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2),
  unit: z.string().min(1),
  plannedQty: z.coerce.number().positive(),
  estimatedCost: z.coerce.number().nonnegative().optional(),
});

export async function addProjectMaterial(_prev: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const { user } = await requireUser();
  const parsed = materialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("customer_id, architect_id, engineer_id, contractor_id")
    .eq("id", parsed.data.projectId)
    .single();
  if (!project || ![project.customer_id, project.architect_id, project.engineer_id, project.contractor_id].includes(user.id)) {
    return { error: "Project not found." };
  }
  const { error } = await supabase.from("project_materials").insert({
    project_id: parsed.data.projectId,
    name: parsed.data.name,
    unit: parsed.data.unit,
    planned_qty: parsed.data.plannedQty,
    estimated_cost: parsed.data.estimatedCost ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { success: "Material added to plan." };
}
