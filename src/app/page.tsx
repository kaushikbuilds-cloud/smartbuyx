import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/guards";
import { getMode } from "@/features/preferences/mode";
import { AppShell } from "@/components/layout/app-shell";
import { CustomerDashboardHome } from "@/components/dashboard/customer-dashboard-home";
import { BuildDashboardHome } from "@/components/dashboard/build-dashboard-home";
import { MarketingLanding } from "@/components/marketing/landing";

// Organization + WebSite JSON-LD: what search engines actually crawl here is
// the logged-out marketing view, so this is what feeds Google's knowledge
// panel / sitelinks search box eligibility for the brand.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://smartbuyx.in/#organization",
      name: "SmartBuyX",
      url: "https://smartbuyx.in",
      logo: "https://smartbuyx.in/icon",
      description: "India's AI-powered commerce and construction super-app.",
    },
    {
      "@type": "WebSite",
      "@id": "https://smartbuyx.in/#website",
      url: "https://smartbuyx.in",
      name: "SmartBuyX",
      publisher: { "@id": "https://smartbuyx.in/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://smartbuyx.in/products?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    return (
      <AppShell>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <MarketingLanding />
      </AppShell>
    );
  }

  const [supabase, mode] = await Promise.all([createClient(), getMode()]);
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.user.id)
    .single();
  const firstName = (profile?.full_name ?? session.user.email ?? "there").split(" ")[0];

  return (
    <AppShell>
      {mode === "build" ? (
        <BuildDashboardHome userId={session.user.id} firstName={firstName} />
      ) : (
        <CustomerDashboardHome userId={session.user.id} firstName={firstName} />
      )}
    </AppShell>
  );
}
