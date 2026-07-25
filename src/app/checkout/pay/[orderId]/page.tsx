import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Redirecting to payment..." };
export const dynamic = "force-dynamic";

type PayuRequestFields = {
  payuUrl: string; key: string; txnid: string; amount: string; productinfo: string;
  firstname: string; email: string; phone: string; surl: string; furl: string; hash: string;
};

// Server-rendered auto-submitting form -- deliberately NOT built via client
// JavaScript DOM manipulation. This is the standard, widely-used pattern for
// redirecting to a hosted payment page: a real <form> that exists in the
// initial HTML, submitted by an inline script on load. Reached via a plain
// top-level navigation from the checkout page (see checkout-client.tsx),
// which sidesteps any complexity around dynamically-constructed forms.
export default async function PayuBridgePage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const { user } = await requireUser();
  const supabase = await createClient();

  // Ownership check first (order_id alone isn't enough -- must belong to
  // this buyer), then the one-time-use check on the payment itself: only
  // while it hasn't already been resolved. payments.order_id has no
  // uniqueness constraint, so query it directly (most recent "created" one)
  // rather than assume a to-one embed through orders.
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("buyer_id", user.id)
    .maybeSingle();
  if (!order) notFound();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, status, raw")
    .eq("order_id", orderId)
    .eq("status", "created")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!payment) notFound();

  const fields = (payment.raw as { payu_request_fields?: PayuRequestFields })?.payu_request_fields;
  if (!fields) notFound();

  const { payuUrl, ...formFields } = fields;

  return (
    <main style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "4rem" }}>
      <p>Redirecting to secure payment&hellip;</p>
      <form id="payu-form" method="POST" action={payuUrl}>
        {Object.entries(formFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
      <script dangerouslySetInnerHTML={{ __html: "document.getElementById('payu-form').submit();" }} />
    </main>
  );
}
