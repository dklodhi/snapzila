-- Migration 007 Part 2: Seed jurisdiction/sector/org tags
-- Run AFTER Part 1 (enum values must be committed).

-- Central govt (top-level, no parent)
insert into public.tags (slug, label, kind, parent_id)
values ('central-govt', 'Central Government', 'central-govt', null)
on conflict (slug) do nothing;

-- All Indian states (kind='state', no parent)
insert into public.tags (slug, label, kind, parent_id)
select slug, label, 'state'::public.tag_kind, null
from (values
  ('andhra-pradesh', 'Andhra Pradesh'),
  ('arunachal-pradesh', 'Arunachal Pradesh'),
  ('assam', 'Assam'),
  ('bihar', 'Bihar'),
  ('chhattisgarh', 'Chhattisgarh'),
  ('goa', 'Goa'),
  ('gujarat', 'Gujarat'),
  ('haryana', 'Haryana'),
  ('himachal-pradesh', 'Himachal Pradesh'),
  ('jharkhand', 'Jharkhand'),
  ('karnataka', 'Karnataka'),
  ('kerala', 'Kerala'),
  ('madhya-pradesh', 'Madhya Pradesh'),
  ('maharashtra', 'Maharashtra'),
  ('manipur', 'Manipur'),
  ('meghalaya', 'Meghalaya'),
  ('mizoram', 'Mizoram'),
  ('nagaland', 'Nagaland'),
  ('odisha', 'Odisha'),
  ('punjab', 'Punjab'),
  ('rajasthan', 'Rajasthan'),
  ('sikkim', 'Sikkim'),
  ('tamil-nadu', 'Tamil Nadu'),
  ('telangana', 'Telangana'),
  ('tripura', 'Tripura'),
  ('uttar-pradesh', 'Uttar Pradesh'),
  ('uttarakhand', 'Uttarakhand'),
  ('west-bengal', 'West Bengal'),
  ('delhi', 'Delhi'),
  ('jammu-kashmir', 'Jammu & Kashmir'),
  ('ladakh', 'Ladakh'),
  ('chandigarh', 'Chandigarh'),
  ('puducherry', 'Puducherry'),
  ('andaman-nicobar', 'Andaman & Nicobar Islands'),
  ('dadra-nagar-haveli-daman-diu', 'Dadra & Nagar Haveli and Daman & Diu'),
  ('lakshadweep', 'Lakshadweep')
) as t(slug, label)
on conflict (slug) do nothing;

-- Major sectors
insert into public.tags (slug, label, kind)
select slug, label, 'sector'::public.tag_kind
from (values
  ('banking', 'Banking'),
  ('railway', 'Railway'),
  ('defence', 'Defence'),
  ('police', 'Police'),
  ('education', 'Education'),
  ('healthcare', 'Healthcare'),
  ('engineering', 'Engineering'),
  ('agriculture', 'Agriculture'),
  ('public-sector', 'Public Sector (PSU)'),
  ('teaching', 'Teaching'),
  ('clerical', 'Clerical'),
  ('technical', 'Technical')
) as t(slug, label)
on conflict (slug) do nothing;

-- Major conducting bodies (orgs)
insert into public.tags (slug, label, kind)
select slug, label, 'org'::public.tag_kind
from (values
  ('ssc', 'Staff Selection Commission'),
  ('upsc', 'Union Public Service Commission'),
  ('ibps', 'Institute of Banking Personnel Selection'),
  ('rrb', 'Railway Recruitment Board'),
  ('rpsc', 'Rajasthan Public Service Commission'),
  ('upsssc', 'Uttar Pradesh Subordinate Services Selection Commission'),
  ('mpsc', 'Maharashtra Public Service Commission'),
  ('bpsc', 'Bihar Public Service Commission'),
  ('tnpsc', 'Tamil Nadu Public Service Commission'),
  ('kpsc', 'Karnataka Public Service Commission'),
  ('nta', 'National Testing Agency'),
  ('cbse', 'Central Board of Secondary Education'),
  ('aicte', 'All India Council for Technical Education'),
  ('ugc', 'University Grants Commission')
) as t(slug, label)
on conflict (slug) do nothing;

select 'part 2 complete' as status,
       (select count(*) from public.tags) as total_tags,
       (select count(*) from public.tags where kind = 'state') as state_tags,
       (select count(*) from public.tags where kind = 'sector') as sector_tags,
       (select count(*) from public.tags where kind = 'org') as org_tags,
       (select count(*) from public.tags where kind = 'central-govt') as central_govt_tags;
