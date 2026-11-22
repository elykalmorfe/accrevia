#!/usr/bin/env python3
"""Import AACCUP program accreditation status workbook into programAccreditationRecords.ts."""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path

try:
    import openpyxl
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl", "-q"])
    import openpyxl

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "programAccreditationRecords.ts"

CAMPUS_MAP = [
    (re.compile(r"tandag", re.I), "tandag", "Tandag Campus (Main)"),
    (re.compile(r"cantilan", re.I), "cantilan", "Cantilan Campus"),
    (re.compile(r"cagwait", re.I), "cagwait", "Cagwait Campus"),
    (re.compile(r"san\s*miguel", re.I), "san-miguel", "San Miguel Campus"),
    (re.compile(r"lianga", re.I), "lianga", "Lianga Campus"),
    (re.compile(r"tagbina", re.I), "tagbina", "Tagbina Campus"),
    (re.compile(r"bislig", re.I), "bislig", "Bislig Campus"),
]

CAMPUS_PREFIX = {
    "tandag": "tan",
    "cantilan": "can",
    "cagwait": "cag",
    "san-miguel": "sm",
    "lianga": "lia",
    "tagbina": "tag",
    "bislig": "bis",
}

LEVEL_ALIASES = {
    "candidate": "Candidate",
    "level 1": "Level 1",
    "level i": "Level 1",
    "level 2": "Level 2",
    "level ii": "Level 2",
    "level 3": "Level 3",
    "level iii": "Level 3",
    "level 4": "Level 4",
    "level iv": "Level 4",
    "not yet due for accreditation": "Not Yet Due for Accreditation",
    "not accreditable": "Not Accreditable",
    "new program": "New Program",
    "preliminary": "Candidate",
}


