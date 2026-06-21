import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export function CatalogBreadcrumb({
  trail,
}: {
  trail: { label: string; href?: string }[];
}) {
  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
      <Link href="/" className="flex items-center hover:text-foreground">
        <Home className="h-3 w-3" />
      </Link>
      {trail.map((item) => (
        <span key={item.label} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">{item.label}</Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
