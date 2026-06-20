import { Gift, Copy } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/dashboard/page-shell";

export const metadata = { title: "Invite & Earn" };

export default async function InvitePage() {
  const { user } = await requireUser();
  // Stable referral code derived from user id.
  const code = `SMART-${user.id.slice(0, 6).toUpperCase()}`;
  const link = `https://smartbuyx.in/?ref=${code}`;

  return (
    <PageShell title="Invite & Earn" description="Earn 100 Smart Coins for every friend who shops.">
      <Card>
        <CardContent className="space-y-6 p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-600/30">
              <Gift className="h-8 w-8" />
            </span>
            <div>
              <h2 className="text-2xl font-bold">Share SmartBuyX with friends</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You get 100 Smart Coins · They get a ₹100 welcome coupon
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your referral code</p>
            <div className="mt-2 flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3 font-mono">
              <span className="flex-1 text-lg font-bold">{code}</span>
              <Button size="sm" variant="outline"><Copy className="h-4 w-4" /> Copy</Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Share link</p>
            <div className="mt-2 flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3">
              <span className="flex-1 truncate text-sm">{link}</span>
              <Button size="sm" variant="outline"><Copy className="h-4 w-4" /> Copy</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
