/**
 * EventCard — compact card for opportunity listings.
 */
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

const TYPE_LABELS: Record<string, string> = {
  "govt-jobs": "Govt Jobs",
  admissions: "Admissions",
  scholarships: "Scholarships",
  "govt-schemes": "Govt Schemes",
  news: "News",
  articles: "Articles",
};

const TYPE_COLORS: Record<string, string> = {
  "govt-jobs": "bg-brand-subtle text-brand",
  admissions: "bg-success-subtle text-success",
  scholarships: "bg-warning-subtle text-warning",
  "govt-schemes": "bg-brand-subtle text-brand",
  news: "bg-bg-muted text-muted",
  articles: "bg-bg-muted text-muted",
};

interface EventCardData {
  id: string;
  type: string;
  slug: string;
  title: string;
  conducting_body?: string | null;
  summary?: string | null;
  apply_end_date?: string | null;
  status: string;
  featured?: boolean;
}

export function EventCard({ event }: { event: EventCardData }) {
  const href = `/${event.type}/${event.slug}`;

  const daysLeft = event.apply_end_date
    ? Math.ceil((new Date(event.apply_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-brand">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${TYPE_COLORS[event.type] ?? "bg-bg-muted text-muted"}`}>
              {TYPE_LABELS[event.type] ?? event.type}
            </span>
            {event.featured && (
              <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-[10px] font-medium text-brand-accent">
                Featured
              </span>
            )}
          </div>
          <h3 className="font-display text-base font-semibold leading-tight text-ink line-clamp-2">
            {event.title}
          </h3>
          {event.conducting_body && (
            <p className="mt-1 text-xs text-muted">{event.conducting_body}</p>
          )}
          {event.summary && (
            <p className="mt-1.5 text-sm text-muted line-clamp-2">{event.summary}</p>
          )}
          {daysLeft !== null && daysLeft > 0 && (
            <p className="mt-2 text-xs font-medium text-warning">
              {daysLeft} day{daysLeft !== 1 ? "s" : ""} left to apply
            </p>
          )}
          {daysLeft !== null && daysLeft <= 0 && (
            <p className="mt-2 text-xs font-medium text-danger">Apply closed</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
