import Link from "next/link";
import { PublicShell } from "@/components/public/public-shell";
import { Card, CardContent } from "@/components/ui/card";

const CATEGORIES = [
  { slug: "exams", label: "Exams", desc: "Entrance and competitive exams" },
  { slug: "courses", label: "Courses", desc: "Undergraduate, postgraduate, diploma" },
  { slug: "universities", label: "Universities", desc: "All recognised universities" },
  { slug: "iits", label: "IITs", desc: "Indian Institutes of Technology" },
  { slug: "nits", label: "NITs", desc: "National Institutes of Technology" },
  { slug: "iims", label: "IIMs", desc: "Indian Institutes of Management" },
  { slug: "aiims", label: "AIIMS", desc: "All India Institutes of Medical Sciences" },
  { slug: "iiits", label: "IIITs", desc: "Indian Institutes of Information Technology" },
  { slug: "nifts", label: "NIFTs", desc: "National Institutes of Fashion Technology" },
  { slug: "schools", label: "Schools", desc: "CBSE, ICSE, state board schools" },
  { slug: "colleges", label: "Colleges", desc: "Affiliated and autonomous colleges" },
  { slug: "coaching", label: "Coaching", desc: "Coaching institutes for exams" },
  { slug: "training-skill-centres", label: "Training & Skill Centres", desc: "Skill development centres" },
  { slug: "iti", label: "ITI", desc: "Industrial Training Institutes" },
  { slug: "fake-universities", label: "Fake Universities", desc: "UGC-declared fake universities" },
  { slug: "law-universities", label: "Law Universities", desc: "Law schools and universities" },
];

export default async function InstitutionsPage() {
  return (
    <PublicShell>
      <div className="container-app py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Institutions</h1>
            <p className="mt-1 text-muted">Browse educational institutions across India.</p>
          </div>
          <Link
            href="/institutions/submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
          >
            Submit Institution
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} href={`/institutions/${cat.slug}`}>
              <Card className="transition-colors hover:border-brand">
                <CardContent className="p-4">
                  <h2 className="font-display text-lg font-semibold text-ink">{cat.label}</h2>
                  <p className="mt-1 text-sm text-muted">{cat.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
