export const DESIGN_TABS = [
  { key: "3d_model", label: "3D Model" },
  { key: "renders", label: "Renders" },
  { key: "blueprint", label: "Blueprint" },
  { key: "interior", label: "Interior" },
  { key: "concept", label: "Concept" },
  { key: "floor_plan", label: "Floor Plan" },
  { key: "cost", label: "Cost" },
  { key: "smart", label: "Smart" },
  { key: "vr_tour", label: "VR Tour" },
  { key: "vastu", label: "Vastu" },
] as const;

export type DesignTabKey = (typeof DESIGN_TABS)[number]["key"];

export type FacingDirection =
  | "north" | "south" | "east" | "west"
  | "north_east" | "north_west" | "south_east" | "south_west";

export type BudgetTier = "low" | "standard" | "premium" | "luxury";

export type DesignStyle =
  | "traditional" | "modern" | "contemporary" | "minimal"
  | "colonial" | "industrial" | "scandinavian" | "vastu";

export const PLAN_TIERS = ["free", "starter", "premium", "annual"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const PLAN_AUDIENCES = [
  "architect", "engineer", "contractor", "interior_designer",
  "supplier", "d2c_brand", "creator", "consultant",
] as const;
export type PlanAudience = (typeof PLAN_AUDIENCES)[number];
