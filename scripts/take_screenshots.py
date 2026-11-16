"""Take screenshots of SnapZila for S8 preview."""
import os
from playwright.sync_api import sync_playwright
from pathlib import Path

OUT = Path("/home/z/my-project/workspace/new-repo/public/screenshots")
OUT.mkdir(parents=True, exist_ok=True)

BASE = "http://localhost:3000"

PAGES = [
    ("home", "/", "SnapZila — Home"),
    ("opportunities", "/opportunities", "Opportunities Landing"),
    ("govt-jobs-list", "/opportunities/govt-jobs", "Govt Jobs Listing"),
    ("event-view", "/opportunities/govt-jobs/ssc-cgl-2026-notification", "SSC CGL Event View"),
    ("helpline", "/helpline", "Helpline"),
    ("exam-calendar", "/tools/exam-calendar", "Exam Calendar"),
    ("employment-news", "/tools/employment-news", "Employment News"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1280, "height": 800},
        device_scale_factor=1,
    )

    for name, path, title in PAGES:
        page = context.new_page()
        try:
            page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(1500)  # extra settle time
            screenshot_path = OUT / f"{name}.png"
            page.screenshot(path=str(screenshot_path), full_page=False)
            print(f"✅ {name}: {screenshot_path.stat().st_size // 1024}KB")
        except Exception as e:
            print(f"❌ {name}: {e}")
        finally:
            page.close()

    # Also take a mobile screenshot of the event page
    mobile_context = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
    )
    page = mobile_context.new_page()
    try:
        page.goto(f"{BASE}/opportunities/govt-jobs/ssc-cgl-2026-notification", wait_until="networkidle", timeout=15000)
        page.wait_for_timeout(1500)
        page.screenshot(path=str(OUT / "event-view-mobile.png"), full_page=False)
        print(f"✅ event-view-mobile: { (OUT / 'event-view-mobile.png').stat().st_size // 1024 }KB")
    except Exception as e:
        print(f"❌ mobile: {e}")
    finally:
        page.close()
        mobile_context.close()

    browser.close()

print(f"\nScreenshots saved to {OUT}/")
