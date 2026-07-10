import { requireUser } from "@/lib/auth/guards";
import { AssistantChat } from "@/components/ai/assistant-chat";

export const metadata = { title: "AI Assistant" };

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const { q } = await searchParams;
  return (
    <main className="container mx-auto px-4">
      <AssistantChat initialQuery={q} />
    </main>
  );
}
