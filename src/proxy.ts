/**
 * SnapZila — Proxy (Next.js 16)
 * Combines locale routing (hi-in prefix) + Supabase session refresh + route guards.
 *
 * Locale strategy (per old project middleware pattern):
 *   - Root (/) = English India (no prefix)
 *   - /hi-in/... = Hindi India (rewritten to /... internally, x-locale header set)
 *   - Console/API/static routes skip locale handling
 */
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const USER_PROTECTED = ["/me", "/onboarding"];
const CONSOLE_PROTECTED = ["/console"];
const PUBLIC_AUTH_ROUTES = ["/login", "/signup", "/logout", "/console/login"];

// Routes that skip locale handling
const SKIP_LOCALE = new Set([
  "/api", "/_next", "/favicon.ico", "/robots.txt", "/sitemap.xml",
  "/console", "/admin",
]);

function isMatch(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isFirstSegmentSkipped(pathname: string): boolean {
  const first = "/" + (pathname.split("/").filter(Boolean)[0] || "");
  for (const skip of SKIP_LOCALE) {
    if (first === skip || first.startsWith(skip + "/")) return true;
  }
  return false;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  // 1. Handle Hindi locale: /hi-in/... → rewrite to /... + set x-locale header
  if (!isFirstSegmentSkipped(pathname) && pathname.startsWith("/hi-in")) {
    const strippedPath = pathname.slice(6) || "/"; // remove "/hi-in"
    const target = request.nextUrl.clone();
    target.pathname = strippedPath === "/" ? "/" : strippedPath;
    target.search = search;

    // First refresh session on the original request
    const sessionResponse = await updateSession(request);

    // Create rewrite response with locale header
    const res = NextResponse.rewrite(target);
    res.headers.set("x-locale", "hi-IN");
    res.headers.set("x-country", "IN");

    // Copy session cookies
    for (const cookie of sessionResponse.cookies.getAll()) {
      res.cookies.set(cookie.name, cookie.value);
    }

    // Set locale cookie
    res.cookies.set("snapzila_locale", "hi-IN", {
      path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax",
    });

    return res;
  }

  // 2. Refresh Supabase session for all other routes
  const response = await updateSession(request);

  // Set default locale header for non-Hindi routes
  if (!isFirstSegmentSkipped(pathname)) {
    response.headers.set("x-locale", "en-IN");
    response.headers.set("x-country", "IN");
  }

  // 3. Route guards
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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|og-image.png|icon.png|icon.svg|api).*)",
  ],
};
