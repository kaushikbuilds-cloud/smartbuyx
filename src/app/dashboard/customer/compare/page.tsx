import { requireUser } from "@/lib/auth/guards";
import { PageShell, ComingSoonCard } from "@/components/dashboard/page-shell";

export const metadata = { title: "Compare" };

export default async function ComparePage() {
  await requireUser();
  return (
    <PageShell title="Compare Products" description="Pick up to 4 products and see them side by side.">
      <ComingSoonCard message="Add a compare button on every product card to build your shortlist." />
    </PageShell>
  );
}
