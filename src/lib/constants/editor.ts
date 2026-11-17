/**
 * SnapZila — Editor Constants
 * ============================================================================
 * All option lists used by the console editors, ported from the old project's
 * editor-constants.ts + content-type-registry.ts.
 * ============================================================================
 */

export const UPDATE_TYPES = [
  { value: "new", label: "New Notification", icon: "🆕", color: "bg-brand" },
  { value: "date_extend", label: "Date Extended", icon: "📅", color: "bg-warning" },
  { value: "corrigendum", label: "Corrigendum", icon: "📝", color: "bg-danger" },
  { value: "admit_card", label: "Admit Card", icon: "🎫", color: "bg-brand" },
  { value: "answer_key", label: "Answer Key", icon: "🔑", color: "bg-info" },
  { value: "result", label: "Result Declared", icon: "✅", color: "bg-success" },
  { value: "shortlist", label: "Shortlist", icon: "📋", color: "bg-success" },
  { value: "other", label: "Other Update", icon: "📌", color: "bg-muted" },
] as const;

export const CORRIGENDUM_FIELDS = [
  { value: "vacancy", label: "Vacancy / Seats" },
  { value: "dates", label: "Important Dates" },
  { value: "fee", label: "Application Fee" },
  { value: "eligibility", label: "Eligibility / Age" },
  { value: "qualification", label: "Qualification" },
  { value: "documents", label: "Required Documents" },
  { value: "exam_centre", label: "Exam Centre / City" },
  { value: "other", label: "Other" },
] as const;

export const GUIDE_SECTIONS = [
  { value: "syllabus", label: "Syllabus", icon: "📚" },
  { value: "exam-pattern", label: "Exam Pattern", icon: "📐" },
  { value: "how-to-apply", label: "How to Apply", icon: "📝" },
  { value: "eligibility", label: "Eligibility", icon: "✅" },
  { value: "fees", label: "Application Fees", icon: "💳" },
  { value: "dates", label: "Important Dates", icon: "📅" },
  { value: "documents", label: "Required Documents", icon: "📎" },
  { value: "selection-process", label: "Selection Process", icon: "🎯" },
  { value: "preparation", label: "Preparation Tips", icon: "🎯" },
  { value: "best-books", label: "Best Books", icon: "📖" },
  { value: "study-material", label: "Study Material", icon: "📋" },
  { value: "coaching", label: "Coaching Institutes", icon: "🏫" },
  { value: "previous-papers", label: "Previous Papers", icon: "📄" },
  { value: "cut-off", label: "Cut Off", icon: "📊" },
  { value: "salary-details", label: "Salary Details", icon: "💰" },
  { value: "joining-process", label: "Joining Process", icon: "🎉" },
  { value: "interview-tips", label: "Interview Tips", icon: "🗣️" },
  { value: "posting-locations", label: "Posting Locations", icon: "🗺️" },
  { value: "faq", label: "FAQ", icon: "❓" },
  { value: "other", label: "Other", icon: "📌" },
] as const;

export const SELECTION_STAGE_TYPES = [
  { value: "written", label: "Written Exam" },
  { value: "pet", label: "PET / Pre-exam Test" },
  { value: "pst", label: "PST / Physical Standard Test" },
  { value: "physical_eff", label: "Physical Efficiency Test" },
  { value: "skill_test", label: "Skill / Typing Test" },
  { value: "interview", label: "Interview" },
  { value: "dv", label: "Document Verification (DV)" },
  { value: "merit", label: "Merit List Only" },
  { value: "medical", label: "Medical Examination" },
] as const;

export const APPLY_MODES = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline (Hard Copy)" },
  { value: "both", label: "Both (Online + Offline)" },
  { value: "walk_in", label: "Walk-in" },
  { value: "kiosk", label: "Kiosk / Portal" },
] as const;

export const EXAM_MODES = [
  { value: "online", label: "Online (CBT)" },
  { value: "offline", label: "Offline (OMR/Pen-Paper)" },
  { value: "both", label: "Both Online & Offline" },
  { value: "na", label: "N/A (Physical/Interview)" },
] as const;

export const EMPLOYMENT_TYPES = [
  { value: "permanent", label: "Permanent" },
  { value: "temporary", label: "Temporary" },
  { value: "contractual", label: "Contractual" },
  { value: "honorary", label: "Honorary / Honorarium" },
  { value: "deputation", label: "Deputation" },
] as const;

