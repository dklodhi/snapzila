import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getTeamMember } from "@/lib/auth/server";

export default async function HomePage() {
  const user = await getCurrentUser();
  const teamMember = await getTeamMember();

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-line bg-bg-subtle">
        <div className="container-app flex h-14 items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold text-brand">
            SnapZila
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/me">My Dashboard</Link>
                </Button>
                {teamMember && (
                  <Button asChild variant="secondary" size="sm">
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
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container-app py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            Phase 1 — In Development
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Live updates for every career &amp; education opportunity
          </h1>
          <p className="mt-4 text-lg text-muted">
            Govt Jobs, Admissions, Scholarships, Govt Schemes, News, Articles —
            each event with a real-time live-update timeline and structured
            guide. One source of truth, updated live.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            {!user && (
              <>
                <Button asChild size="lg">
                  <Link href="/signup">Get Started</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/login">Login</Link>
                </Button>
              </>
            )}
            {user && (
              <Button asChild size="lg">
                <Link href="/me">Go to Dashboard</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="container-app py-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Session 1 — Auth &amp; RBAC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>
              This is the Phase 1 rebuild. The planning docs are in{" "}
              <code className="rounded bg-bg-muted px-1.5 py-0.5 text-xs">docs/</code>{" "}
              in the repo.
            </p>
            <p>
              Authentication is live. Consumer users can sign up and log in.
              Team members can access the console at{" "}
              <Link href="/console" className="text-brand underline">
                /console
              </Link>
              .
            </p>
            {user && (
              <p className="rounded-md bg-brand-subtle p-2 text-xs text-brand">
                Logged in as: <strong>{user.email}</strong>
                {teamMember && (
                  <> · Team role: <strong>{teamMember.role}</strong></>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
