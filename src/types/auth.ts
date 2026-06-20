export type UserRole =
  | "customer"
  | "supplier"
  | "architect"
  | "engineer"
  | "contractor"
  | "interior_designer"
  | "creator"
  | "d2c_brand"
  | "admin"
  | "superadmin";

export const PRO_ROLES = [
  "supplier",
  "architect",
  "engineer",
  "contractor",
  "interior_designer",
  "creator",
  "d2c_brand",
] as const satisfies readonly UserRole[];

export type ProRole = (typeof PRO_ROLES)[number];

export const ADMIN_ROLES = ["admin", "superadmin"] as const satisfies readonly UserRole[];
