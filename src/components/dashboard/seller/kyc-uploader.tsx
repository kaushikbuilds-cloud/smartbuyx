"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, FileCheck2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { recordKycDocument, type KycDocument } from "@/features/seller/verification";

const DOC_TYPES = [
  { value: "pan", label: "PAN card" },
  { value: "gst_certificate", label: "GST certificate" },
  { value: "government_id", label: "Government ID (Aadhaar/Passport/DL)" },
  { value: "address_proof", label: "Address proof" },
  { value: "business_registration", label: "Business registration" },
];

const DOC_LABEL = Object.fromEntries(DOC_TYPES.map((d) => [d.value, d.label]));

const STATUS_UI: Record<string, { label: string; className: string; Icon: typeof Clock }> = {
  pending: { label: "Pending review", className: "text-amber-600", Icon: Clock },
  approved: { label: "Approved", className: "text-emerald-600", Icon: FileCheck2 },
  rejected: { label: "Rejected", className: "text-destructive", Icon: XCircle },
};

export function KycUploader({ userId, documents }: { userId: string; documents: KycDocument[] }) {
  const [docType, setDocType] = useState(DOC_TYPES[0].value);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    // Path MUST start with the user's uid — storage RLS enforces this prefix.
    const path = `${userId}/${docType}-${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("kyc-docs").upload(path, file, { upsert: false });
    if (uploadError) {
      setUploading(false);
      e.target.value = "";
      toast.error(`Upload failed: ${uploadError.message}`);
      return;
    }
    const { error } = await recordKycDocument(docType, path);
    setUploading(false);
    e.target.value = "";
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`${DOC_LABEL[docType]} uploaded`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-2">
          <label htmlFor="docType" className="text-sm font-medium">Document type</label>
          <select
            id="docType"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            disabled={uploading}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm hover:bg-accent">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Upload document"}
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">Accepted: JPG, PNG, WebP, PDF · up to 10 MB. Stored privately.</p>

      {documents.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {documents.map((doc) => {
            const ui = STATUS_UI[doc.status] ?? STATUS_UI.pending;
            return (
              <li key={doc.id} className="flex items-center justify-between p-3 text-sm">
                <span>{DOC_LABEL[doc.doc_type] ?? doc.doc_type}</span>
                <span className={`flex items-center gap-1.5 text-xs ${ui.className}`}>
                  <ui.Icon className="h-3.5 w-3.5" /> {ui.label}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      )}
    </div>
  );
}
