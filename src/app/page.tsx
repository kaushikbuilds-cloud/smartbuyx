import { redirect } from "next/navigation";
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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  // Defensive fallback: if Supabase's Redirect URLs allowlist doesn't include
  // our real callback path, it silently falls back to the bare Site URL,
  // landing an unconsumed OAuth/magic-link ?code= here instead of /callback.
  // Finish the exchange here rather than leaving the user stuck "signed in"
  // but still logged out.
  const { code, next } = await searchParams;
  if (code) {
    redirect(`/callback?code=${encodeURIComponent(code)}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

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
