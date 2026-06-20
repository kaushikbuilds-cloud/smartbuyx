import { requireUser } from "@/lib/auth/guards";

export default async function AssistantPage() {
  await requireUser();
  return <main className="container mx-auto p-8"><h1 className="text-2xl font-bold">AI Shopping Assistant</h1></main>;
}
