import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Redirecting to payment..." };
export const dynamic = "force-dynamic";

type PayuRequestFields = {
  payuUrl: string; key: string; txnid: string; amount: string; productinfo: string;
  firstname: string; email: string; phone: string; surl: string; furl: string; hash: string;
};

// Plan-payment counterpart to /checkout/pay/[orderId] -- same server-rendered
// auto-submitting <form> pattern (see that page for the CSP form-action
// reasoning this depends on).
export default async function PayuPlanBridgePage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const { user } = await requireUser();
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("plan_payments")
    .select("id, user_id, status, raw")
    .eq("id", paymentId)
    .eq("user_id", user.id)
    .eq("status", "created")
    .maybeSingle();
  if (!payment) notFound();

  const fields = (payment.raw as { payu_request_fields?: PayuRequestFields } | null)?.payu_request_fields;
  if (!fields) notFound();

  const { payuUrl, ...formFields } = fields;

  return (
    <main style={{ fontFamily: "sans-serif", textAlign: "center", marginTop: "4rem" }}>
      <p>Redirecting to secure payment&hellip;</p>
      <form id="payu-plan-form" method="POST" action={payuUrl}>
        {Object.entries(formFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
      <script dangerouslySetInnerHTML={{ __html: "document.getElementById('payu-plan-form').submit();" }} />
    </main>
  );
}
