-- Migration 007 Part 1: Schema changes (enum values + parent_id)
-- Must be committed before Part 2 (seed inserts) runs.

-- 1. Add parent_id to tags table
alter table public.tags add column if not exists parent_id uuid references public.tags(id) on delete set null;
create index if not exists tags_parent_idx on public.tags(parent_id);

-- 2. Add new tag_kind values (each ALTER TYPE auto-commits)
alter type public.tag_kind add value if not exists 'central-govt';
alter type public.tag_kind add value if not exists 'district';
alter type public.tag_kind add value if not exists 'city';

-- 3. Add new follow_target_type values
alter type public.follow_target_type add value if not exists 'central-govt';
alter type public.follow_target_type add value if not exists 'district';
alter type public.follow_target_type add value if not exists 'city';

select 'part 1 complete' as status;
