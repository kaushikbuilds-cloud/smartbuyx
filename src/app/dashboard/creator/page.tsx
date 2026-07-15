import { Video, Wallet, Link2 } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getMyReels, getMyAffiliateLinks } from "@/features/creator/queries";
import { formatINR } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PublishReelForm } from "@/components/creator/publish-reel-form";
import { AffiliateLinkForm } from "@/components/creator/affiliate-link-form";

export const metadata = { title: "Creator Studio" };

export default async function CreatorDashboard() {
  const { user } = await requireRole("creator", "admin", "superadmin");
  const [reels, links] = await Promise.all([getMyReels(user.id), getMyAffiliateLinks(user.id)]);
  const totalEarnings = links.reduce((s, l) => s + l.totalEarnings, 0);

  return (
    <main className="container mx-auto space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Creator Studio</h1>
        <p className="text-sm text-muted-foreground">Publish shoppable reels and track affiliate earnings.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="flex items-center gap-3 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300"><Video className="h-5 w-5" /></span>
          <div><p className="text-xl font-bold">{reels.length}</p><p className="text-xs text-muted-foreground">Reels</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"><Wallet className="h-5 w-5" /></span>
          <div><p className="text-xl font-bold">{formatINR(totalEarnings)}</p><p className="text-xs text-muted-foreground">Affiliate earnings</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"><Link2 className="h-5 w-5" /></span>
          <div><p className="text-xl font-bold">{links.length}</p><p className="text-xs text-muted-foreground">Active links</p></div>
        </CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-semibold">Publish a reel</h2>
            <PublishReelForm />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="font-semibold">My reels</h2>
            {reels.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reels published yet.</p>
            ) : (
              <ul className="divide-y">
                {reels.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                    <span>{r.title ?? "Untitled"}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={r.status === "published" ? "success" : "secondary"}>{r.status}</Badge>
                      {r.views} views
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">Affiliate links</h2>
          <AffiliateLinkForm />
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">No affiliate links yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="pb-2">Product</th><th className="pb-2">Code</th><th className="pb-2 text-right">Commission</th><th className="pb-2 text-right">Total earned</th></tr>
              </thead>
              <tbody>
                {links.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="py-2">{l.productTitle}</td>
                    <td className="py-2 font-mono text-xs">{l.code}</td>
                    <td className="py-2 text-right">{l.commissionPct}%</td>
                    <td className="py-2 text-right font-semibold">{formatINR(l.totalEarnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
