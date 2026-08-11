import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "Confirming your order..." };
export const dynamic = "force-dynamic";

// Landing page after Fastrr's checkout iframe completes -- fulfilment itself
// happens server-to-server via the order webhook (see
// /api/fastrr/order-webhook), not here. This page is UX only: if the
// webhook has already landed by the time the browser gets here, jump
// straight to the order; otherwise show a short "still confirming" state,
// since the webhook can arrive a moment after this redirect.
export default async function FastrrReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const { user } = await requireUser();
  const supabase = await createClient();

  if (ref) {
    const { data: session } = await supabase
      .from("fastrr_checkout_sessions")
      .select("status")
      .eq("id", ref)
      .eq("user_id", user.id)
      .maybeSingle();

    if (session?.status === "completed") {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("session_ref", ref)
        .maybeSingle();
      if (order) redirect(`/orders/${order.id}`);
    }
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="mb-2 text-xl font-bold">Confirming your order…</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        This usually takes just a few seconds. If it doesn't update, check My Orders in a moment.
      </p>
      <div className="flex justify-center gap-2">
        <Button variant="outline" asChild><Link href={`/checkout/fastrr-return${ref ? `?ref=${ref}` : ""}`}>Refresh</Link></Button>
        <Button variant="gradient" asChild><Link href="/orders">My Orders</Link></Button>
      </div>
    </main>
  );
}
