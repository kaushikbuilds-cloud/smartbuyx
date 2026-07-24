import { NextResponse, type NextRequest } from "next/server";
import { handlePayuResult } from "@/features/orders/payu-result";

// Register this URL in PayU dashboard -> Developers -> Webhooks:
//   https://www.smartbuyx.in/api/payu/webhook
// Server-to-server confirmation, independent of the customer's browser --
// covers the case where /api/payu/callback (surl/furl) never fires because
// the customer closed the tab right after paying. Idempotent: safe if the
// callback already finalized the order (fulfilPaidOrder's atomic
// pending->paid claim means only one of the two paths actually runs the
// fulfilment body, no matter which arrives first).
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  const form = contentType.includes("application/json")
    ? formDataFromJson(await req.json())
    : await req.formData();

  const result = await handlePayuResult(form);
  if (result.status === "invalid") {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  return NextResponse.json({ received: true, status: result.status });
}

function formDataFromJson(body: Record<string, unknown>): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(body)) form.set(k, String(v));
  return form;
}
