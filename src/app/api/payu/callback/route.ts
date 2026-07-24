import { NextResponse, type NextRequest } from "next/server";
import { handlePayuResult } from "@/features/orders/payu-result";

// Both surl and furl point here (see createCheckoutOrder) -- PayU decides
// success vs failure server-side and POSTs the outcome, so one route is
// simpler than duplicating verification logic across two files. This is the
// browser-facing path: it redirects the customer to a result page. The
// server-to-server /api/payu/webhook route (configured in PayU's dashboard)
// covers the case where the customer's browser never makes it back here.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const result = await handlePayuResult(form);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (result.status === "captured") {
    return NextResponse.redirect(`${appUrl}/checkout/success?order=${result.orderId}`, 303);
  }
  return NextResponse.redirect(`${appUrl}/checkout/failure${result.orderId ? `?order=${result.orderId}` : ""}`, 303);
}
