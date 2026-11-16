import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity?: string }>;
}) {
  const { action, entity } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      created_at,
      actor:team_members(email, role)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (action) query = query.eq("action", action);
  if (entity) query = query.eq("entity_type", entity);

  const { data: logs } = await query;

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold text-ink">Audit Log</h1>
      <p className="mt-1 text-sm text-muted">Every console write, recorded. Last 100 entries.</p>

      {/* Filters */}
      <div className="mt-4 flex gap-2 text-xs">
        <a href="/console/audit-log" className={`rounded-md px-2.5 py-1 ${!action && !entity ? "bg-brand text-white" : "bg-white border border-line text-muted"}`}>All</a>
        {["event.create", "event.update", "event.create_from_json", "event_update.create", "static_page.create", "site_setting.update"].map((a) => (
          <a key={a} href={`/console/audit-log?action=${a}`} className={`rounded-md px-2.5 py-1 ${action === a ? "bg-brand text-white" : "bg-white border border-line text-muted"}`}>
            {a}
          </a>
        ))}
      </div>

      <Card className="mt-4 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-bg-subtle">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted">Time</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Action</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Entity</th>
              <th className="px-4 py-2 text-left font-medium text-muted">Actor</th>
            </tr>
          </thead>
          <tbody>
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-muted">
                  No audit log entries yet. Create or update something to see it here.
                </td>
              </tr>
            )}
            {logs?.map((log) => {
              const actor = log.actor as { email?: string; role?: string } | null;
              return (
                <tr key={log.id} className="border-b border-line-soft hover:bg-bg-subtle">
                  <td className="px-4 py-2.5 text-xs text-muted">
                    {new Date(log.created_at).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-2.5">
                    <code className="rounded bg-bg-muted px-1.5 py-0.5 text-xs">{log.action}</code>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted">
                    {log.entity_type}
                    {log.entity_id && (
                      <span className="ml-2 font-mono text-muted-soft">{log.entity_id.slice(0, 8)}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {actor?.email ?? "—"}
                    {actor?.role && (
                      <span className="ml-2 rounded bg-bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted">
                        {actor.role.replace("_", " ")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
