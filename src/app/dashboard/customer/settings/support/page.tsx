import Link from "next/link";
import { LifeBuoy, Mail, MessageCircle, AlertOctagon, FileQuestion } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsSection } from "@/components/dashboard/settings-section";

export const metadata = { title: "Support" };

const ACTIONS = [
  { icon: LifeBuoy, title: "Help Center", desc: "Browse FAQs and how-to guides", href: "/dashboard/customer/support", color: "from-purple-600 to-indigo-600" },
  { icon: Mail, title: "Contact Support", desc: "Email hello@smartbuyx.in", href: "mailto:hello@smartbuyx.in", color: "from-blue-600 to-cyan-600" },
  { icon: FileQuestion, title: "Raise a Ticket", desc: "Track an open request", href: "/dashboard/customer/support", color: "from-emerald-600 to-teal-600" },
  { icon: MessageCircle, title: "Live Chat", desc: "Mon–Sat · 9 AM to 9 PM IST", href: "#", color: "from-amber-500 to-orange-600" },
  { icon: AlertOctagon, title: "Report an Issue", desc: "Tell us about a problem", href: "mailto:hello@smartbuyx.in?subject=Report%20an%20Issue", color: "from-rose-600 to-pink-600" },
];

export default async function SupportSettingsPage() {
  await requireUser();
  return (
    <SettingsSection title="Support" description="We're here to help, 24×7.">
      <div className="grid gap-3 sm:grid-cols-2">
        {ACTIONS.map((a) => (
          <Link key={a.title} href={a.href} className="group">
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardContent className="space-y-2 p-5">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${a.color} text-white shadow-md`}>
                  <a.icon className="h-5 w-5" />
                </span>
                <p className="font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </SettingsSection>
  );
}
