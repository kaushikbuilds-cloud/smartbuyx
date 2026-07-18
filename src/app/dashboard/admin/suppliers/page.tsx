import { listProApplications } from "@/features/admin/queries";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrustScoreBadge } from "@/components/shop/trust-score-badge";
import { ApplicationActions, GstVerifyButton } from "@/components/admin/application-actions";

export const metadata = { title: "Suppliers · Admin" };
// Admin moderation queue — always read fresh from the DB, never serve a
// cached snapshot. A missing revalidatePath() call elsewhere shouldn't be
// able to hide a real pending application from admins.
export const dynamic = "force-dynamic";

export default async function AdminSuppliersPage() {
  const applications = await listProApplications();

  const db = createAdminClient();
  const { data: suppliers } = await db
    .from("supplier_profiles")
    .select("user_id, business_name, gstin, gstin_verified, trust_score, rating_avg, rating_count")
    .order("trust_score", { ascending: false })
    .limit(100);

  // applications arrive newest-first; keep only the latest row per applicant so
  // a resubmission (new row) doesn't show alongside its stale predecessor.
  const seenUsers = new Set<string>();
  const latestPerUser = applications.filter((a) => {
    if (seenUsers.has(a.user_id)) return false;
    seenUsers.add(a.user_id);
    return true;
  });
  const OPEN_STATUSES = ["pending", "under_review", "info_requested"];
  const pending = latestPerUser.filter((a) => OPEN_STATUSES.includes(a.status));

  const STATUS_BADGE: Record<string, { label: string; variant: "secondary" | "default" | "outline" }> = {
    pending: { label: "Pending", variant: "secondary" },
    under_review: { label: "Under review", variant: "default" },
    info_requested: { label: "Info requested", variant: "outline" },
  };

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suppliers &amp; Applications</h1>
        <p className="text-sm text-muted-foreground">Approve pro applications and verify GST.</p>
      </div>

      {/* Pending applications */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 font-semibold">Open applications ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open applications.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((a) => (
                <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{a.business_name}</p>
                      <Badge variant={STATUS_BADGE[a.status]?.variant ?? "secondary"}>{STATUS_BADGE[a.status]?.label ?? a.status}</Badge>
                      <Badge variant="secondary" className="capitalize">{a.requested_role}</Badge>
                      {a.business_type ? (
                        <Badge variant="outline" className="capitalize">{a.business_type.replace(/_/g, " ")}</Badge>
                      ) : null}
                      {a.gstin ? <Badge variant="outline">GST: {a.gstin}</Badge> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {a.category ? <span className="capitalize">{a.category.replace(/_/g, " ")} · </span> : null}
                      {[a.city, a.state].filter(Boolean).join(", ")}
                      {a.city || a.state ? " · " : ""}
                      {new Date(a.created_at).toLocaleDateString("en-IN")}
                    </p>
                    {a.description ? (
                      <p className="max-w-prose text-xs text-muted-foreground">{a.description}</p>
                    ) : null}
                    {a.phone ? <p className="text-xs text-muted-foreground">☎ {a.phone}</p> : null}
                    {a.review_note ? (
                      <p className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                        Info requested: {a.review_note}
                      </p>
                    ) : null}
                  </div>
                  <ApplicationActions id={a.id} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Supplier directory */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 font-semibold">Suppliers ({suppliers?.length ?? 0})</h2>
          {(suppliers ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No suppliers yet.</p>
          ) : (
            <ul className="space-y-2">
              {(suppliers ?? []).map((s) => (
                <li key={s.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{s.business_name}</p>
                      <TrustScoreBadge score={s.trust_score ?? 0} verified={s.gstin_verified} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      GSTIN: {s.gstin ?? "—"}
                      {s.gstin_verified ? <Badge variant="success" className="ml-2">Verified</Badge> : null}
                    </p>
                  </div>
                  <GstVerifyButton userId={s.user_id} verified={s.gstin_verified} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
