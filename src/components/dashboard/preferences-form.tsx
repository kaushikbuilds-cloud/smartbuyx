"use client";

import { useActionState } from "react";
import { useTheme } from "next-themes";
import { updateUiPrefs, type PrefsActionState, type Preferences } from "@/features/account/preferences";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LANGS = [
  ["en", "English"], ["hi", "हिन्दी"], ["ta", "தமிழ்"], ["te", "తెలుగు"],
  ["kn", "ಕನ್ನಡ"], ["ml", "മലയാളം"], ["mr", "मराठी"], ["bn", "বাংলা"],
] as const;

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function PreferencesForm({ initial }: { initial: Preferences["ui"] }) {
  const [state, action] = useActionState<PrefsActionState, FormData>(updateUiPrefs, null);
  const { theme, setTheme } = useTheme();

  return (
    <form action={action} className="space-y-6">
      <div>
        <Label className="mb-2 block">Appearance</Label>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors",
                theme === t.value ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" : "hover:bg-muted"
              )}
            >
              <t.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Theme is applied instantly and saved per device.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="language">Language</Label>
          <select
            id="language"
            name="language"
            defaultValue={initial?.language ?? "en"}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {LANGS.map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            name="currency"
            defaultValue={initial?.currency ?? "INR"}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="INR">₹ INR — Indian Rupee</option>
            <option value="USD">$ USD — US Dollar</option>
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="region">Region / Location</Label>
        <Input id="region" name="region" defaultValue={initial?.region ?? "IN"} placeholder="IN" maxLength={3} />
        <p className="text-xs text-muted-foreground">2-letter country code. Affects shipping and listings.</p>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Save preferences</SubmitButton>
    </form>
  );
}
