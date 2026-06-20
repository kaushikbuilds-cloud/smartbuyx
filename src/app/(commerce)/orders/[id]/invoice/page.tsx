import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getOrder } from "@/features/orders/order-queries";
import { formatINR } from "@/lib/utils/format";
import { PrintButton } from "@/components/shop/print-button";

export const metadata = { title: "Tax Invoice" };

// Prices are GST-inclusive; extract the tax component for the invoice (default 18%).
const GST_RATE = 18;

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser();
  const { id } = await params;
  const order = await getOrder(user.id, id);
  if (!order) notFound();

  const taxable = order.total / (1 + GST_RATE / 100);
  const gst = order.total - taxable;
  const cgst = gst / 2;
  const sgst = gst / 2;

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8 print:py-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Tax Invoice</h1>
        <PrintButton />
      </div>

      <div className="rounded-xl border p-8">
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <p className="text-xl font-bold">SmartBuyX</p>
            <p className="text-sm text-muted-foreground">India&apos;s Commerce + Construction ecosystem</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">TAX INVOICE</p>
            <p className="text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-IN")}</p>
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="pb-2">Item</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Rate</th>
              <th className="pb-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="py-2">{i.title}</td>
                <td className="py-2 text-right">{i.quantity}</td>
                <td className="py-2 text-right">{formatINR(i.unit_price)}</td>
                <td className="py-2 text-right">{formatINR(i.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto w-64 space-y-1 text-sm">
          <Row label="Taxable value" value={formatINR(taxable)} />
          <Row label={`CGST (${GST_RATE / 2}%)`} value={formatINR(cgst)} />
          <Row label={`SGST (${GST_RATE / 2}%)`} value={formatINR(sgst)} />
          {order.discount > 0 ? <Row label="Discount" value={`− ${formatINR(order.discount)}`} /> : null}
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatINR(order.total)}</span>
          </div>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          This is a computer-generated invoice. Prices are inclusive of GST.
        </p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
