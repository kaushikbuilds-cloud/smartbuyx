"use client";

import { useActionState } from "react";
import { updateNotifications, type PrefsActionState, type Preferences } from "@/features/account/preferences";
import { Switch } from "@/components/ui/switch";
import { SubmitButton } from "@/components/auth/submit-button";

const TYPE_TOGGLES = [
  { name: "order_updates", label: "Order updates", desc: "Status changes, delivery alerts, refunds" },
  { name: "price_drops", label: "Price drop alerts", desc: "Watched products reaching your target" },
  { name: "wishlist_alerts", label: "Wishlist alerts", desc: "Back-in-stock and special offers" },
  { name: "promos", label: "Promotional offers", desc: "Coupons, festival sales, partner deals" },
] as const;

const CHANNEL_TOGGLES = [
  { name: "email", label: "Email notifications" },
  { name: "sms", label: "SMS notifications" },
  { name: "push", label: "Push notifications" },
  { name: "whatsapp", label: "WhatsApp notifications" },
] as const;

export function NotificationsForm({ initial }: { initial: Preferences["notifications"] }) {
  const [state, action] = useActionState<PrefsActionState, FormData>(updateNotifications, null);
  return (
    <form action={action} className="space-y-6">
      <div>
        <p className="mb-1 text-sm font-medium">What you want</p>
        <p className="mb-3 text-xs text-muted-foreground">Choose the types of updates you care about.</p>
        <div className="divide-y">
          {TYPE_TOGGLES.map((t) => (
            <Switch
              key={t.name}
              name={t.name}
              label={t.label}
              description={t.desc}
              defaultChecked={initial?.[t.name] ?? true}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">How you get it</p>
        <p className="mb-3 text-xs text-muted-foreground">Channels we&apos;ll use.</p>
        <div className="divide-y">
          {CHANNEL_TOGGLES.map((t) => (
            <Switch
              key={t.name}
              name={t.name}
              label={t.label}
              defaultChecked={initial?.[t.name] ?? (t.name === "email" || t.name === "push")}
            />
          ))}
        </div>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Save notification preferences</SubmitButton>
    </form>
  );
}