def norm_name(s: str) -> str:
    s = (s or "").lower()
    s = s.replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def parse_date(val) -> str:
    if val is None or val == "":
        return ""
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d")
    text = str(val).strip()
    if not text or text.lower() in {"n/a", "na", "-", "none"}:
        return ""
    text = text.replace(".", "")
    for fmt in ("%b-%d-%Y", "%B-%d-%Y", "%b-%d-%y", "%Y-%m-%d", "%m/%d/%Y", "%d-%b-%Y"):
        try:
            return datetime.strptime(text, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    # Sept-16-2024 style already covered; try Sept-01-2024
    m = re.match(r"([A-Za-z]+)-(\d{1,2})-(\d{4})", text)
    if m:
        mon, day, year = m.groups()
        mon = mon[:3].title()
        try:
            return datetime.strptime(f"{mon}-{int(day):02d}-{year}", "%b-%d-%Y").strftime("%Y-%m-%d")
        except ValueError:
            pass
    return ""


def normalize_level(val) -> str | None:
    if val is None or val == "":
        return None
    key = str(val).strip().lower()
    key = re.sub(r"\s+", " ", key)
    if key in LEVEL_ALIASES:
        return LEVEL_ALIASES[key]
    for k, v in LEVEL_ALIASES.items():
        if k in key:
            return v
    # keep title-ish if looks like a level
    cleaned = str(val).strip()
    if cleaned:
        return cleaned
    return None


def detect_campus(cell: str):
    if not cell or not isinstance(cell, str):
        return None
    if "CAMPUS" not in cell.upper() and not any(p.search(cell) for p, _, _ in CAMPUS_MAP):
        # still try map
        pass
    for pat, cid, cname in CAMPUS_MAP:
        if pat.search(cell):
            return cid, cname
    return None


def is_drive_or_url(val) -> bool:
    if not isinstance(val, str):
        return False
    v = val.strip()
    return v.startswith("http://") or v.startswith("https://")


def as_link(val) -> str | None:
    if not isinstance(val, str):
        return None
    v = val.strip()
    if not v:
        return None
    if is_drive_or_url(v):
        return v
    # bare filename — keep as-is for UI display
    if v.lower().endswith((".pdf", ".doc", ".docx", ".xlsx")):
        return v
    return None


def degree_level(program_name: str) -> str:
    n = program_name.lower()
    if any(
        x in n
        for x in (
            "master",
            "doctor",
            "ph.d",
            "phd",
            "graduate",
            "mba",
            "mpa",
        )
    ):
        return "Graduate"
    return "Undergraduate"


def map_copc_status(val) -> str:
    if not val:
        return "Pending"
    t = str(val).strip().lower()
    if "with copc" in t or t in {"compliant", "yes", "issued"}:
        return "Compliant"
    if "n/a" in t or "not applicable" in t or "under 5" in t:
        return "Not Applicable"
    return "Pending"


def campus_sections(ws):
    """Yield (campus_id, campus_name, start_row_idx) for program rows following each campus header."""
    rows = list(ws.iter_rows(values_only=True))
    markers = []
    for i, row in enumerate(rows):
        a = row[0] if row else None
        b = row[1] if row and len(row) > 1 else None
        for cell in (a, b):
            if isinstance(cell, str):
                found = detect_campus(cell)
                if found and ("CAMPUS" in cell.upper() or found[0]):
                    # Prefer explicit CAMPUS headers
                    if "CAMPUS" in cell.upper() or cell.strip().endswith("SDS") or "Surigao" in cell:
                        markers.append((i, found[0], found[1]))
                        break
    # Deduplicate consecutive same campus
    cleaned = []
    for m in markers:
        if cleaned and cleaned[-1][1] == m[1] and m[0] - cleaned[-1][0] < 3:
            continue
        cleaned.append(m)
    return cleaned, rows


def parse_2026(ws):
    markers, rows = campus_sections(ws)
    programs = []
    for mi, (start, cid, cname) in enumerate(markers):
        end = markers[mi + 1][0] if mi + 1 < len(markers) else len(rows)
        seq = 0
        for i in range(start + 1, end):
            row = rows[i]
            if not row or len(row) < 4:
                continue
            num, name = row[0], row[1]
            if not isinstance(name, str) or not name.strip():
                continue
            if isinstance(num, str) and "CAMPUS" in num.upper():
                continue
            if not (isinstance(num, (int, float)) or (isinstance(num, str) and num.strip().isdigit())):
                # some rows may still be programs without number
                if detect_campus(name):
                    continue
            seq += 1
            prefix = CAMPUS_PREFIX[cid]
            pid = f"pa-{prefix}-{seq:02d}"
            year = row[2]
            status = normalize_level(row[3]) or "Candidate"
            vstart = parse_date(row[4] if len(row) > 4 else None)
            vend = parse_date(row[5] if len(row) > 5 else None)
            cert = as_link(row[6] if len(row) > 6 else None)
            instrument = as_link(row[7] if len(row) > 7 else None)
            findings = as_link(row[8] if len(row) > 8 else None)
            technical = as_link(row[9] if len(row) > 9 else None)
            copc_link = as_link(row[10] if len(row) > 10 else None)
            bor = row[11] if len(row) > 11 else None
            cmo = row[12] if len(row) > 12 else None
            level_status = row[13] if len(row) > 13 else None
            schedule = row[14] if len(row) > 14 else None
            remarks = row[15] if len(row) > 15 else None

            def cell_str(v):
                if v is None:
                    return None
                if isinstance(v, datetime):
                    return v.strftime("%Y-%m-%d")
                s = str(v).strip()
                return s or None

            # bor/cmo may be drive links
            bor_s = cell_str(bor)
            cmo_s = cell_str(cmo)
            if bor_s and is_drive_or_url(bor_s):
                # store link in borRes as URL string (matches prior seed practice for some fields)
                pass

            yoi = ""
            if isinstance(year, (int, float)):
                yoi = str(int(year))
            elif year:
                yoi = str(year).strip()

            rec = {
                "id": pid,
                "campusId": cid,
                "campusName": cname,
                "programName": name.strip(),
                "degreeLevel": degree_level(name),
                "yearOfInitialOperation": yoi,
                "status": status,
                "validityStart": vstart,
                "validityEnd": vend,
                "copcStatus": "Pending",
                "_norm": norm_name(name),
                "_copc_link": copc_link,
            }
            if cert:
                rec["certificationFile"] = cert
            if instrument:
                rec["instrumentLink"] = instrument
            if findings:
                rec["findingsLink"] = findings
            if technical:
                rec["technicalReviewLink"] = technical
            if bor_s:
                rec["borRes"] = bor_s
            if cmo_s:
                rec["cmoNo"] = cmo_s
            if level_status:
                rec["levelStatusForAccreditation"] = cell_str(level_status)
            if schedule:
                sched = cell_str(schedule)
                if sched:
                    # prefer ISO date if datetime already parsed via cell_str
                    rec["scheduleForAccreditation"] = sched
            if remarks:
                rec["remarks"] = cell_str(remarks)
            programs.append(rec)
    return programs


def parse_level_status(ws):
    """Return dict[(campusId, norm_name)] -> list of history entries + optional validity."""
    markers, rows = campus_sections(ws)
    out = {}
    years = [2022, 2023, 2024, 2025, 2026]
    for mi, (start, cid, _cname) in enumerate(markers):
        end = markers[mi + 1][0] if mi + 1 < len(markers) else len(rows)
        for i in range(start + 1, end):
            row = rows[i]
            if not row or len(row) < 5:
                continue
            name = row[1]
            if not isinstance(name, str) or not name.strip():
                continue
            key = (cid, norm_name(name))
            history = []
            for yi, year in enumerate(years):
                col = 4 + yi
                if col >= len(row):
                    break
                level = normalize_level(row[col])
                if not level:
                    continue
                # skip duplicates of same level without change? keep yearly snapshot
                history.append(
                    {
                        "year": year,
                        "level": level,
                        "result": "Passed",
                        "remarks": "AACCUP Level Status record",
                        "recordedAt": f"{year}-12-31T00:00:00.000Z",
                        "recordedBy": "Accreditation Office",
                    }
                )
            vstart = parse_date(row[9] if len(row) > 9 else None)
            vend = parse_date(row[10] if len(row) > 10 else None)
            out[key] = {"history": history, "validityStart": vstart, "validityEnd": vend, "name": name.strip()}
    return out


def parse_copc(ws):
    markers, rows = campus_sections(ws)
    out = {}
    for mi, (start, cid, _cname) in enumerate(markers):
        end = markers[mi + 1][0] if mi + 1 < len(markers) else len(rows)
        for i in range(start + 1, end):
            row = rows[i]
            if not row or len(row) < 5:
                continue
            name = row[1]
            if not isinstance(name, str) or not name.strip():
                continue
            # Headers: Programs, Year, COPC NO., COPC STATUS, REMARKS
            # Observed sheet sometimes puts level in COPC NO. column — treat STATUS carefully
            copc_no = row[3] if len(row) > 3 else None
            copc_status_raw = row[4] if len(row) > 4 else None
            remarks = row[5] if len(row) > 5 else None
            status_val = copc_status_raw
            cert_no = None
            if isinstance(copc_status_raw, str) and "copc" in copc_status_raw.lower():
                status_val = copc_status_raw
            elif isinstance(copc_no, str) and "copc" in copc_no.lower():
                status_val = copc_no
            if isinstance(copc_no, str) and re.search(r"\d", copc_no) and "level" not in copc_no.lower():
                cert_no = copc_no.strip()
            out[(cid, norm_name(name))] = {
                "copcStatus": map_copc_status(status_val),
                "copcCertificateNumber": cert_no,
                "remarks": str(remarks).strip() if remarks else None,
            }
    return out


def merge(programs, level_map, copc_map):
    for p in programs:
        key = (p["campusId"], p["_norm"])
        # fuzzy: try exact, else best containment
        lh = level_map.get(key)
        if not lh:
            # conservative fuzzy: same campus + equal after removing major/degree noise
            def soft(n: str) -> str:
                n = re.sub(r"\b(bachelor|master|doctor|of|in|the|and|major)\b", " ", n)
                return re.sub(r"\s+", " ", n).strip()

            soft_p = soft(p["_norm"])
            candidates = [
                data
                for (cid, n), data in level_map.items()
                if cid == p["campusId"] and soft(n) == soft_p and soft_p
            ]
            if len(candidates) == 1:
                lh = candidates[0]
        if lh and lh["history"]:
            hist = []
            for h in lh["history"]:
                entry = {
                    "id": f"lh-{p['id']}-{h['year']}",
                    "year": h["year"],
                    "level": h["level"],
                    "result": h["result"],
                    "remarks": h["remarks"],
                    "recordedAt": h["recordedAt"],
                    "recordedBy": h["recordedBy"],
                }
                # attach validity on latest year entry
                if h["year"] == lh["history"][-1]["year"]:
                    if lh["validityStart"]:
                        entry["validityStart"] = lh["validityStart"]
                    if lh["validityEnd"]:
                        entry["validityEnd"] = lh["validityEnd"]
                hist.append(entry)
            p["levelHistory"] = hist
            # fill missing validity from level sheet
            if not p.get("validityStart") and lh["validityStart"]:
                p["validityStart"] = lh["validityStart"]
            if not p.get("validityEnd") and lh["validityEnd"]:
                p["validityEnd"] = lh["validityEnd"]

        copc = copc_map.get(key)
        if not copc:
            def soft(n: str) -> str:
                n = re.sub(r"\b(bachelor|master|doctor|of|in|the|and|major)\b", " ", n)
                return re.sub(r"\s+", " ", n).strip()

            soft_p = soft(p["_norm"])
            candidates = [
                data
                for (cid, n), data in copc_map.items()
                if cid == p["campusId"] and soft(n) == soft_p and soft_p
            ]
            if len(candidates) == 1:
                copc = candidates[0]
        if copc:
            p["copcStatus"] = copc["copcStatus"]
            if copc.get("copcCertificateNumber"):
                p["copcCertificateNumber"] = copc["copcCertificateNumber"]
            if copc.get("remarks") and not p.get("remarks"):
                p["remarks"] = copc["remarks"]
        elif p.get("_copc_link"):
            # presence of COPC drive link implies compliant docs on file
            p["copcStatus"] = "Compliant"

        # cleanup internals
        p.pop("_norm", None)
        p.pop("_copc_link", None)
    return programs


def ts_string(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def emit_ts(programs: list[dict], version: str) -> str:
    lines = [
        "import { ProgramAccreditation } from '../types/accreditation';",
        "",
        "/**",
        ' * Generated from "D1 - ACCREVIA (AACCUP PROGRAM ACCREDITATION STATUS).xlsx":',
        " * current status from the 2026 sheet, level history from the Level Status sheet (2022–2026),",
        " * COPC status from the COPC Status sheet. Bump the version whenever this data is regenerated",
        " * so browsers replace their stored copy.",
        " */",
        f"export const PROGRAM_ACCREDITATION_DATA_VERSION = '{version}';",
        f"export const COPC_DATA_VERSION = '{version}-copc';",
        "",
        "export const programAccreditationRecords: Omit<ProgramAccreditation, 'requirements'>[] = [",
    ]

    optional = [
        "certificationFile",
        "instrumentLink",
        "findingsLink",
        "technicalReviewLink",
        "copcCertificateNumber",
        "borRes",
        "cmoNo",
        "levelStatusForAccreditation",
        "scheduleForAccreditation",
        "remarks",
        "boardAction",
        "findingsSummary",
        "recommendations",
    ]

    for p in programs:
        lines.append("  {")
        for key in [
            "id",
            "campusId",
            "campusName",
            "programName",
            "degreeLevel",
            "yearOfInitialOperation",
            "status",
            "validityStart",
            "validityEnd",
        ]:
            lines.append(f"    {key}: {ts_string(str(p.get(key, '')))},")
        for key in optional:
            if p.get(key):
                lines.append(f"    {key}: {ts_string(str(p[key]))},")
        lines.append(f"    copcStatus: {ts_string(p.get('copcStatus', 'Pending'))},")
        hist = p.get("levelHistory") or []
        if hist:
            lines.append("    levelHistory: [")
            for h in hist:
                lines.append("      {")
                for hk in ["id", "year", "level", "result", "validityStart", "validityEnd", "boardAction", "remarks", "recordedAt", "recordedBy"]:
                    if hk not in h or h[hk] is None or h[hk] == "":
                        continue
                    val = h[hk]
                    if isinstance(val, (int, float)) and hk == "year":
                        lines.append(f"        {hk}: {int(val)},")
                    else:
                        lines.append(f"        {hk}: {ts_string(str(val))},")
                lines.append("      },")
            lines.append("    ]")
        lines.append("  },")
    lines.append("];")
    lines.append("")
    return "\n".join(lines)


def main():
    xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(
        r"c:\Users\My Pc\Downloads\D1 - ACCREVIA (AACCUP PROGRAM ACCREDITATION STATUS) (1).xlsx"
    )
    if not xlsx.exists():
        raise SystemExit(f"Workbook not found: {xlsx}")

    wb = openpyxl.load_workbook(xlsx, data_only=True)
    programs = parse_2026(wb["2026"])
    level_map = parse_level_status(wb["Level Status"])
    copc_map = parse_copc(wb["COPC Status"])
    programs = merge(programs, level_map, copc_map)

    version = datetime.now().strftime("2026-workbook-%Y%m%d")
    text = emit_ts(programs, version)
    OUT.write_text(text, encoding="utf-8")
    print(f"Wrote {OUT} with {len(programs)} programs, version={version}")
    by_campus = {}
    for p in programs:
        by_campus[p["campusId"]] = by_campus.get(p["campusId"], 0) + 1
    print("By campus:", by_campus)


if __name__ == "__main__":
    main()
