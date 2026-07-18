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

  const pending = applications.filter((a) => a.status === "pending");

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suppliers &amp; Applications</h1>
        <p className="text-sm text-muted-foreground">Approve pro applications and verify GST.</p>
      </div>

      {/* Pending applications */}
      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 font-semibold">Pending applications ({pending.length})</h2>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending applications.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{a.business_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Wants: {a.requested_role} · {new Date(a.created_at).toLocaleDateString("en-IN")}
                    </p>
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
