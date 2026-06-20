import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageSize,
  total,
  searchParams,
  basePath,
}: {
  page: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string | undefined>;
  basePath: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v && k !== "page") params.set(k, v);
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" asChild disabled={page <= 1}>
        <Link href={buildHref(Math.max(1, page - 1))}><ChevronLeft className="h-4 w-4" /> Prev</Link>
      </Button>
      <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
      <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
        <Link href={buildHref(Math.min(totalPages, page + 1))}>Next <ChevronRight className="h-4 w-4" /></Link>
      </Button>
    </div>
  );
}
