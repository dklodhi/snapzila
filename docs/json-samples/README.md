# JSON Samples

One sample per content type. Used by the console's "JSON paste" editor as the "Load sample" source, and as the canonical example in docs.

Each sample has the shape:

```json
{
  "schema_version": 1,
  "type": "govt-jobs",
  "data": { ... }
}
```

Files (created in Session 2):

- `govt-jobs.sample.json`
- `admissions.sample.json`
- `scholarships.sample.json`
- `govt-schemes.sample.json`
- `news.sample.json`
- `articles.sample.json`

The Zod schemas that validate these live in `lib/console/schemas/<type>.ts` (created in Session 2).