export const PAY_GROUPS = [
  { value: "A", label: "Group A" },
  { value: "B", label: "Group B" },
  { value: "C", label: "Group C" },
  { value: "D", label: "Group D" },
] as const;

export const SELECTION_TYPES = [
  { value: "direct", label: "Direct (Single Stage)" },
  { value: "two_stage", label: "Two Stage (PET + Main)" },
  { value: "three_stage", label: "Three Stage (Pre + Mains + Skill)" },
  { value: "walk_in", label: "Walk-in Interview" },
  { value: "interview_only", label: "Interview Only" },
] as const;

export const AGE_CUTOFF_TYPES = [
  { value: "last_date", label: "Application Last Date" },
  { value: "july_1", label: "1st July" },
  { value: "jan_1", label: "1st January" },
  { value: "custom", label: "Custom Date" },
] as const;

export const VERTICAL_CATEGORIES = [
  { value: "ur", label: "UR (General)" },
  { value: "ews", label: "EWS" },
  { value: "obc", label: "OBC (NCL)" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
] as const;

export const EXAM_TYPES = [
  { value: "entrance", label: "Entrance Exam" },
  { value: "competitive", label: "Competitive Exam" },
  { value: "certification", label: "Certification" },
  { value: "recruitment", label: "Recruitment Exam" },
  { value: "eligibility", label: "Eligibility Test" },
  { value: "board", label: "Board Exam" },
] as const;

export const COURSE_LEVELS = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "postgraduate", label: "Postgraduate" },
  { value: "diploma", label: "Diploma" },
  { value: "certificate", label: "Certificate" },
  { value: "doctoral", label: "Doctoral" },
  { value: "school", label: "School (Class 1-12)" },
] as const;

export const CONTENT_TYPES = [
  { value: "govt-jobs", label: "Govt Jobs" },
  { value: "admissions", label: "Admissions" },
  { value: "scholarships", label: "Scholarships" },
  { value: "govt-schemes", label: "Govt Schemes" },
  { value: "news", label: "News" },
  { value: "articles", label: "Articles" },
] as const;

export function findLabel(
  list: ReadonlyArray<{ value: string; label: string }>,
  value: string,
): string | undefined {
  return list.find((item) => item.value === value)?.label;
}

// ─── 17. PER-CONTENT-TYPE GUIDE SECTIONS ────────────────────────────────────
// Returns the relevant guide sections for a given content type.
// All content types share the same guide_section enum (20 values),
// but this filters to the most relevant ones per type.

export function getGuidesForType(type: string): Array<{ value: string; label: string; icon: string }> {
  const GUIDES_BY_TYPE: Record<string, string[]> = {
    "govt-jobs": [
      "syllabus", "exam-pattern", "how-to-apply", "eligibility", "fees",
      "dates", "documents", "selection-process", "preparation", "best-books",
      "study-material", "coaching", "previous-papers", "cut-off",
      "salary-details", "joining-process", "interview-tips", "posting-locations", "faq",
    ],
    admissions: [
      "eligibility", "how-to-apply", "fees", "dates", "documents",
      "exam-pattern", "preparation", "cut-off", "faq",
    ],
    scholarships: [
      "eligibility", "how-to-apply", "documents", "selection-process", "faq",
    ],
    "govt-schemes": [
      "eligibility", "how-to-apply", "documents", "faq",
    ],
    news: ["faq"],
    articles: ["faq"],
  };
  const allowedSlugs = GUIDES_BY_TYPE[type] ?? GUIDE_SECTIONS.map((g) => g.value);
  return GUIDE_SECTIONS.filter((g) => allowedSlugs.includes(g.value));
}

export function getUpdateTypesForType(type: string): Array<{ value: string; label: string; icon: string; color: string }> {
  const TYPES_BY_CONTENT: Record<string, string[]> = {
    "govt-jobs": ["new", "date_extend", "corrigendum", "admit_card", "answer_key", "result", "shortlist", "other"],
    admissions: ["new", "date_extend", "corrigendum", "admit_card", "result", "other"],
    scholarships: ["new", "date_extend", "corrigendum", "result", "other"],
    "govt-schemes": ["new", "corrigendum", "other"],
    news: ["other"],
    articles: ["other"],
  };
  const allowedValues = TYPES_BY_CONTENT[type] ?? UPDATE_TYPES.map((u) => u.value);
  return UPDATE_TYPES.filter((u) => allowedValues.includes(u.value));
}
