import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Payment failed" };

export default async function CheckoutFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <main className="container mx-auto flex flex-col items-center gap-4 px-4 py-24 text-center">
      <XCircle className="h-16 w-16 text-destructive" />
      <h1 className="text-3xl font-bold">Payment didn't go through</h1>
      <p className="max-w-md text-muted-foreground">
        Your order wasn't charged. You can try again, or reach out to support if the amount was deducted from your account.
      </p>
      <div className="mt-2 flex gap-3">
        <Button variant="gradient" asChild><Link href="/checkout">Try again</Link></Button>
        {order ? (
          <Button variant="outline" asChild><Link href="/dashboard/customer/support">Contact support</Link></Button>
        ) : null}
      </div>
    </main>
  );
}
