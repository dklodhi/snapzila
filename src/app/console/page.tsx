import Link from "next/link";
import { requireTeamMember } from "@/lib/auth/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, FileText, Building2, LifeBuoy, Calendar, Settings } from "lucide-react";

export default async function ConsolePage() {
  const teamMember = await requireTeamMember();

  const tools = [
    {
      title: "Posts",
      description: "Create and manage opportunities (Govt Jobs, Admissions, Scholarships, Schemes, News, Articles).",
      href: "/console/posts",
      icon: FileText,
      available: false,
    },
    {
      title: "Institutions",
      description: "Review and publish institution submissions (IITs, NITs, IIMs, Universities, etc.).",
      href: "/console/institutions",
      icon: Building2,
      available: false,
    },
    {
      title: "Helpline",
      description: "Manage helpline directory entries.",
      href: "/console/helpline",
      icon: LifeBuoy,
      available: false,
    },
    {
      title: "Exam Calendar",
      description: "Manage exam calendar overrides.",
      href: "/console/tools/exam-calendar",
      icon: Calendar,
      available: false,
    },
    {
      title: "Settings",
      description: "Site settings, static pages, team management.",
      href: "/console/settings",
      icon: Settings,
      available: false,
    },
  ];

  return (
    <main className="min-h-screen bg-bg-subtle">
      {/* Top bar */}
      <header className="border-b border-line bg-ink text-white">
        <div className="container-app flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-accent" />
            <span className="font-display font-bold">SnapZila Console</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-soft">{teamMember.email}</span>
            <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-medium uppercase">
              {teamMember.role.replace("_", " ")}
            </span>
            <Button asChild variant="ghost" size="sm" className="text-muted-soft hover:text-white">
              <Link href="/">Exit Console</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-soft hover:text-white">
              <Link href="/logout">Logout</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container-app py-8">
        <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Welcome, {teamMember.email}. You are signed in as{" "}
          <strong className="uppercase">{teamMember.role}</strong>.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.title}>
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-subtle">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <CardTitle className="text-base">{tool.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted">{tool.description}</p>
                  {tool.available ? (
                    <Button asChild variant="ghost" size="sm" className="mt-3 -ml-2">
                      <Link href={tool.href}>Open →</Link>
                    </Button>
                  ) : (
                    <p className="mt-3 text-xs text-muted-soft">
                      Coming in a later session.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-4 border-brand/20 bg-brand-subtle/30">
          <CardHeader>
            <CardTitle className="text-base text-brand">Session 1 — Auth &amp; RBAC</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-ink-soft">
            <p>
              Authentication and role-based access control are live. The console
              is gated: only users with an active <code className="rounded bg-white px-1.5 py-0.5 text-xs">team_members</code> row can access it.
            </p>
            <p className="mt-2">
              The tool modules above (Posts, Institutions, Helpline, etc.) will be
              built in sessions 2–5.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
