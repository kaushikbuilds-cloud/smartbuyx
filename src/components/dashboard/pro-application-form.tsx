"use client";

import { useActionState } from "react";
import { submitProApplication, type ProApplicationState } from "@/features/onboarding/actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/submit-button";

const ROLES = [
  { value: "supplier", label: "Supplier — sell products or construction materials" },
  { value: "architect", label: "Architect — offer design consultations" },
  { value: "contractor", label: "Contractor — offer building/renovation services" },
];

const BUSINESS_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "private_limited", label: "Private Limited" },
  { value: "llp", label: "LLP" },
  { value: "other", label: "Other" },
];

const CATEGORIES = [
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "home_kitchen", label: "Home & Kitchen" },
  { value: "beauty", label: "Beauty" },
  { value: "books", label: "Books" },
  { value: "grocery", label: "Grocery" },
  { value: "construction", label: "Construction & Materials" },
  { value: "other", label: "Other" },
];

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-lg border p-4">
      <legend className="flex items-center gap-2 px-1 text-sm font-semibold">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[11px] text-white">{step}</span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function ProApplicationForm() {
  const [state, action] = useActionState<ProApplicationState, FormData>(submitProApplication, null);

  return (
    <form action={action} className="space-y-5">
      <Section step={1} title="What are you applying for?">
        <div className="grid gap-2">
          <Label htmlFor="requestedRole">Role</Label>
          <select id="requestedRole" name="requestedRole" required className={selectClass}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="businessName">Store / business name</Label>
          <Input id="businessName" name="businessName" required placeholder="e.g. SmartBuild Supplies" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Contact number</Label>
          <Input id="phone" name="phone" type="tel" required placeholder="e.g. +91 98765 43210" />
        </div>
      </Section>

      <Section step={2} title="Business details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="businessType">Business type</Label>
            <select id="businessType" name="businessType" required className={selectClass} defaultValue="">
              <option value="" disabled>Select…</option>
              {BUSINESS_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="yearsInBusiness">Years in business (optional)</Label>
            <Input id="yearsInBusiness" name="yearsInBusiness" type="number" min={0} placeholder="e.g. 3" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="gstin">GSTIN (optional)</Label>
          <Input id="gstin" name="gstin" placeholder="e.g. 29ABCDE1234F1Z5" />
          <p className="text-xs text-muted-foreground">Add it now to get verified faster — a Verified badge builds buyer trust.</p>
        </div>
      </Section>

      <Section step={3} title="Store information">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="category">Primary category</Label>
            <select id="category" name="category" required className={selectClass} defaultValue="">
              <option value="" disabled>Select…</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="website">Website (optional)</Label>
            <Input id="website" name="website" type="url" placeholder="https://…" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Store description</Label>
          <textarea id="description" name="description" rows={4} required
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="What you sell or offer, your specialties, service areas…" />
        </div>
      </Section>

      <Section step={4} title="Pickup / business address">
        <div className="grid gap-2">
          <Label htmlFor="addressLine1">Address line 1</Label>
          <Input id="addressLine1" name="addressLine1" required placeholder="Building, street" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="addressLine2">Address line 2 (optional)</Label>
          <Input id="addressLine2" name="addressLine2" placeholder="Area, landmark" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="postalCode">Postal code</Label>
            <Input id="postalCode" name="postalCode" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" defaultValue="IN" required />
          </div>
        </div>
      </Section>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="termsAccepted" required className="mt-0.5" />
        <span>I accept the Seller Terms &amp; Conditions and Privacy Policy, and confirm the information above is accurate.</span>
      </label>

      <p className="text-xs text-muted-foreground">
        Bank &amp; payout details and KYC documents are collected securely after your application is approved.
      </p>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-emerald-600">{state.success}</p> : null}
      <SubmitButton variant="gradient">Submit application</SubmitButton>
    </form>
  );
}
