import { ClipboardList } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { ShoppingPlannerForm } from "@/components/ai/shopping-planner-form";

export const metadata = { title: "AI Shopping Planner" };

export default async function ShoppingPlannerPage() {
  await requireUser();
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
          <ClipboardList className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold">AI Shopping Planner</h1>
          <p className="text-sm text-muted-foreground">Describe your goal and budget — AI splits it into categories with real picks.</p>
        </div>
      </div>
      <ShoppingPlannerForm />
    </main>
  );
}
