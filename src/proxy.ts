/**
 * SnapZila — Proxy (Next.js 16 renamed from "middleware")
 * ============================================================================
 * Responsibilities:
 *   1. Refresh the Supabase auth session on every request (writes cookies).
 *   2. Protect /console/* routes — redirect to /console/login if no session.
 *      (The actual team_members check happens in the server component via
 *       requireTeamMember() — too expensive for proxy to do on every
 *       request, and the redirect from there is fast.)
 *   3. Protect /me — redirect to /login if no session.
 *
 * NOT changed by proxy:
 *   - /api/* (API routes handle auth themselves)
 *   - /_next/* (static assets)
 *   - /login, /signup, /logout, /console/login (public auth pages)
 *   - Static files (favicon.ico, robots.txt, etc.)
 *
 * Phase 1: no i18n locale routing yet (that's Session 7).
 * ============================================================================
 */
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require a session (any authed user)
const USER_PROTECTED = ["/me", "/onboarding"];

// Routes that require a team session (checked in server component,
// but proxy at least verifies a session exists)
const CONSOLE_PROTECTED = ["/console"];

// Routes that are public even when logged in
const PUBLIC_AUTH_ROUTES = ["/login", "/signup", "/logout", "/console/login"];

function isMatch(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  // 1. Refresh session (always — this is what keeps the user logged in)
  const response = await updateSession(request);

  // 2. Check if this is a protected route
  const pathname = request.nextUrl.pathname;

  // Skip protection for public auth routes
  if (isMatch(pathname, PUBLIC_AUTH_ROUTES)) {
    return response;
  }

  // Read the session from the refreshed cookies.
  // We check for the presence of the auth cookie — the actual JWT
  // validation happens in the server component via getUser().
  const authCookie = request.cookies.get("sb-access-token")?.value;
  const hasSession = Boolean(authCookie);

  // 3. Protect /console/* — redirect to /console/login if no session
  if (isMatch(pathname, CONSOLE_PROTECTED)) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/console/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    // Session exists — let the request through.
    // The server component (requireTeamMember) will verify team membership.
    return response;
  }

  // 4. Protect /me — redirect to /login if no session
  if (isMatch(pathname, USER_PROTECTED)) {
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static, _next/image (static files)
     * - favicon.ico, robots.txt, sitemap.xml, etc.
     * - api routes (they handle auth themselves)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|og-image.png|icon.png|icon.svg|api).*)",
  ],
};
