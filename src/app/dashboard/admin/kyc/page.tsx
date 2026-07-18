import { FileCheck2 } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { listKycDocuments } from "@/features/admin/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KycReviewActions } from "@/components/admin/kyc-review-actions";

export const metadata = { title: "KYC Review · Admin" };
export const dynamic = "force-dynamic";

const DOC_LABEL: Record<string, string> = {
  pan: "PAN card",
  gst_certificate: "GST certificate",
  government_id: "Government ID",
  address_proof: "Address proof",
  business_registration: "Business registration",
};

const STATUS_VARIANT: Record<string, "secondary" | "success" | "destructive"> = {
  pending: "secondary",
  approved: "success",
  rejected: "destructive",
};

export default async function AdminKycPage() {
  await requireRole("admin", "superadmin");
  const docs = await listKycDocuments();

  return (
    <main className="space-y-4">
      <div className="flex items-center gap-2">
        <FileCheck2 className="h-5 w-5 text-rose-600" />
        <h1 className="text-2xl font-bold">KYC Review</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Seller identity &amp; business documents. View links are short-lived signed URLs — the files stay in a private bucket.
      </p>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="p-3">Seller</th>
                <th className="p-3">Document</th>
                <th className="p-3">Uploaded</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{d.owner_name ?? "—"}</td>
                  <td className="p-3">
                    {d.signed_url ? (
                      <a href={d.signed_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">
                        {DOC_LABEL[d.doc_type] ?? d.doc_type}
                      </a>
                    ) : (
                      DOC_LABEL[d.doc_type] ?? d.doc_type
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{new Date(d.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="p-3"><Badge variant={STATUS_VARIANT[d.status] ?? "secondary"} className="capitalize">{d.status}</Badge></td>
                  <td className="p-3">{d.status === "pending" ? <KycReviewActions id={d.id} /> : null}</td>
                </tr>
              ))}
              {docs.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No KYC documents submitted yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
