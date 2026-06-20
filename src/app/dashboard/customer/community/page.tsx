import { requireUser } from "@/lib/auth/guards";
import { PageShell, ComingSoonCard } from "@/components/dashboard/page-shell";

export const metadata = { title: "Community" };

export default async function CommunityPage() {
  await requireUser();
  return (
    <PageShell title="Community Discussions" description="Ask, compare, learn from other buyers.">
      <ComingSoonCard message="Post questions about products, compare brands, and crowdsource decisions from other buyers. Launching with Phase 5." />
    </PageShell>
  );
}
