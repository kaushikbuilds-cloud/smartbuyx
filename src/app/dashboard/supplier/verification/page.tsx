import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { getMyPayoutDetails, getMyKycDocuments } from "@/features/seller/verification";
import { Card, CardContent } from "@/components/ui/card";
import { PayoutDetailsForm } from "@/components/dashboard/seller/payout-details-form";
import { KycUploader } from "@/components/dashboard/seller/kyc-uploader";

export const metadata = { title: "Verification · Seller" };
export const dynamic = "force-dynamic";

export default async function SellerVerificationPage() {
  const { user } = await requireRole("supplier", "d2c_brand", "admin", "superadmin");
  const [payout, documents] = await Promise.all([
    getMyPayoutDetails(user.id),
    getMyKycDocuments(user.id),
  ]);

  return (
    <main className="container mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">Verification & Payouts</h1>
          <p className="text-sm text-muted-foreground">Complete these to receive payouts and earn a Verified badge.</p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="font-semibold">Payout (bank) details</h2>
            <p className="text-sm text-muted-foreground">Where we send your earnings. Kept private and used only for payouts.</p>
          </div>
          <PayoutDetailsForm existing={payout} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <h2 className="font-semibold">KYC documents</h2>
            <p className="text-sm text-muted-foreground">Upload for identity and business verification. Stored privately; only our review team can access them.</p>
          </div>
          <KycUploader userId={user.id} documents={documents} />
        </CardContent>
      </Card>
    </main>
  );
}
