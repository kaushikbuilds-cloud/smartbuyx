import { requireUser } from "@/lib/auth/guards";

// Tabs: 3D Model · Renders · Blueprint · Interior · Concept · Floor Plan · Cost · Smart · VR Tour · Vastu
export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">Project {id}</h1>
    </main>
  );
}
