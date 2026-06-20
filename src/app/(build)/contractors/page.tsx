import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listPros } from "@/features/pros/queries";
import { ProGrid } from "@/components/shop/pro-grid";

export const metadata = { title: "Contractors" };

export default async function ContractorsPage() {
  const pros = await listPros("contractor");
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Contractors</h1>
          <p className="text-muted-foreground">Labour planning, execution, and progress tracking.</p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/rfq/new">Post a brief</Link>
        </Button>
      </div>
      <ProGrid pros={pros} rfqCta="Find contractors for me" />
    </main>
  );
}
