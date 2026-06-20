"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser, getSession } from "@/lib/auth/guards";

const upsertSchema = z.object({
  productId: z.string().uuid(),
  targetPrice: z.coerce.number().positive("Target price must be greater than 0"),
});

export type AlertActionState = { error?: string; success?: string } | null;

export async function upsertPriceAlert(_prev: AlertActionState, formData: FormData): Promise<AlertActionState> {
  const session = await getSession();
  if (!session) return { error: "Please log in." };
  const parsed = upsertSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("price_alerts")
    .upsert(
      {
        user_id: session.user.id,
        product_id: parsed.data.productId,
        target_price: parsed.data.targetPrice,
        active: true,
        triggered_at: null,
        notified_at: null,
      },
      { onConflict: "user_id,product_id" }
    );
  if (error) return { error: error.message };

  revalidatePath("/dashboard/customer/alerts");
  return { success: "Alert saved." };
}

export async function deletePriceAlert(id: string): Promise<void> {
  const { user } = await requireUser();
  const supabase = await createClient();
  await supabase.from("price_alerts").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/customer/alerts");
}

export type PriceAlertWithProduct = {
  id: string;
  product_id: string;
  target_price: number;
  current_price: number;
  triggered_at: string | null;
  created_at: string;
  title: string;
  slug: string;
  image: string | null;
};

export async function listMyAlerts(userId: string): Promise<PriceAlertWithProduct[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("price_alerts")
    .select("id, product_id, target_price, triggered_at, created_at, products(title, slug, base_price, images)")
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => {
    const p = row.products as unknown as { title: string; slug: string; base_price: number; images: { url: string }[] };
    return {
      id: row.id,
      product_id: row.product_id,
      target_price: Number(row.target_price),
      current_price: Number(p?.base_price ?? 0),
      triggered_at: row.triggered_at,
      created_at: row.created_at,
      title: p?.title ?? "Product",
      slug: p?.slug ?? "",
      image: p?.images?.[0]?.url ?? null,
    };
  });
}
