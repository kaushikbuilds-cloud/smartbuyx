import Link from "next/link";
import { Sparkles, Ruler, Boxes, FileText, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TOOLS = [
  {
    title: "AI House Builder",
    desc: "Sketch → Floor plan + 3D + BOQ",
    href: "/house-builder",
    icon: Sparkles,
    gradient: "from-purple-600 to-indigo-600",
  },
  {
    title: "Material Estimator",
    desc: "CAD/blueprint → quantities",
    href: "/estimator",
    icon: Boxes,
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    title: "Cost Calculator",
    desc: "Plot size → ballpark cost",
    href: "/cost-calculator",
    icon: Ruler,
    gradient: "from-emerald-600 to-teal-600",
  },
  {
    title: "Post an RFQ",
    desc: "Reach 100+ suppliers",
    href: "/rfq/new",
    icon: FileText,
    gradient: "from-amber-500 to-orange-600",
  },
];

export function BuildToolsRow() {
  return (
    <section>
      <h2 className="mb-3 font-semibold">AI &amp; Tools</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map((t) => (
          <Link key={t.title} href={t.href} className="group">
            <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
              <CardContent className="space-y-2 p-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${t.gradient} text-white shadow-md`}>
                  <t.icon className="h-5 w-5" />
                </span>
                <p className="font-semibold">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Open <ArrowRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
