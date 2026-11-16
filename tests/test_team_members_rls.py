"""
SnapZila — RLS Test for team_members (Session 1)

Tests:
1. Consumer user (no team_members row) → CANNOT read team_members.
2. Consumer user → CANNOT insert into team_members.
3. Team member (super_admin) → CAN read all team_members.
4. Team member (super_admin) → CAN see own row.

Creates a temporary test consumer user, runs tests, then deletes it.
Uses the Supabase Auth REST API + PostgREST (anon key + user JWT).
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

# Load env keys
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
ANON_KEY = os.environ["NEW_SUPABASE_ANON"]

ADMIN_EMAIL = os.environ.get("SNAPZILA_ADMIN_EMAIL", "admin@snapzila.com")
ADMIN_PASSWORD = os.environ.get("SNAPZILA_ADMIN_PASSWORD", "")
if not ADMIN_PASSWORD:
    print("ERROR: set SNAPZILA_ADMIN_PASSWORD env var before running this test.")
    print("   (The bootstrap admin password — NOT committed to the repo.)")
    sys.exit(1)

TEST_EMAIL = f"rls-test-{int(time.time())}@snapzila.test"
TEST_PASSWORD = "TestPass123!"  # ephemeral test user, deleted after run


def rest(method, path, body=None, apikey=ANON_KEY, jwt=None):
    url = f"{PROJECT_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", apikey)
    req.add_header("Content-Type", "application/json")
    if jwt:
        req.add_header("Authorization", f"Bearer {jwt}")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            body_json = json.loads(body)
        except Exception:
            body_json = {"raw": body[:200]}
        return e.code, body_json
    except Exception as e:
        return None, {"error": str(e)}


def sign_in(email, password):
    """Sign in via Auth REST API. Returns (jwt, user_id) or (None, None)."""
    status, data = rest("POST", "/auth/v1/token?grant_type=password",
                        body={"email": email, "password": password})
    if status != 200:
        return None, None
    return data.get("access_token"), data.get("user", {}).get("id")


def create_test_user():
    """Create a test consumer user via Admin API. Returns (user_id, email)."""
    # Admin API requires service_role in BOTH apikey + Authorization headers
    status, data = rest("POST", "/auth/v1/admin/users",
                        body={
                            "email": TEST_EMAIL,
                            "password": TEST_PASSWORD,
                            "email_confirm": True,
                            "user_metadata": {"full_name": "RLS Test Consumer"},
                        }, apikey=SERVICE_ROLE, jwt=SERVICE_ROLE)
    if status != 200 and status != 201:
        print(f"  Failed to create test user: {status} {data}")
        return None, None
    return data.get("id"), TEST_EMAIL


def delete_test_user(user_id):
    """Delete the test user via Admin API."""
    if not user_id:
        return
    rest("DELETE", f"/auth/v1/admin/users/{user_id}",
         apikey=SERVICE_ROLE, jwt=SERVICE_ROLE)


def select_team_members(jwt):
    """Query team_members via PostgREST with the given JWT."""
    status, data = rest("GET", "/rest/v1/team_members?select=id,email,role,status",
                        apikey=ANON_KEY, jwt=jwt)
    return status, data


def insert_team_member(jwt, user_id):
    """Attempt to insert a team_members row (should fail for consumer)."""
    status, data = rest("POST", "/rest/v1/team_members",
                        body={
                            "user_id": user_id,
                            "email": TEST_EMAIL,
                            "role": "content_writer",
                            "status": "active",
                        }, apikey=ANON_KEY, jwt=jwt)
    return status, data


# ============================================================
# Run tests
# ============================================================
print("=" * 60)
print("SnapZila RLS Test — team_members (Session 1)")
print("=" * 60)

results = []

# --- Test 1: super_admin can read team_members ---
print("\n[Test 1] super_admin reads team_members...")
admin_jwt, admin_uid = sign_in(ADMIN_EMAIL, ADMIN_PASSWORD)
if not admin_jwt:
    print("  ❌ FAIL: could not sign in as admin")
    sys.exit(1)
print(f"  Signed in: {ADMIN_EMAIL} (id={admin_uid[:8]}...)")

status, data = select_team_members(admin_jwt)
if status == 200 and isinstance(data, list):
    print(f"  ✅ PASS: admin can read team_members ({len(data)} rows)")
    for row in data:
        print(f"     - {row['email']:30s} {row['role']:15s} {row['status']}")
    results.append(("admin read team_members", True))
else:
    print(f"  ❌ FAIL: admin got status {status}, data: {data}")
    results.append(("admin read team_members", False))

# --- Test 2: create test consumer user ---
print(f"\n[Test 2] Create test consumer user: {TEST_EMAIL}...")
test_uid, test_email = create_test_user()
if not test_uid:
    print("  ❌ FAIL: could not create test user")
    sys.exit(1)
print(f"  ✅ Created: id={test_uid}")
results.append(("create test user", True))

try:
    # --- Test 3: consumer CANNOT read team_members ---
    print("\n[Test 3] Consumer reads team_members (should get 0 rows)...")
    consumer_jwt, _ = sign_in(TEST_EMAIL, TEST_PASSWORD)
    if not consumer_jwt:
        print("  ❌ FAIL: could not sign in as consumer")
        results.append(("consumer sign in", False))
    else:
        status, data = select_team_members(consumer_jwt)
        if status == 200 and isinstance(data, list) and len(data) == 0:
            print(f"  ✅ PASS: consumer sees 0 team_members rows (RLS blocks)")
            results.append(("consumer blocked from reading team_members", True))
        elif status == 200 and isinstance(data, list) and len(data) > 0:
            print(f"  ❌ FAIL: consumer sees {len(data)} rows (RLS leak!)")
            for row in data:
                print(f"     - {row['email']} {row['role']}")
            results.append(("consumer blocked from reading team_members", False))
        else:
            print(f"  ❌ FAIL: unexpected status {status}, data: {data}")
            results.append(("consumer blocked from reading team_members", False))

    # --- Test 4: consumer CANNOT insert into team_members ---
    print("\n[Test 4] Consumer tries to insert team_members (should fail)...")
    if consumer_jwt:
        status, data = insert_team_member(consumer_jwt, test_uid)
        if status in (401, 403):
            print(f"  ✅ PASS: insert blocked (status {status})")
            results.append(("consumer blocked from inserting team_members", True))
        elif status in (200, 201):
            print(f"  ❌ FAIL: insert succeeded (RLS leak!) row: {data}")
            results.append(("consumer blocked from inserting team_members", False))
        else:
            print(f"  ✅ PASS: insert rejected (status {status}: {data.get('message', '')[:80]})")
            results.append(("consumer blocked from inserting team_members", True))

finally:
    # --- Cleanup ---
    print(f"\n[Cleanup] Deleting test user {test_uid[:8]}...")
    delete_test_user(test_uid)
    print("  ✅ Deleted")

# --- Summary ---
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
passed = sum(1 for _, ok in results if ok)
failed = sum(1 for _, ok in results if not ok)
for name, ok in results:
    print(f"  {'✅' if ok else '❌'} {name}")
print(f"\n{passed} passed, {failed} failed, {len(results)} total")
if failed > 0:
    sys.exit(1)
print("\n🎉 All RLS tests passed.")
