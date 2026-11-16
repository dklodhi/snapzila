/**
 * Zod schema for the JSON paste editor.
 * Validates the JSON payload before calling create_event_from_json RPC.
 */
import { z } from "zod";

export const EVENT_TYPES = [
  "govt-jobs",
  "admissions",
  "scholarships",
  "govt-schemes",
  "news",
  "articles",
] as const;

export const UPDATE_KINDS = [
  "info",
  "warning",
  "result",
  "admit-card",
  "corrigendum",
  "extension",
  "deadline",
] as const;

export const GUIDE_SECTIONS = [
  "eligibility",
  "apply_steps",
  "fees",
  "dates",
  "documents",
  "faq",
  "other",
] as const;

export const eventJsonSchema = z.object({
  schema_version: z.literal(1),
  type: z.enum(EVENT_TYPES),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, hyphens only"),
  title: z.string().min(1).max(300),
  title_hi: z.string().optional(),
  summary: z.string().max(500).optional(),
  summary_hi: z.string().max(500).optional(),
  conducting_body: z.string().optional(),
  conducting_body_slug: z.string().optional(),
  locations: z.array(z.string()).optional(),
  apply_mode: z.enum(["online", "offline", "hybrid", "na"]).optional(),
  apply_link: z.string().url().optional().or(z.literal("")),
  apply_start_date: z.string().optional(),
  apply_end_date: z.string().optional(),
  exam_date: z.string().optional(),
  result_date: z.string().optional(),
  status: z.enum(["draft", "scheduled", "published"]).optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  eligibility: z.record(z.string(), z.unknown()).optional(),
  vacancy: z.record(z.string(), z.unknown()).optional(),
  fees_breakdown: z.record(z.string(), z.unknown()).optional(),
  fees_inr_paise: z.number().int().nonnegative().optional(),
  selection_process: z.array(z.string()).optional(),
  apply_steps: z.array(z.unknown()).optional(),
  body_md: z.string().optional(),
  body_md_hi: z.string().optional(),
  meta_title: z.string().max(200).optional(),
  meta_description: z.string().max(500).optional(),
  updates: z
    .array(
      z.object({
        kind: z.enum(UPDATE_KINDS).optional(),
        title: z.string().min(1),
        title_hi: z.string().optional(),
        body_md: z.string().optional(),
        body_md_hi: z.string().optional(),
        doc_url: z.string().optional(),
        sort_order: z.number().int().optional(),
      })
    )
    .optional(),
  guides: z
    .array(
      z.object({
        section: z.enum(GUIDE_SECTIONS).optional(),
        title: z.string().min(1),
        title_hi: z.string().optional(),
        body_md: z.string().optional(),
        body_md_hi: z.string().optional(),
        sort_order: z.number().int().optional(),
      })
    )
    .optional(),
  dates: z
    .array(
      z.object({
        label: z.string().min(1),
        label_hi: z.string().optional(),
        date: z.string().min(1),
        time: z.string().optional(),
        url: z.string().optional(),
        sort_order: z.number().int().optional(),
      })
    )
    .optional(),
});

export type EventJson = z.infer<typeof eventJsonSchema>;
