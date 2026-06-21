import Link from "next/link";
import { Headphones, MessageCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const ITEMS = [
  { icon: Headphones, title: "Need Help?", sub: "We are here for you" },
  { icon: MessageCircle, title: "Chat with us", sub: "Available 24/7" },
  { icon: Phone, title: "Call us", sub: "1800-123-4567" },
  { icon: Mail, title: "Email us", sub: "support@smartbuyx.in" },
];

export function HelpBar() {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-4">
          {ITEMS.map((it) => (
            <div key={it.title} className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
                <it.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{it.title}</p>
                <p className="truncate text-[10px] text-muted-foreground">{it.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <Button variant="gradient" asChild>
          <Link href="/dashboard/customer/support">Visit Help Center</Link>
        </Button>
      </div>
    </section>
  );
}
