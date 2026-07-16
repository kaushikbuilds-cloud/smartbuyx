// WhatsApp Business notifications via MSG91's WhatsApp API.
// Degrades silently when unconfigured — never blocks the caller's main flow.

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER);
}

// `templateName` must already be an approved WhatsApp template in the MSG91 dashboard.
export async function sendWhatsAppTemplate(
  toPhone: string,
  templateName: string,
  params: string[]
): Promise<{ ok: boolean; error?: string }> {
  if (!isWhatsAppConfigured()) return { ok: false, error: "WhatsApp not configured." };

  const digits = toPhone.replace(/\D/g, "");
  const to = digits.length === 10 ? `91${digits}` : digits;

  try {
    const res = await fetch("https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/", {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: process.env.MSG91_AUTH_KEY! },
      body: JSON.stringify({
        integrated_number: process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER,
        content_type: "template",
        payload: {
          messaging_product: "whatsapp",
          type: "template",
          template: {
            name: templateName,
            language: { code: "en", policy: "deterministic" },
            to_and_components: [
              { to: [to], components: { body_1: { type: "text", value: params[0] ?? "" } } },
            ],
          },
        },
      }),
    });
    if (!res.ok) return { ok: false, error: `MSG91 error ${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "WhatsApp send failed." };
  }
}
