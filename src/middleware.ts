import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED = ["/dashboard", "/checkout", "/orders", "/assistant", "/estimator", "/house-builder", "/cost-calculator", "/projects", "/wallet", "/subscription", "/rfq"];

const ROLE_GATES: Record<string, string[]> = {
  "/dashboard/supplier": ["supplier", "admin", "superadmin"],
  "/dashboard/architect": ["architect", "admin", "superadmin"],
  "/dashboard/engineer": ["engineer", "admin", "superadmin"],
  "/dashboard/contractor": ["contractor", "admin", "superadmin"],
  "/dashboard/interior-designer": ["interior_designer", "admin", "superadmin"],
  "/dashboard/creator": ["creator", "admin", "superadmin"],
  "/dashboard/brand": ["d2c_brand", "admin", "superadmin"],
  "/dashboard/admin": ["admin", "superadmin"],
};

export async function middleware(req: NextRequest) {
  const { response, user } = await updateSession(req);
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (needsAuth && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  for (const [prefix, allowed] of Object.entries(ROLE_GATES)) {
    if (pathname.startsWith(prefix)) {
      const role = (user?.app_metadata as { role?: string } | undefined)?.role ?? "customer";
      if (!allowed.includes(role)) {
        const url = req.nextUrl.clone();
        url.pathname = "/dashboard/customer";
        return NextResponse.redirect(url);
      }
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
