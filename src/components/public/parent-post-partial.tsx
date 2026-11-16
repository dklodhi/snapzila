"use client";

/**
 * Parent post partial view with "View All" AJAX expand.
 * Shows: title, conducting body, type, summary, key dates.
 * Expands to show: full body + eligibility + fees + selection process.
 * Expand state persisted in URL hash (#details).
 */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface EventData {
  title: string;
  conducting_body?: string | null;
  summary?: string | null;
  apply_start_date?: string | null;
  apply_end_date?: string | null;
  exam_date?: string | null;
  result_date?: string | null;
  apply_mode?: string | null;
  apply_link?: string | null;
  body_md?: string | null;
  eligibility?: Record<string, unknown> | null;
  fees_inr_paise?: number | null;
  fees_breakdown?: Record<string, unknown> | null;
  selection_process?: string[] | null;
  locations?: string[] | null;
}

function fmtDate(s?: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtMoney(paise?: number | null): string {
  if (!paise) return "—";
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(rupees);
}

export function ParentPostPartial({ event }: { event: EventData }) {
  const [expanded, setExpanded] = useState(false);

  // Sync with URL hash
  useEffect(() => {
    if (window.location.hash === "#details") setExpanded(true);
  }, []);

  function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      history.replaceState(null, "", "#details");
    } else {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5">
      {/* Always-visible partial */}
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold leading-tight text-ink">{event.title}</h1>
        {event.conducting_body && (
          <p className="text-sm text-muted">{event.conducting_body}</p>
        )}
        {event.summary && (
          <p className="text-sm text-ink-soft">{event.summary}</p>
        )}

        {/* Key dates row */}
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <p className="text-muted-soft">Apply Start</p>
            <p className="font-medium text-ink">{fmtDate(event.apply_start_date)}</p>
          </div>
          <div>
            <p className="text-muted-soft">Apply End</p>
            <p className="font-medium text-ink">{fmtDate(event.apply_end_date)}</p>
          </div>
          <div>
            <p className="text-muted-soft">Exam Date</p>
            <p className="font-medium text-ink">{fmtDate(event.exam_date)}</p>
          </div>
          <div>
            <p className="text-muted-soft">Result</p>
            <p className="font-medium text-ink">{fmtDate(event.result_date)}</p>
          </div>
        </div>

        {event.apply_link && (
          <a
            href={event.apply_link}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          >
            Apply Now →
          </a>
        )}
      </div>

      {/* Expandable full content */}
      {expanded && (
        <div className="mt-4 border-t border-line pt-4 space-y-4">
          {event.body_md && (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-ink-soft">{event.body_md}</pre>
            </div>
          )}

          {event.eligibility && Object.keys(event.eligibility).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink">Eligibility</h3>
              <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-muted">
                {JSON.stringify(event.eligibility, null, 2)}
              </pre>
            </div>
          )}

          {event.fees_inr_paise != null && (
            <div>
              <h3 className="text-sm font-semibold text-ink">Application Fee</h3>
              <p className="mt-1 text-sm text-muted">General: {fmtMoney(event.fees_inr_paise)}</p>
              {event.fees_breakdown && (
                <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-muted">
                  {JSON.stringify(event.fees_breakdown, null, 2)}
                </pre>
              )}
            </div>
          )}

          {event.selection_process && event.selection_process.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink">Selection Process</h3>
              <ol className="mt-1 list-decimal pl-5 text-sm text-muted">
                {event.selection_process.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {event.locations && event.locations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink">Locations</h3>
              <p className="mt-1 text-sm text-muted">{event.locations.join(", ")}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <Button variant="ghost" size="sm" onClick={toggle}>
          {expanded ? (
            <>Collapse <ChevronUp className="ml-1 h-4 w-4" /></>
          ) : (
            <>View All <ChevronDown className="ml-1 h-4 w-4" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
