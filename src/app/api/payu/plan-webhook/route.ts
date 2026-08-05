import { NextResponse, type NextRequest } from "next/server";
import { handlePayuPlanResult } from "@/features/billing/payu-result";

// Register this URL in PayU dashboard -> Developers -> Webhooks (separate
// entry from the order webhook): https://www.smartbuyx.in/api/payu/plan-webhook
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  const form = contentType.includes("application/json")
    ? formDataFromJson(await req.json())
    : await req.formData();

  const result = await handlePayuPlanResult(form);
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
