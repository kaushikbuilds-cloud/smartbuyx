import { NextResponse, type NextRequest } from "next/server";
import { handlePayuPlanResult } from "@/features/billing/payu-result";

// Both surl and furl point here (see startPlanCheckout) -- mirrors
// /api/payu/callback but for subscription payments.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const result = await handlePayuPlanResult(form);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (result.status === "captured") {
    return NextResponse.redirect(`${appUrl}/dashboard/subscription?subscribed=1`, 303);
  }
  return NextResponse.redirect(`${appUrl}/plans?payment=failed`, 303);
}
