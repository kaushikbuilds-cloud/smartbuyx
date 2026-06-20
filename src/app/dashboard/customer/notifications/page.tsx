import { BellRing } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/dashboard/page-shell";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, kind, payload, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <PageShell title="Notifications" description="Order updates, RFQ replies, and price drops.">
      {(notifications ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
            <BellRing className="h-10 w-10" />
            <p>You&apos;re all caught up.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {(notifications ?? []).map((n) => {
              const payload = n.payload as Record<string, unknown>;
              const title = (payload?.title as string) ?? n.kind.replace(/[._]/g, " ");
              return (
                <div key={n.id} className={`flex items-start gap-3 p-4 ${n.read_at ? "" : "bg-purple-50/40 dark:bg-purple-950/10"}`}>
                  <span className="mt-1 flex h-2 w-2 rounded-full bg-purple-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize">{title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
