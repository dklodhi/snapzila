"""Add SEO metadata to all public pages that don't have it yet."""
import re
from pathlib import Path

PAGES_DIR = Path("/home/z/my-project/workspace/new-repo/src/app")

# Map: file path -> (import statement, metadata expression)
PAGES = {
    "helpline/page.tsx": (
        'import { helplineMetadata } from "@/lib/seo/metadata";',
        "export const metadata: Metadata = helplineMetadata();",
    ),
    "contact/page.tsx": (
        'import { contactMetadata } from "@/lib/seo/metadata";',
        "export const metadata: Metadata = contactMetadata();",
    ),
    "institutions/page.tsx": (
        'import { institutionsMetadata } from "@/lib/seo/metadata";',
        "export const metadata: Metadata = institutionsMetadata();",
    ),
    "institutions/submit/page.tsx": (
        'import { buildMetadata } from "@/lib/seo/metadata";',
        'export const metadata: Metadata = buildMetadata({ title: "Submit Institution", description: "Submit an educational institution to SnapZila for review.", path: "/institutions/submit", noIndex: true });',
    ),
    "search/page.tsx": (
        'import { searchMetadata } from "@/lib/seo/metadata";',
        """export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  return searchMetadata(q);
}""",
    ),
    "login/page.tsx": (
        'import { authMetadata } from "@/lib/seo/metadata";',
        'export const metadata: Metadata = authMetadata("login");',
    ),
    "signup/page.tsx": (
        'import { authMetadata } from "@/lib/seo/metadata";',
        'export const metadata: Metadata = authMetadata("signup");',
    ),
    "tools/exam-calendar/page.tsx": (
        'import { examCalendarMetadata } from "@/lib/seo/metadata";',
        "export const metadata: Metadata = examCalendarMetadata();",
    ),
    "tools/employment-news/page.tsx": (
        'import { employmentNewsMetadata } from "@/lib/seo/metadata";',
        "export const metadata: Metadata = employmentNewsMetadata();",
    ),
    "institutions/[category]/page.tsx": (
        'import { institutionCategoryMetadata } from "@/lib/seo/metadata";',
        """export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const labels: Record<string, string> = { exams: "Exams", courses: "Courses", universities: "Universities", iits: "IITs", nits: "NITs", iims: "IIMs", aiims: "AIIMS", iiits: "IIITs", nifts: "NIFTs", schools: "Schools", colleges: "Colleges", coaching: "Coaching", "training-skill-centres": "Training & Skill Centres", iti: "ITI", "fake-universities": "Fake Universities", "law-universities": "Law Universities" };
  return institutionCategoryMetadata(category, labels[category] ?? category);
}""",
    ),
    "exams/[slug]/page.tsx": (
        'import { examMetadata } from "@/lib/seo/metadata";',
        """export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: exam } = await supabase.from("exams").select("name, slug, description, meta_description").eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
  if (!exam) return {};
  return examMetadata(exam);
}""",
    ),
    "exams/[slug]/[session]/page.tsx": (
        'import { examSessionMetadata } from "@/lib/seo/metadata";',
        """export async function generateMetadata({ params }: { params: Promise<{ slug: string; session: string }> }): Promise<Metadata> {
  const { slug, session: sessionSlug } = await params;
  const supabase = await createClient();
  const { data: exam } = await supabase.from("exams").select("id, name, slug").eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
  if (!exam) return {};
  const { data: session } = await supabase.from("exam_sessions").select("session_label, slug").eq("exam_id", exam.id).eq("slug", sessionSlug).eq("status", "published").maybeSingle();
  if (!session) return {};
  return examSessionMetadata(exam, session);
}""",
    ),
}

count = 0
for rel_path, (import_stmt, metadata_expr) in PAGES.items():
    file_path = PAGES_DIR / rel_path
    if not file_path.exists():
        print(f"  SKIP (not found): {rel_path}")
        continue

    content = file_path.read_text()

    # Check if metadata already exists
    if "generateMetadata" in content or "export const metadata" in content:
        print(f"  SKIP (already has metadata): {rel_path}")
        continue

    # Add "import type { Metadata } from "next";" at the top if not present
    if 'import type { Metadata }' not in content:
        content = 'import type { Metadata } from "next";\n' + content

    # Add the SEO import after the first line
    if import_stmt not in content:
        # Find the last import line and add after it
        lines = content.split("\n")
        last_import_idx = 0
        for i, line in enumerate(lines):
            if line.startswith("import "):
                last_import_idx = i
        lines.insert(last_import_idx + 1, import_stmt)
        content = "\n".join(lines)

    # Add the metadata export after the imports (before the first const/interface/export default)
    lines = content.split("\n")
    insert_idx = 0
    for i, line in enumerate(lines):
        if line.startswith("const ") or line.startswith("interface ") or line.startswith("export default") or line.startswith("export async function default"):
            insert_idx = i
            break
    if insert_idx > 0:
        lines.insert(insert_idx, metadata_expr)
        lines.insert(insert_idx, "")
        content = "\n".join(lines)

    file_path.write_text(content)
    print(f"  ✅ Added metadata: {rel_path}")
    count += 1

print(f"\nDone: {count} files updated.")
