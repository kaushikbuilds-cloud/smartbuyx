import { Store } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getMyProApplication } from "@/features/onboarding/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProApplicationForm } from "@/components/dashboard/pro-application-form";

export const metadata = { title: "Become a Seller" };

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive"> = {
  pending: "secondary",
  under_review: "default",
  info_requested: "default",
  approved: "success",
  rejected: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  under_review: "Under review",
  info_requested: "Info requested",
  approved: "Approved",
  rejected: "Rejected",
};

export default async function BecomeSellerPage() {
  const { user, role } = await requireUser();
  const application = await getMyProApplication(user.id);

  return (
    <main className="container mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
          <Store className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">Become a Seller or Pro</h1>
          <p className="text-sm text-muted-foreground">Sell products, materials, or offer professional services.</p>
        </div>
      </div>

      {/* 'buyer' is a legacy DB value for the base role, not a pro role — see migration 0016. */}
      {role !== "customer" && (role as string) !== "buyer" ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">
          Your account is already a {role} — no application needed.
        </CardContent></Card>
      ) : application && (application.status === "pending" || application.status === "under_review") ? (
        <Card>
          <CardContent className="space-y-2 p-6">
            <div className="flex items-center justify-between">
              <p className="font-medium">{application.business_name}</p>
              <Badge variant={STATUS_VARIANT[application.status]}>{STATUS_LABEL[application.status]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Requested: {application.requested_role} · Applied {new Date(application.created_at).toLocaleDateString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground">
              {application.status === "under_review"
                ? "Our team is reviewing your application now."
                : "We typically review within 24-48 hours."}
            </p>
          </CardContent>
        </Card>
      ) : application && application.status === "info_requested" ? (
        <>
          <Card className="mb-4 border-amber-300 dark:border-amber-800">
            <CardContent className="space-y-2 p-6">
              <div className="flex items-center justify-between">
                <p className="font-medium">More information needed</p>
                <Badge variant={STATUS_VARIANT[application.status]}>{STATUS_LABEL[application.status]}</Badge>
              </div>
              {application.review_note ? (
                <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  {application.review_note}
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground">Please update and resubmit your application below.</p>
            </CardContent>
          </Card>
          <Card><CardContent className="p-6"><ProApplicationForm /></CardContent></Card>
        </>
      ) : application && application.status === "rejected" ? (
        <>
          <Card className="mb-4 border-destructive/30">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Your last application for <span className="font-medium">{application.requested_role}</span> wasn&apos;t approved. You can apply again below.
            </CardContent>
          </Card>
          <Card><CardContent className="p-6"><ProApplicationForm /></CardContent></Card>
        </>
      ) : (
        <Card><CardContent className="p-6"><ProApplicationForm /></CardContent></Card>
      )}
    </main>
  );
}
