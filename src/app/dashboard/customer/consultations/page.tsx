import { CalendarClock, Video, MapPin, MessageSquare } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getMyConsultations } from "@/features/consultations/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageShell, ComingSoonCard } from "@/components/dashboard/page-shell";
import { CancelConsultationButton } from "@/components/projects/cancel-consultation-button";

export const metadata = { title: "Consultations" };

const MODE_ICON = { video: Video, in_person: MapPin, chat: MessageSquare } as const;

export default async function ConsultationsPage() {
  const { user } = await requireUser();
  const consultations = await getMyConsultations(user.id);

  return (
    <PageShell title="Consultations" description="Scheduled calls with architects, engineers, contractors & designers.">
      {consultations.length === 0 ? (
        <ComingSoonCard message="Book a consultation from any pro's profile — sessions will show up here." />
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => {
            const Icon = MODE_ICON[c.mode as keyof typeof MODE_ICON] ?? Video;
            const upcoming = new Date(c.scheduledAt) > new Date() && c.status === "scheduled";
            return (
              <Card key={c.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-medium">{c.counterpartyName ?? "Consultation"}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {c.proRole.replace("_", " ")} · {new Date(c.scheduledAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === "cancelled" ? "destructive" : "secondary"} className="capitalize">{c.status}</Badge>
                    {upcoming ? <CancelConsultationButton id={c.id} /> : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
