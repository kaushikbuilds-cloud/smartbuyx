import { requireUser } from "@/lib/auth/guards";

export default async function MySubscriptionPage() {
  await requireUser();
  return <main className="p-8"><h1 className="text-2xl font-bold">My Subscription</h1></main>;
}
