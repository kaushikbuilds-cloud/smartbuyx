import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listPros } from "@/features/pros/queries";
import { ProGrid } from "@/components/shop/pro-grid";
import { CatalogBreadcrumb } from "@/components/shop/catalog-breadcrumb";

export const metadata = { title: "Engineers" };

export default async function EngineersPage() {
  const pros = await listPros("engineer");
  return (
    <main className="container mx-auto space-y-4 px-4 py-4">
      <CatalogBreadcrumb trail={[{ label: "Hire a Pro", href: "/architects" }, { label: "Engineers" }]} />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Engineers</h1>
          <p className="text-xs text-muted-foreground">Structural design review, quality inspection and consultation.</p>
        </div>
        <Button variant="gradient" size="sm" asChild><Link href="/rfq/new">Post a brief</Link></Button>
      </div>
      <ProGrid pros={pros} rfqCta="Find engineers for me" />
    </main>
  );
}
