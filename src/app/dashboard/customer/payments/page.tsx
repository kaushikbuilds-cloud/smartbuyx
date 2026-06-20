import { CreditCard, CheckCircle2, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listPaymentMethods } from "@/features/account/payment-methods";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/dashboard/page-shell";
import { UpiForm } from "@/components/shop/upi-form";
import { PaymentMethodRowActions } from "@/components/shop/payment-method-row-actions";

export const metadata = { title: "Payment Methods" };

export default async function PaymentsPage() {
  const { user } = await requireUser();
  const methods = await listPaymentMethods(user.id);

  return (
    <PageShell title="Payment Methods" description="Save UPI IDs for faster checkout.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="font-semibold">Saved methods ({methods.length})</h2>
            {methods.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                <CreditCard className="h-10 w-10" />
                <p>No payment methods saved yet.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {methods.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{m.label ?? m.upi_id ?? m.kind.toUpperCase()}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.upi_id}</p>
                    </div>
                    {m.is_default ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Default
                      </Badge>
                    ) : null}
                    <PaymentMethodRowActions id={m.id} isDefault={m.is_default} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            <h2 className="font-semibold">Add UPI</h2>
            <UpiForm />
            <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <p>We never store card numbers or CVVs. Card payments are tokenized through Razorpay automatically on first paid order.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
