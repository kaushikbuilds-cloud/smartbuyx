import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const SITE_URL = "https://smartbuyx.in";

const STATIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/products", priority: 0.9, changeFrequency: "hourly" as const },
  { path: "/materials", priority: 0.9, changeFrequency: "hourly" as const },
  { path: "/suppliers", priority: 0.8, changeFrequency: "daily" as const },
  { path: "/architects", priority: 0.7, changeFrequency: "daily" as const },
  { path: "/contractors", priority: 0.7, changeFrequency: "daily" as const },
  { path: "/interior-designers", priority: 0.7, changeFrequency: "daily" as const },
  { path: "/estimator", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/cost-calculator", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/house-builder", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/reels", priority: 0.6, changeFrequency: "daily" as const },
  { path: "/plans", priority: 0.5, changeFrequency: "weekly" as const },
  { path: "/login", priority: 0.3, changeFrequency: "monthly" as const },
  { path: "/register", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/legal/privacy", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/legal/terms", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/legal/refund-policy", priority: 0.2, changeFrequency: "yearly" as const },
  { path: "/legal/shipping-policy", priority: 0.2, changeFrequency: "yearly" as const },
];

// Dynamic: real product/category/supplier URLs so search engines can discover
// listings without crawling through client-side filters. Capped well under
// the 50k-per-file sitemap limit; safe to raise later if the catalog grows.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  if (!isSupabaseConfigured()) return staticEntries;

  try {
    const supabase = await createClient();
    const [{ data: products }, { data: categories }, { data: suppliers }] = await Promise.all([
      supabase
        .from("products")
        .select("slug, updated_at")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(5000),
      supabase.from("categories").select("slug"),
      supabase.from("supplier_profiles").select("user_id").limit(2000),
    ]);

    const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const categoryEntries: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
      url: `${SITE_URL}/products?category=${c.slug}`,
      changeFrequency: "daily",
      priority: 0.5,
    }));

    const supplierEntries: MetadataRoute.Sitemap = (suppliers ?? []).map((s) => ({
      url: `${SITE_URL}/suppliers/${s.user_id}`,
      changeFrequency: "weekly",
      priority: 0.4,
    }));

    return [...staticEntries, ...productEntries, ...categoryEntries, ...supplierEntries];
  } catch {
    // If the DB is briefly unreachable, still serve the static routes rather than a broken sitemap.
    return staticEntries;
  }
}
