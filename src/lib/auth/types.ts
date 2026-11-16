/**
 * Database row types (manually defined; no Prisma in Phase 1).
 * Keep in sync with supabase/migrations/*.sql.
 */

export type TeamRole = "super_admin" | "admin" | "content_writer";
export type TeamMemberStatus = "active" | "invited" | "disabled";

export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  invited_by: string | null;
  added_at: string;
  updated_at: string;
}
