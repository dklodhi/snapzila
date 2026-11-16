/**
 * Server-side auth helpers.
 * Use in Server Components, Route Handlers, and Server Actions.
 *
 * Phase 1 model:
 *   - Supabase Auth manages identity (auth.users).
 *   - team_members table is the RBAC layer for console access.
 *   - Consumer users = auth.users with NO team_members row.
 *   - Team users = auth.users WITH an active team_members row.
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/utils/log";
import type { TeamMember } from "./types";

/**
 * Returns the Supabase auth user (or null if not logged in).
 * Uses getUser() which validates the JWT server-side (safe).
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the team_members row for the current user (or null if
 * the user is not a team member / not active).
 */
export async function getTeamMember(): Promise<TeamMember | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    logError("[getTeamMember] query error", { message: error.message });
    return null;
  }
  return (data as TeamMember) ?? null;
}

/**
 * Returns the current user, or redirects to /login if not logged in.
 * Use at the top of any consumer page that requires auth.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Returns the team_members row, or redirects to /console/login if
 * the user is not a team member (or not logged in).
 * Use at the top of any /console/* page.
 */
export async function requireTeamMember(): Promise<TeamMember> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/console/login");
  }

  const teamMember = await getTeamMember();
  if (!teamMember) {
    redirect("/console/login?error=not_team_member");
  }
  return teamMember;
}

/**
 * Returns the team_members row if the user has at least the required role,
 * or redirects to /console?error=forbidden if they don't.
 */
export async function requireRole(minRole: TeamMember["role"]): Promise<TeamMember> {
  const teamMember = await requireTeamMember();
  const rank: Record<TeamMember["role"], number> = {
    content_writer: 1,
    admin: 2,
    super_admin: 3,
  };
  if (rank[teamMember.role] < rank[minRole]) {
    redirect("/console?error=forbidden");
  }
  return teamMember;
}
