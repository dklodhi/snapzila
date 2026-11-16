/**
 * Public site footer.
 */
import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();

  const columns = [
    {
      title: "Opportunities",
      links: [
        { href: "/opportunities/govt-jobs", label: "Govt Jobs" },
        { href: "/opportunities/admissions", label: "Admissions" },
        { href: "/opportunities/scholarships", label: "Scholarships" },
        { href: "/opportunities/govt-schemes", label: "Govt Schemes" },
        { href: "/opportunities/news", label: "News" },
        { href: "/opportunities/articles", label: "Articles" },
      ],
    },
    {
      title: "Tools",
      links: [
        { href: "/tools/exam-calendar", label: "Exam Calendar" },
        { href: "/tools/employment-news", label: "Employment News" },
        { href: "/helpline", label: "Helpline" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/about", label: "About Us" },
        { href: "/contact", label: "Contact Us" },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-bg-subtle">
      <div className="container-app py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-1.5 font-display text-lg font-bold text-brand">
              <span className="inline-block h-6 w-6 rounded bg-brand" />
              SnapZila
            </Link>
            <p className="mt-2 text-sm text-muted">
              Live updates for career &amp; education opportunities.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                {col.title}
              </p>
              <ul className="space-y-1.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 border-t border-line pt-4 text-xs text-muted-soft">
          © {year} SnapZila. All rights reserved. · Phase 1 in development.
        </div>
      </div>
    </footer>
  );
}
