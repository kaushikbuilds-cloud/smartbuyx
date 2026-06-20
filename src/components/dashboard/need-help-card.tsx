import Link from "next/link";
import { LifeBuoy, RotateCcw, Truck, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ITEMS = [
  { icon: LifeBuoy, label: "Help Center", sub: "Find answers", href: "/dashboard/customer/support" },
  { icon: RotateCcw, label: "Returns", sub: "Easy returns", href: "/dashboard/customer/returns" },
  { icon: Truck, label: "Track Order", sub: "Track instantly", href: "/orders" },
  { icon: MessageCircle, label: "Contact Us", sub: "We're here", href: "/dashboard/customer/support" },
];

export function NeedHelpCard() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h3 className="font-semibold">Need Help?</h3>
        <div className="grid grid-cols-2 gap-2">
          {ITEMS.map((it) => (
            <Link
              key={it.label}
              href={it.href}
              className="rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
            >
              <it.icon className="h-4 w-4 text-purple-600" />
              <p className="mt-1.5 text-xs font-semibold">{it.label}</p>
              <p className="text-[10px] text-muted-foreground">{it.sub}</p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
