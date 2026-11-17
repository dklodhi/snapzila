-- ============================================================
-- SnapZila — Migration 20261116000009
-- Update stages + Corrigendum fields + Guide types (old project parity)
-- ============================================================
-- Aligns update_kind + guide_section enums with old project's
-- UPDATE_TYPES (8) + GOVT_JOB_GUIDES (14) + CORRIGENDUM_FIELDS (8).
-- Adds corrigendum_fields column to event_updates.
-- ============================================================

-- 1. Add missing update_kind values (old project's UPDATE_TYPES)
-- Current: info, warning, result, admit-card, corrigendum, extension, deadline
-- Adding: new, date_extend, answer_key, shortlist, other
alter type public.update_kind add value if not exists 'new';
alter type public.update_kind add value if not exists 'date_extend';
alter type public.update_kind add value if not exists 'answer_key';
alter type public.update_kind add value if not exists 'shortlist';
alter type public.update_kind add value if not exists 'other';

-- 2. Add corrigendum_fields column to event_updates
-- Array of fields affected when kind = 'corrigendum'
-- Values: vacancy, dates, fee, eligibility, qualification, documents, exam_centre, other
alter table public.event_updates add column if not exists corrigendum_fields text[] default array[]::text[];

-- 3. Add missing guide_section values (old project's 14 guide types)
-- Current: eligibility, apply_steps, fees, dates, documents, faq, other
-- Adding: syllabus, exam-pattern, how-to-apply, preparation, best-books,
--         study-material, coaching, previous-papers, cut-off, salary-details,
--         joining-process, interview-tips, posting-locations
alter type public.guide_section add value if not exists 'syllabus';
alter type public.guide_section add value if not exists 'exam-pattern';
alter type public.guide_section add value if not exists 'how-to-apply';
alter type public.guide_section add value if not exists 'preparation';
alter type public.guide_section add value if not exists 'best-books';
alter type public.guide_section add value if not exists 'study-material';
alter type public.guide_section add value if not exists 'coaching';
alter type public.guide_section add value if not exists 'previous-papers';
alter type public.guide_section add value if not exists 'cut-off';
alter type public.guide_section add value if not exists 'salary-details';
alter type public.guide_section add value if not exists 'joining-process';
alter type public.guide_section add value if not exists 'interview-tips';
alter type public.guide_section add value if not exists 'posting-locations';

-- 4. Smoke test
select 'migration 009 complete' as status,
       (select count(*) from pg_enum where enumtypid = (select oid from pg_type where typname = 'update_kind')) as update_kinds,
       (select count(*) from pg_enum where enumtypid = (select oid from pg_type where typname = 'guide_section')) as guide_sections,
       (select count(*) from information_schema.columns where table_name = 'event_updates' and column_name = 'corrigendum_fields') as has_corrigendum_fields;
