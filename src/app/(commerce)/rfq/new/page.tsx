import { requireUser } from "@/lib/auth/guards";
import { RfqForm } from "@/components/shop/rfq-form";

export const metadata = { title: "New RFQ" };

export default async function NewRfqPage() {
  await requireUser();
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">New Request for Quotation</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Tell us what you need. One submission reaches hundreds of verified suppliers.
      </p>
      <RfqForm />
    </main>
  );
}
