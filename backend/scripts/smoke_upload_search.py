#!/usr/bin/env python
"""Smoke: health → upload text file → poll → search."""
from __future__ import annotations

import json
import sys
import tempfile
import time
from pathlib import Path

import requests

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"


def main() -> int:
    health = requests.get(f"{BASE}/api/health/", timeout=10)
    print("health", health.status_code, health.text)
    if health.status_code != 200:
        print("Backend not ready (start docker compose + runserver + worker).")
        return 1

    payload_path = Path(tempfile.gettempdir()) / "accrevia_smoke.txt"
    payload_path.write_text(
        "Faculty development seminar for institutional accreditation criterion 2 professional development.",
        encoding="utf-8",
    )

    with payload_path.open("rb") as fh:
        up = requests.post(
            f"{BASE}/api/documents/",
            data={
                "title": "Smoke Faculty Development",
                "frameworkId": "ia",
                "campusId": "tandag",
                "campus": "Main Campus (Tandag City)",
            },
            files={"file": ("accrevia_smoke.txt", fh, "text/plain")},
            timeout=120,
        )
    print("upload", up.status_code, up.text[:500])
    up.raise_for_status()
    doc_id = up.json()["id"]

    st = {"status": "Processing"}
    for _ in range(90):
        st = requests.get(f"{BASE}/api/documents/{doc_id}/status/", timeout=30).json()
        print("status", st)
        if st.get("status") in {"Indexed", "Failed"}:
            break
        time.sleep(2)

    if st.get("status") != "Indexed":
        print("Ingestion did not index document.")
        return 2

    search = requests.post(
        f"{BASE}/api/search/",
        json={"q": "faculty development criterion 2", "frameworkId": "ia", "limit": 5},
        timeout=180,
    )
    print("search", search.status_code)
    body = search.json()
    print(json.dumps(body, indent=2)[:2000])
    search.raise_for_status()
    if not body.get("results"):
        print("No search hits.")
        return 3
    print("SMOKE OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())