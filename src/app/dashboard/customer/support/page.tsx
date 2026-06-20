import { Mail, Phone, MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/dashboard/page-shell";

export const metadata = { title: "Help & Support" };

const FAQ = [
  { q: "How do I track my order?", a: "Open My Orders → tap any order → see live status from paid to delivered." },
  { q: "When does my escrow release?", a: "After you confirm delivery, the seller is paid within seconds from escrow." },
  { q: "How do refunds work?", a: "Refunds are credited to your SmartBuyX wallet immediately and re-usable on any seller." },
  { q: "How do I become a seller?", a: "Go to /dashboard/supplier — apply with GSTIN and start listing within 24h." },
];

export default async function SupportPage() {
  await requireUser();
  return (
    <PageShell title="Help & Support" description="We're here 24×7.">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-2 p-5">
            <Mail className="h-5 w-5 text-purple-600" />
            <p className="font-semibold">Email</p>
            <a href="mailto:hello@smartbuyx.in" className="text-sm text-primary hover:underline">hello@smartbuyx.in</a>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <Phone className="h-5 w-5 text-purple-600" />
            <p className="font-semibold">Phone</p>
            <p className="text-sm text-muted-foreground">Mon–Sat · 9 AM to 9 PM IST</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <MessageCircle className="h-5 w-5 text-purple-600" />
            <p className="font-semibold">Live chat</p>
            <p className="text-sm text-muted-foreground">Available in your bottom-right</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">Frequently asked questions</h2>
          <ul className="space-y-3 text-sm">
            {FAQ.map((f) => (
              <li key={f.q}>
                <p className="font-medium">{f.q}</p>
                <p className="text-muted-foreground">{f.a}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </PageShell>
  );
}
