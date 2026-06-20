import { Ticket, Tag } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/dashboard/page-shell";
import { formatINR } from "@/lib/utils/format";

export const metadata = { title: "Coupons" };

export default async function CouponsPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: coupons } = await supabase
    .from("coupons")
    .select("id, code, kind, value, min_order, max_discount, ends_at")
    .eq("active", true)
    .order("ends_at", { ascending: true });

  return (
    <PageShell title="Coupons" description="Active offers you can apply at checkout.">
      {(coupons ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
            <Ticket className="h-10 w-10" />
            <p>No active coupons right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(coupons ?? []).map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <CardContent className="flex items-center gap-4 p-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white">
                  <Tag className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold">
                    {c.kind === "percent" ? `${c.value}% off` : `${formatINR(Number(c.value))} off`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min order {formatINR(Number(c.min_order))}
                    {c.ends_at ? ` · Expires ${new Date(c.ends_at).toLocaleDateString("en-IN")}` : ""}
                  </p>
                </div>
                <Badge variant="outline" className="font-mono">{c.code}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
