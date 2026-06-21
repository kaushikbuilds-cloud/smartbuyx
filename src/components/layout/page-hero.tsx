import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Variant = "purple" | "build" | "dark";

const GRADIENT: Record<Variant, string> = {
  purple: "from-purple-600 via-indigo-600 to-blue-700 shadow-purple-600/20",
  build: "from-amber-500 via-orange-600 to-rose-600 shadow-orange-500/20",
  dark: "from-[#1a0d3b] via-[#2d1465] to-[#1a0d3b] shadow-purple-900/30",
};

export function PageHero({
  title,
  description,
  badge,
  badgeIcon: BadgeIcon = Sparkles,
  actions,
  icon: Icon,
  variant = "purple",
  className,
}: {
  title: string;
  description?: string;
  badge?: string;
  badgeIcon?: LucideIcon;
  actions?: React.ReactNode;
  icon?: LucideIcon;
  variant?: Variant;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br px-6 py-8 text-white shadow-lg md:px-8 md:py-10",
        GRADIENT[variant],
        className
      )}
    >
      <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/15 blur-3xl" aria-hidden />
      <div className="absolute -bottom-10 left-20 h-32 w-32 rounded-full bg-white/10 blur-3xl" aria-hidden />

      <div className="relative grid items-center gap-6 md:grid-cols-[1fr,auto]">
        <div className="min-w-0">
          {badge ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <BadgeIcon className="h-3 w-3" /> {badge}
            </span>
          ) : null}
          <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-white/85">{description}</p> : null}
          {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        {Icon ? (
          <div className="hidden md:block" aria-hidden>
            <Icon className="h-28 w-28 text-white/30" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
