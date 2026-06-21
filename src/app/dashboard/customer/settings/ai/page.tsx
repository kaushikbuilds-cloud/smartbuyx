import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SettingsSection, SettingsCard } from "@/components/dashboard/settings-section";
import { AiPrefsForm } from "@/components/dashboard/ai-prefs-form";

export const metadata = { title: "AI Preferences" };

export default async function AiSettingsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .single();

  const prefs = (profile?.preferences ?? {}) as { ai?: { recs_on?: boolean; brands?: string[]; categories?: string[]; budget_min?: number; budget_max?: number } };

  return (
    <SettingsSection title="AI Assistant" description="Make SmartBuyX AI smarter about you.">
      <SettingsCard>
        <AiPrefsForm initial={prefs.ai as never} />
      </SettingsCard>

      <SettingsCard title="Try your AI assistant">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5" />
            <p className="text-sm">Ready to test? Ask for product picks tuned to your preferences.</p>
          </div>
          <Button variant="secondary" className="bg-white text-purple-700 hover:bg-white/90" asChild>
            <Link href="/assistant">Open assistant <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </SettingsCard>
    </SettingsSection>
  );
}
