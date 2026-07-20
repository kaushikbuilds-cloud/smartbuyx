import { Gift } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { GiftFinderForm } from "@/components/ai/gift-finder-form";

export const metadata = { title: "AI Gift Finder" };

export default async function GiftFinderPage() {
  await requireUser();
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md">
          <Gift className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">AI Gift Finder</h1>
          <p className="text-sm text-muted-foreground">Tell us who it's for — we'll pick real gifts from the catalog within budget.</p>
        </div>
      </div>
      <GiftFinderForm />
    </main>
  );
}
