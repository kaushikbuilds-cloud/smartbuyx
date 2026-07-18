import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// All admin queries use the service-role client. Pages that call these MUST be
// guarded with requireRole("admin","superadmin").

// Every query below discarded `error` silently (`const { data } = await query`),
// so a bad SUPABASE_SERVICE_ROLE_KEY or any other query failure looked
// identical to "genuinely no rows" — the admin panel would just show empty
// everywhere with zero trace of why. This logs any error so it's visible in
// Vercel runtime logs instead of vanishing.
function logIfError(label: string, error: unknown) {
  if (error) console.error(`[admin/queries:${label}]`, error);
}

export type PlatformStats = {
  gmv: number;
  orders: number;
  users: number;
  sellers: number;
  products: number;
  pendingApplications: number;
  openReturns: number;
  paidOrders: number;
};

const SOLD_STATUSES = ["paid", "processing", "shipped", "delivered"];

export async function getPlatformStats(): Promise<PlatformStats> {
  const empty: PlatformStats = {
    gmv: 0, orders: 0, users: 0, sellers: 0, products: 0,
    pendingApplications: 0, openReturns: 0, paidOrders: 0,
  };
  if (!isSupabaseConfigured()) return empty;
  const db = createAdminClient();

  const [ordersRes, usersRes, sellersRes, productsRes, appsRes, returnsRes] = await Promise.all([
    db.from("orders").select("total, status"),
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id", { count: "exact", head: true }).in("role", ["supplier", "d2c_brand"]),
    db.from("products").select("id", { count: "exact", head: true }),
    db.from("pro_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("return_requests").select("id", { count: "exact", head: true }).in("status", ["requested", "approved"]),
  ]);
  logIfError("getPlatformStats.orders", ordersRes.error);
  logIfError("getPlatformStats.users", usersRes.error);
  logIfError("getPlatformStats.sellers", sellersRes.error);
  logIfError("getPlatformStats.products", productsRes.error);
  logIfError("getPlatformStats.apps", appsRes.error);
  logIfError("getPlatformStats.returns", returnsRes.error);

  const orders = ordersRes.data ?? [];
  const gmv = orders
    .filter((o) => SOLD_STATUSES.includes(o.status))
    .reduce((s, o) => s + Number(o.total), 0);

  return {
    gmv,
    orders: orders.length,
    paidOrders: orders.filter((o) => SOLD_STATUSES.includes(o.status)).length,
    users: usersRes.count ?? 0,
    sellers: sellersRes.count ?? 0,
    products: productsRes.count ?? 0,
    pendingApplications: appsRes.count ?? 0,
    openReturns: returnsRes.count ?? 0,
  };
}

export type AdminUser = {
  id: string;
  full_name: string | null;
  role: string;
  kyc_status: string;
  created_at: string;
  is_suspended: boolean;
};

export async function listUsers(q?: string): Promise<AdminUser[]> {
  if (!isSupabaseConfigured()) return [];
  const db = createAdminClient();
  let query = db
    .from("profiles")
    .select("id, full_name, role, kyc_status, created_at, is_suspended")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.ilike("full_name", `%${q}%`);
  const { data, error } = await query;
  logIfError("listUsers", error);
  return (data ?? []) as AdminUser[];
}

// Admin-tier accounts only, for the superadmin-exclusive Admins page.
export async function listAdmins(): Promise<AdminUser[]> {
  if (!isSupabaseConfigured()) return [];
  const db = createAdminClient();
  const { data, error } = await db
    .from("profiles")
    .select("id, full_name, role, kyc_status, created_at, is_suspended")
    .in("role", ["admin", "superadmin"])
    .order("created_at", { ascending: false });
  logIfError("listAdmins", error);
  return (data ?? []) as AdminUser[];
}

export type AuditLogEntry = {
  id: string;
  actor_id: string;
  actor_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function listAuditLog(limit = 100): Promise<AuditLogEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const db = createAdminClient();
  const { data, error } = await db
    .from("audit_logs")
    .select("id, actor_id, action, target_type, target_id, metadata, created_at, profiles!audit_logs_actor_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  logIfError("listAuditLog", error);
  return (data ?? []).map((row) => {
    const actor = row.profiles as unknown as { full_name: string | null } | null;
    return {
      id: row.id,
      actor_id: row.actor_id,
      actor_name: actor?.full_name ?? null,
      action: row.action,
      target_type: row.target_type,
      target_id: row.target_id,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      created_at: row.created_at,
    };
  });
}

export type AdminProduct = {
  id: string;
  title: string;
  slug: string;
  status: string;
  base_price: number;
  rating_avg: number;
  sales_count: number;
  supplier_id: string;
  is_featured: boolean;
};

export async function listAllProducts(q?: string): Promise<AdminProduct[]> {
  if (!isSupabaseConfigured()) return [];
  const db = createAdminClient();
  let query = db
    .from("products")
    .select("id, title, slug, status, base_price, rating_avg, sales_count, supplier_id, is_featured")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.ilike("title", `%${q}%`);
  const { data, error } = await query;
  logIfError("listAllProducts", error);
  return (data ?? []).map((p) => ({ ...p, base_price: Number(p.base_price), rating_avg: Number(p.rating_avg) })) as AdminProduct[];
}

export type ProApplication = {
  id: string;
  user_id: string;
  requested_role: string;
  business_name: string;
  status: string;
  created_at: string;
  business_type: string | null;
  category: string | null;
  gstin: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  review_note: string | null;
};

export async function listProApplications(): Promise<ProApplication[]> {
  if (!isSupabaseConfigured()) return [];
  const db = createAdminClient();
  const { data, error } = await db
    .from("pro_applications")
    .select("id, user_id, requested_role, business_name, status, created_at, business_type, category, gstin, phone, city, state, description, review_note")
    .order("created_at", { ascending: false })
    .limit(100);
  logIfError("listProApplications", error);
  return (data ?? []) as ProApplication[];
}

export type AdminOrder = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  buyer_id: string;
};

export async function listAllOrders(): Promise<AdminOrder[]> {
  if (!isSupabaseConfigured()) return [];
  const db = createAdminClient();
  const { data, error } = await db
    .from("orders")
    .select("id, total, status, created_at, buyer_id")
    .order("created_at", { ascending: false })
    .limit(100);
  logIfError("listAllOrders", error);
  return (data ?? []).map((o) => ({ ...o, total: Number(o.total) })) as AdminOrder[];
}

export type FraudFlag = {
  returnId: string;
  userId: string;
  reason: string;
  amount: number;
  status: string;
  createdAt: string;
};

// Surfaces returns for abuse-prone reasons or on high-refund accounts.
export async function listFraudFlags(): Promise<FraudFlag[]> {
  if (!isSupabaseConfigured()) return [];
  const db = createAdminClient();
  const { data, error } = await db
    .from("return_requests")
    .select("id, user_id, reason, amount, status, created_at")
    .in("reason", ["better_price", "no_longer_needed"])
    .order("created_at", { ascending: false })
    .limit(100);
  logIfError("listFraudFlags", error);
  return (data ?? []).map((r) => ({
    returnId: r.id,
    userId: r.user_id,
    reason: r.reason,
    amount: Number(r.amount),
    status: r.status,
    createdAt: r.created_at,
  }));
}
