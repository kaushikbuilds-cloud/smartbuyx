import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { YoupiPay } from "@/components/shop/youpi-pay";

export const metadata = { title: "Complete payment" };
export const dynamic = "force-dynamic";

// Ownership check first (order id alone isn't enough -- must belong to this
// buyer), then only while the payment is still unresolved. The amount shown to
// YouPI comes from our DB, never from the client.
export default async function PayPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const { user } = await requireUser();
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .maybeSingle();
  if (!order) notFound();

  const { data: payment } = await supabase
    .from("payments")
    .select("amount")
    .eq("order_id", orderId)
    .eq("status", "created")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!payment) notFound();

  return <YoupiPay orderId={orderId} amount={Number(payment.amount).toFixed(2)} />;
}
