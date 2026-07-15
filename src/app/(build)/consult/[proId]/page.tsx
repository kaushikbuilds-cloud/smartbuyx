import { requireUser } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { ConsultationForm } from "@/components/projects/consultation-form";

export const metadata = { title: "Book Consultation" };

export default async function BookConsultPage({
  params,
  searchParams,
}: {
  params: Promise<{ proId: string }>;
  searchParams: Promise<{ role?: string; name?: string }>;
}) {
  await requireUser();
  const { proId } = await params;
  const { role = "architect", name } = await searchParams;

  return (
    <main className="container mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Book a consultation</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        with {name ?? "this professional"} · <span className="capitalize">{role.replace("_", " ")}</span>
      </p>
      <Card>
        <CardContent className="p-6">
          <ConsultationForm proId={proId} proRole={role} />
        </CardContent>
      </Card>
    </main>
  );
}
