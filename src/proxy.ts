/**
 * SnapZila — Proxy (Next.js 16, renamed from middleware)
 * Combines next-intl locale routing + Supabase session refresh + route guards.
 */
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const USER_PROTECTED = ["/me", "/onboarding"];
const CONSOLE_PROTECTED = ["/console"];
const PUBLIC_AUTH_ROUTES = ["/login", "/signup", "/logout", "/console/login"];

function isMatch(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // TEMPORARILY DISABLED: next-intl middleware (needs [locale] segment restructuring)
  // 1. Refresh Supabase session for all routes
  const response = await updateSession(request);

  // 4. Route guards (check original pathname, not locale-prefixed)
  if (isMatch(pathname, PUBLIC_AUTH_ROUTES)) {
    return response;
  }

  const authCookie = request.cookies.get("sb-access-token")?.value;
  const hasSession = Boolean(authCookie);

  if (isMatch(pathname, CONSOLE_PROTECTED)) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/console/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (isMatch(pathname, USER_PROTECTED)) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap|og-image.png|icon.png|icon.svg|api).*)",
  ],
};
