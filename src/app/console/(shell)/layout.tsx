/**
 * Console layout (shell group).
 * Wraps all /console/* pages (except /console/login which is in the (auth) group)
 * with the sidebar + topbar shell.
 *
 * Calls requireTeamMember() server-side — redirects to /console/login if the
 * user is not a team member.
 */
import { redirect } from "next/navigation";
import { requireTeamMember } from "@/lib/auth/server";
import { ConsoleSidebar } from "@/components/console/sidebar";
import { ConsoleTopbar } from "@/components/console/topbar";

export default async function ConsoleShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const teamMember = await requireTeamMember().catch(() => {
    redirect("/console/login");
  });

  if (!teamMember) {
    redirect("/console/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-subtle">
      <ConsoleSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ConsoleTopbar teamMember={teamMember} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
