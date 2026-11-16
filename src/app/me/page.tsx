import Link from "next/link";
import { requireUser } from "@/lib/auth/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MePage() {
  const user = await requireUser();

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-bg-subtle">
        <div className="container-app flex h-14 items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold text-brand">
            SnapZila
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/logout">Logout</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="container-app py-8">
        <h1 className="font-display text-2xl font-bold text-ink">My Dashboard</h1>
        <p className="mt-1 text-muted">Welcome back, {user.email}.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">
                Events you&apos;ve bookmarked will appear here.
              </p>
              <p className="mt-2 text-xs text-muted-soft">
                Feature landing in Session 6.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Following</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">
                Events and institutions you follow will appear here.
              </p>
              <p className="mt-2 text-xs text-muted-soft">
                Feature landing in Session 6.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">
                Live updates from events you follow will appear here.
              </p>
              <p className="mt-2 text-xs text-muted-soft">
                Feature landing in Session 6.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Email</span>
              <span className="font-medium text-ink">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">User ID</span>
              <span className="font-mono text-xs text-muted">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Created</span>
              <span className="text-ink">
                {new Date(user.created_at).toLocaleDateString("en-IN")}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
