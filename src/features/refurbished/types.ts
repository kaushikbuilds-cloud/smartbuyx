export type ConditionGrade = "excellent" | "very_good" | "good";
export type QcStatus = "pending" | "passed" | "failed";

export const CONDITION_LABELS: Record<ConditionGrade, string> = {
  excellent: "Excellent",
  very_good: "Very Good",
  good: "Good",
};

export const QC_LABELS: Record<QcStatus, string> = {
  pending: "Pending inspection",
  passed: "Quality Inspected",
  failed: "Failed inspection",
};

export type RefurbishedListing = {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  base_price: number;
  // Only present on seller-facing queries (SELLER_COLS) -- public listings
  // (PUBLIC_COLS) never select it and don't need it.
  seller_price: number | null;
  compare_at_price: number | null;
  images: { url: string }[];
  status: string;
  condition_grade: ConditionGrade;
  battery_health: number | null;
  warranty_months: number;
  accessories_included: string | null;
  qc_status: QcStatus;
  qc_notes: string | null;
};
