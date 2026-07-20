import { Camera } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { ImageSearchForm } from "@/components/ai/image-search-form";

export const metadata = { title: "Search by Photo" };

export default async function ImageSearchPage() {
  await requireUser();
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-md">
          <Camera className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">Search by Photo</h1>
          <p className="text-sm text-muted-foreground">Upload a photo — AI identifies it and finds matching items in our catalog.</p>
        </div>
      </div>
      <ImageSearchForm />
    </main>
  );
}
