/**
 * Audit log writer.
 * Called by the data-access layer after every console mutation.
 * Appends a row to public.audit_logs.
 */
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/utils/log";
import type { TeamMember } from "@/lib/auth/types";

type JsonValue = Record<string, unknown> | unknown[] | null;

export async function writeAuditLog(params: {
  teamMember: TeamMember;
  action: string;
  entityType: string;
  entityId?: string;
  beforeData?: JsonValue;
  afterData?: JsonValue;
}): Promise<void> {
  const { teamMember, action, entityType, entityId, beforeData, afterData } = params;
  const supabase = await createClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: teamMember.id,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    before_data: beforeData ?? null,
    after_data: afterData ?? null,
  });
  if (error) {
    logError("[audit] failed to write audit log", {
      action,
      entityType,
      entityId,
      error: error.message,
    });
  }
}
