import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SettingsSection, SettingsCard } from "@/components/dashboard/settings-section";
import { WishlistPrefsForm } from "@/components/dashboard/wishlist-prefs-form";

export const metadata = { title: "Wishlist Settings" };

export default async function WishlistSettingsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("wishlist_public, username")
    .eq("id", user.id)
    .single();

  const handle = profile?.username ?? user.id.slice(0, 8);
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/u/${handle}/wishlist`;

  return (
    <SettingsSection title="Wishlist" description="Privacy, sharing and price tracking.">
      <SettingsCard title="Visibility &amp; sharing">
        <WishlistPrefsForm initialPublic={profile?.wishlist_public ?? false} shareUrl={shareUrl} />
      </SettingsCard>

      <SettingsCard title="Auto price tracking" description="Get notified when wishlisted items drop in price.">
        <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
          Auto-track is <strong>on</strong> by default for everything you wishlist. Manage targets and alerts in the{" "}
          <Link href="/dashboard/customer/alerts" className="text-primary hover:underline inline-flex items-center gap-1">
            Price Alerts page <ArrowRight className="h-3 w-3" />
          </Link>
          .
        </p>
        <Button variant="outline" asChild>
          <Link href="/wishlist"><Heart className="h-4 w-4" /> View my wishlist</Link>
        </Button>
      </SettingsCard>
    </SettingsSection>
  );
}
