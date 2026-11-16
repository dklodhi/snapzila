"""
S8 Seed Script v2 — inserts events directly via REST API (bypassing the RPC casting issue).
"""
import json
import os
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from pathlib import Path

env_path = Path("/home/z/my-project/workspace/.env.keys")
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            if line.startswith("export "): line = line[7:]
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip().strip('"').strip("'")

PROJECT_URL = os.environ["NEW_SUPABASE_URL"]
SERVICE_ROLE = os.environ["NEW_SUPABASE_SERVICE_ROLE"]

def rest(method, path, body=None):
    url = f"{PROJECT_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", SERVICE_ROLE)
    req.add_header("Authorization", f"Bearer {SERVICE_ROLE}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:300]
        if "23505" in body: return "exists"
        print(f"  ERROR {e.code}: {body}")
        return None
    except Exception as e:
        print(f"  ERROR: {e}")
        return None

# Insert events from JSON samples (direct insert, not RPC)
print("=== Seeding events ===")
samples_dir = Path("/home/z/my-project/workspace/new-repo/public/json-samples")
for sample_file in sorted(samples_dir.glob("*.sample.json")):
    sample = json.loads(sample_file.read_text())
    event_data = {
        "type": sample["type"],
        "slug": sample["slug"],
        "title": sample["title"],
        "title_hi": sample.get("title_hi"),
        "summary": sample.get("summary"),
        "summary_hi": sample.get("summary_hi"),
        "conducting_body": sample.get("conducting_body"),
        "conducting_body_slug": sample.get("conducting_body_slug"),
        "apply_mode": sample.get("apply_mode", "na"),
        "apply_link": sample.get("apply_link"),
        "apply_start_date": sample.get("apply_start_date"),
        "apply_end_date": sample.get("apply_end_date"),
        "exam_date": sample.get("exam_date"),
        "result_date": sample.get("result_date"),
        "status": "published",
        "published_at": datetime.now().isoformat(),
        "featured": sample.get("featured", False),
        "tags": sample.get("tags", []),
        "eligibility": sample.get("eligibility", {}),
        "vacancy": sample.get("vacancy", {}),
        "fees_breakdown": sample.get("fees_breakdown", {}),
        "fees_inr_paise": sample.get("fees_inr_paise"),
        "selection_process": sample.get("selection_process", []),
        "body_md": sample.get("body_md"),
        "body_md_hi": sample.get("body_md_hi"),
        "meta_title": sample.get("meta_title"),
        "meta_description": sample.get("meta_description"),
    }
    result = rest("POST", "/rest/v1/events", event_data)
    if result == "exists":
        print(f"  ↻ {sample['type']}: already exists")
    elif result:
        event_id = result[0]["id"] if isinstance(result, list) else result.get("id")
        print(f"  ✅ {sample['type']}: {event_id[:8]}...")
        # Insert child rows
        for u in sample.get("updates", []):
            rest("POST", "/rest/v1/event_updates", {"event_id": event_id, "kind": u.get("kind", "info"), "title": u["title"], "body_md": u.get("body_md"), "sort_order": u.get("sort_order", 0)})
        for g in sample.get("guides", []):
            rest("POST", "/rest/v1/event_guides", {"event_id": event_id, "section": g.get("section", "other"), "title": g["title"], "body_md": g.get("body_md"), "sort_order": g.get("sort_order", 0)})
        for d in sample.get("dates", []):
            rest("POST", "/rest/v1/event_dates", {"event_id": event_id, "label": d["label"], "date": d["date"], "url": d.get("url"), "sort_order": d.get("sort_order", 0)})
    else:
        print(f"  ❌ {sample['type']}")

# Summary
print("\n=== Summary ===")
for table in ["events", "event_updates", "event_guides", "event_dates", "static_pages", "helpline_entries", "employment_news_issues"]:
    url = f"{PROJECT_URL}/rest/v1/{table}?select=id"
    req = urllib.request.Request(url)
    req.add_header("apikey", SERVICE_ROLE)
    req.add_header("Authorization", f"Bearer {SERVICE_ROLE}")
    req.add_header("Range", "0-0")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            range_header = resp.headers.get("content-range", "")
            count = range_header.split("/")[-1] if "/" in range_header else "?"
            print(f"  {table}: {count} rows")
    except:
        print(f"  {table}: ?")

print("\n🎉 Seed complete.")
