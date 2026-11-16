"""
S8 Seed Script — populates About/Contact pages + sample events + helpline + employment news.
Uses Supabase REST API with service_role key.
"""
import json
import os
import urllib.request
import urllib.error
from pathlib import Path

# Load keys
env_path = Path("/home/z/my-project/workspace/.env.keys")
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            if line.startswith("export "):
                line = line[7:]
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
        print(f"  ERROR {e.code}: {e.read().decode()[:200]}")
        return None
    except Exception as e:
        print(f"  ERROR: {e}")
        return None

# 1. Static pages
print("=== Seeding static pages ===")
pages = [
    {
        "slug": "about",
        "title": "About SnapZila",
        "title_hi": "SnapZila के बारे में",
        "body_md": "## About SnapZila\n\nSnapZila is a **Data Driven Event Centric Live Update System for Career & Education**. We track opportunities across India — Govt Jobs, Admissions, Scholarships, Govt Schemes, News, and Articles — and present each as an Event with a real-time live-update timeline and structured guide.\n\n### Our Mission\n\nTo be the single source of truth for career and education opportunities in India, with real-time updates that keep you informed at every step.\n\n### What Makes Us Different\n\n- **Event-centric**: Every opportunity is an Event with a live-update timeline, not a static blog post.\n- **Real-time**: New updates push live via Supabase Realtime.\n- **Structured guides**: Eligibility, apply steps, fees, dates — organized, not buried in PDFs.\n- **Voice-type discussions**: Contextual comments from aspirants, selected candidates, mentors, and officials.",
        "body_md_hi": "## SnapZila के बारे में\n\nSnapZila करियर और शिक्षा के लिए एक डेटा-संचालित इवेंट-केंद्रित लाइव अपडेट सिस्टम है।",
        "show_in_footer": True,
        "show_in_header": False,
        "sort_order": 1,
        "status": "published",
    },
    {
        "slug": "contact",
        "title": "Contact Us",
        "title_hi": "संपर्क करें",
        "body_md": "## Contact SnapZila\n\nHave a question, feedback, or correction? We'd love to hear from you.\n\n### Ways to Reach Us\n\n- **Contact form**: Use the [contact page](/contact) to send us a message.\n- **Helpline**: Visit our [helpline directory](/helpline) for official exam body contacts.\n\n### Response Time\n\nWe typically respond within 2–3 business days. For urgent corrections (e.g., wrong exam date), please use the contact form with category \"Content Correction\".",
        "body_md_hi": "## SnapZila से संपर्क करें\n\nकोई प्रश्न, फीडबैक, या सुधार है? हमें संदेश भेजें।",
        "show_in_footer": True,
        "show_in_header": False,
        "sort_order": 2,
        "status": "published",
    },
]
for page in pages:
    result = rest("POST", "/rest/v1/static_pages", page)
    if result:
        print(f"  ✅ {page['slug']} page created")
    else:
        # Try upsert
        rest("PATCH", f"/rest/v1/static_pages?slug=eq.{page['slug']}", page)
        print(f"  ↻ {page['slug']} page upserted")

# 2. Sample events via create_event_from_json RPC
print("\n=== Seeding sample events ===")
samples_dir = Path("/home/z/my-project/workspace/new-repo/public/json-samples")
for sample_file in sorted(samples_dir.glob("*.sample.json")):
    sample = json.loads(sample_file.read_text())
    # Call RPC
    url = f"{PROJECT_URL}/rest/v1/rpc/create_event_from_json"
    data = json.dumps({"payload": sample}).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("apikey", SERVICE_ROLE)
    req.add_header("Authorization", f"Bearer {SERVICE_ROLE}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            print(f"  ✅ {sample['type']}: {result}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200]
        if "duplicate" in body.lower() or "23505" in body:
            print(f"  ↻ {sample['type']} already exists")
        else:
            print(f"  ❌ {sample['type']}: {body}")

# 3. Helpline entries
print("\n=== Seeding helpline entries ===")
helplines = [
    {"title": "SSC Helpline", "category": "Exam Body", "phone": "1800-XXX-XXXX", "email": "help@ssc.gov.in", "website": "https://ssc.nic.in", "body_md": "Staff Selection Commission helpline for CGL, CHSL, and other SSC exams.", "status": "published", "sort_order": 1},
    {"title": "UPSC Helpline", "category": "Exam Body", "phone": "011-23385271", "email": "online.upsc@nic.in", "website": "https://upsc.gov.in", "body_md": "Union Public Service Commission helpline for Civil Services, CDS, NDA exams.", "status": "published", "sort_order": 2},
    {"title": "IBPS Helpline", "category": "Exam Body", "phone": "1800-XXX-XXXX", "website": "https://ibps.in", "body_md": "Institute of Banking Personnel Selection helpline for bank PO, Clerk exams.", "status": "published", "sort_order": 3},
    {"title": "National Scholarship Portal Helpline", "category": "Scheme", "phone": "0120-6475900", "email": "helpdesknsp@gov.in", "website": "https://scholarships.gov.in", "body_md": "NSP helpline for scholarship queries.", "status": "published", "sort_order": 4},
]
for h in helplines:
    result = rest("POST", "/rest/v1/helpline_entries", h)
    if result:
        print(f"  ✅ {h['title']}")

# 4. Employment news issue
print("\n=== Seeding employment news issue ===")
from datetime import datetime, timedelta
now = datetime.now()
monday = now - timedelta(days=now.weekday())
sunday = monday + timedelta(days=6)
issue = {
    "issue_number": 1,
    "week_start": monday.strftime("%Y-%m-%d"),
    "week_end": sunday.strftime("%Y-%m-%d"),
    "title": f"Employment News — Week of {monday.strftime('%d %b')}",
    "intro_md": "This week's top government job notifications. Apply before the deadlines!",
    "status": "published",
    "published_at": now.isoformat(),
}
result = rest("POST", "/rest/v1/employment_news_issues", issue)
if result:
    print(f"  ✅ Issue #1 created")
else:
    print(f"  ↻ Issue may already exist")

# 5. Count summary
print("\n=== Summary ===")
for table in ["events", "static_pages", "helpline_entries", "employment_news_issues", "institutions"]:
    url = f"{PROJECT_URL}/rest/v1/{table}?select=id"
    req = urllib.request.Request(url)
    req.add_header("apikey", SERVICE_ROLE)
    req.add_header("Authorization", f"Bearer {SERVICE_ROLE}")
    req.add_header("Range", "0-0")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            count = resp.headers.get("content-range", "").split("/")[-1]
            print(f"  {table}: {count} rows")
    except:
        print(f"  {table}: ?")

print("\n🎉 Seed complete.")
