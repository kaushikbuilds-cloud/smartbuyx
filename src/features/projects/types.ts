export type ProjectStage = "planning" | "foundation" | "structure" | "roofing" | "finishing" | "handover";
export type ProjectStatus = "draft" | "active" | "on_hold" | "completed" | "cancelled";

export const STAGES: ProjectStage[] = ["planning", "foundation", "structure", "roofing", "finishing", "handover"];

export const STAGE_PROGRESS: Record<ProjectStage, number> = {
  planning: 10, foundation: 25, structure: 45, roofing: 65, finishing: 85, handover: 100,
};

export type ProjectSummary = {
  id: string;
  title: string;
  plot_size_sqft: number | null;
  bhk: number | null;
  budget: number | null;
  current_stage: ProjectStage;
  status: ProjectStatus;
  cover_image_url: string | null;
  created_at: string;
};

export type ProjectDetail = ProjectSummary & {
  floors: number | null;
  pincode: string | null;
  style: string | null;
  facing: string | null;
  vastu_compliant: boolean;
  budget_tier: string | null;
  architect_id: string | null;
  engineer_id: string | null;
  contractor_id: string | null;
  interior_designer_id: string | null;
  start_date: string | null;
  target_end_date: string | null;
};

export type Milestone = {
  id: string;
  stage: ProjectStage;
  title: string;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
};

export type ProjectMaterial = {
  id: string;
  name: string;
  unit: string;
  planned_qty: number;
  ordered_qty: number;
  delivered_qty: number;
  estimated_cost: number | null;
};

export type ProjectExpense = {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  incurred_at: string;
};

export type SiteReport = {
  id: string;
  author_id: string;
  kind: string;
  body: string | null;
  attachments: { url: string }[];
  created_at: string;
};
