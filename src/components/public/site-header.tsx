/**
 * Public site header.
 * Server component — reads current user + team member for auth-aware nav.
 */
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getTeamMember } from "@/lib/auth/server";

const NAV = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/opportunities/govt-jobs", label: "Govt Jobs" },
  { href: "/opportunities/admissions", label: "Admissions" },
  { href: "/opportunities/scholarships", label: "Scholarships" },
  { href: "/opportunities/news", label: "News" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const teamMember = await getTeamMember();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
      <div className="container-app flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-1.5 font-display text-lg font-bold text-brand">
            <span className="inline-block h-6 w-6 rounded bg-brand" />
            SnapZila
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted hover:bg-bg-subtle hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/me">Dashboard</Link>
              </Button>
              {teamMember && (
                <Button asChild variant="ghost" size="sm" className="text-muted">
                  <Link href="/console">Console</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href="/logout">Logout</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
