#!/usr/bin/env python3
"""Upload AACCUP program accreditation workbook + searchable text dump to the API."""
from __future__ import annotations

import json
import sys
import tempfile
import time
from pathlib import Path

import requests

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"
XLSX = Path(
    sys.argv[2]
    if len(sys.argv) > 2
    else r"c:\Users\My Pc\Downloads\D1 - ACCREVIA (AACCUP PROGRAM ACCREDITATION STATUS) (1).xlsx"
)
RECORDS_TS = Path(__file__).resolve().parents[2] / "frontend" / "src" / "data" / "programAccreditationRecords.ts"


def wait_indexed(doc_id: str, timeout: int = 180) -> dict:
    deadline = time.time() + timeout
    last = {}
    while time.time() < deadline:
        last = requests.get(f"{BASE}/api/documents/{doc_id}/status/", timeout=30).json()
        if last.get("status") in {"Indexed", "Failed"}:
            return last
        time.sleep(2)
    return last


def upload(path: Path, **meta) -> str:
    with path.open("rb") as fh:
        files = {"file": (path.name, fh, "application/octet-stream")}
        data = {k: v for k, v in meta.items() if v is not None}
        resp = requests.post(f"{BASE}/api/documents/", data=data, files=files, timeout=600)
    print("upload", path.name, resp.status_code, resp.text[:300])
    resp.raise_for_status()
    doc_id = resp.json()["id"]
    st = wait_indexed(doc_id)
    print("status", path.name, st)
    return doc_id


def build_text_dump() -> Path:
    """Parse generated TS records into a plain-text corpus for hybrid search."""
    import re

    text = RECORDS_TS.read_text(encoding="utf-8")
    # crude object split
    blocks = re.findall(r"\{\s*id: \"(pa-[^\"]+)\"(.*?)\n  \},", text, flags=re.S)
    lines = [
        "AACCUP Program Accreditation Status — North Eastern Mindanao State University",
        "Source workbook: D1 - ACCREVIA (AACCUP PROGRAM ACCREDITATION STATUS)",
        f"Programs in seed: {len(blocks)}",
        "",
    ]
    for pid, body in blocks:
        def field(name: str) -> str:
            m = re.search(rf"{name}: \"([^\"]*)\"", body)
            return m.group(1) if m else ""

        lines.append(f"Program ID: {pid}")
        lines.append(f"Campus: {field('campusName')} ({field('campusId')})")
        lines.append(f"Program: {field('programName')}")
        lines.append(f"Degree level: {field('degreeLevel')}")
        lines.append(f"Year of initial operation: {field('yearOfInitialOperation')}")
        lines.append(f"Accreditation status: {field('status')}")
        lines.append(f"Validity: {field('validityStart')} to {field('validityEnd')}")
        lines.append(f"COPC status: {field('copcStatus')}")
        if field("remarks"):
            lines.append(f"Remarks: {field('remarks')}")
        for link_name in (
            "certificationFile",
            "instrumentLink",
            "findingsLink",
            "technicalReviewLink",
            "borRes",
            "cmoNo",
        ):
            val = field(link_name)
            if val:
                lines.append(f"{link_name}: {val}")
        lines.append("---")
    out = Path(tempfile.gettempdir()) / "accrevia_aaccup_program_status.txt"
    out.write_text("\n".join(lines), encoding="utf-8")
    return out


def main() -> int:
    health = requests.get(f"{BASE}/api/health/", timeout=60)
    print("health", health.status_code, health.text[:400])
    health.raise_for_status()

    # Workbook (.xlsx) is not OCR/text-extract friendly in the pipeline — upload
    # searchable plain-text dumps derived from the imported seed instead.
    if not XLSX.exists():
        print("Workbook missing (seed may still be current):", XLSX)

    # 1) Upload searchable text dump of all seeded programs
    dump = build_text_dump()
    upload(
        dump,
        title="AACCUP Program Accreditation Status — Searchable Dump",
        description="Plain-text export of program accreditation records for hybrid search",
        frameworkId="pa",
        docType="Accreditation Report",
        campus="North Eastern Mindanao State University",
        campusId="tandag",
        program="All Programs",
        academicYear="2026",
        confidentiality="Internal",
        uploadedBy="accreditation-import",
        keywords="AACCUP,program status,search dump",
    )

    # 3) Per-campus summary snippets (helps filtered campus search)
    import re

    text = RECORDS_TS.read_text(encoding="utf-8")
    blocks = re.findall(r"\{\s*id: \"(pa-[^\"]+)\"(.*?)(?:\n  \},)", text, flags=re.S)
    by_campus: dict[str, list[str]] = {}
    for pid, body in blocks:
        m = re.search(r'campusId: "([^"]+)"', body)
        name = re.search(r'campusName: "([^"]+)"', body)
        prog = re.search(r'programName: "([^"]+)"', body)
        status = re.search(r'status: "([^"]+)"', body)
        if not (m and prog and status):
            continue
        cid = m.group(1)
        cname = name.group(1) if name else cid
        by_campus.setdefault(cid, [cname])
        by_campus[cid].append(f"- {prog.group(1)}: {status.group(1)} ({pid})")

    for cid, rows in by_campus.items():
        cname = rows[0]
        body = (
            f"AACCUP Program Accreditation Status — {cname}\n"
            f"Campus ID: {cid}\n\n"
            + "\n".join(rows[1:])
            + "\n"
        )
        path = Path(tempfile.gettempdir()) / f"accrevia_aaccup_{cid}.txt"
        path.write_text(body, encoding="utf-8")
        upload(
            path,
            title=f"AACCUP Program Status — {cname}",
            description=f"Program accreditation status list for {cname}",
            frameworkId="pa",
            docType="Accreditation Report",
            campus=cname,
            campusId=cid,
            program="Campus Program List",
            academicYear="2026",
            confidentiality="Internal",
            uploadedBy="accreditation-import",
            keywords=f"AACCUP,{cid},program status",
        )

    print("DONE")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
