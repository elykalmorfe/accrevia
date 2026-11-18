"""Accreditation-aware scoring (intent boosts)."""
from __future__ import annotations

import re
from dataclasses import dataclass


FRAMEWORK_CUES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\biso\b", re.I), "iso"),
    (re.compile(r"\bcopc\b|certificate of program compliance", re.I), "copc"),
    (re.compile(r"\bpqa\b|quality award", re.I), "pqa"),
    (re.compile(r"program accreditation", re.I), "pa"),
    (re.compile(r"institutional accreditation", re.I), "ia"),
]


@dataclass
class QueryIntent:
    framework_id: str | None = None
    criterion_number: str | None = None
    indicator_code: str | None = None
    year: str | None = None


def parse_intent(query: str) -> QueryIntent:
    intent = QueryIntent()
    for pattern, fw in FRAMEWORK_CUES:
        if pattern.search(query or ""):
            intent.framework_id = fw
            break
    crit = re.search(r"criterion\s*(\d+)(?:\.(\d+))?", query or "", re.I)
    if crit:
        intent.criterion_number = crit.group(1)
        if crit.group(2):
            intent.indicator_code = f"{crit.group(1)}.{crit.group(2)}"
    else:
        ind = re.search(r"\b(\d{1,2}\.\d{1,2})\b", query or "")
        if ind:
            intent.indicator_code = ind.group(1)
            intent.criterion_number = ind.group(1).split(".")[0]
    year = re.search(r"\b(20\d{2})\b", query or "")
    if year:
        intent.year = year.group(1)
    return intent


def accreditation_boost(payload: dict, intent: QueryIntent, base_score: float) -> float:
    score = float(base_score)
    fw = (payload.get("framework_id") or "").lower()
    if intent.framework_id and fw == intent.framework_id:
        score *= 1.35
    if intent.criterion_number:
        crit = str(payload.get("criterion_id") or "")
        if intent.criterion_number in crit or crit.endswith(intent.criterion_number):
            score += 0.15
    if intent.indicator_code:
        ind = str(payload.get("indicator_id") or "")
        if intent.indicator_code in ind:
            score += 0.2
    if intent.year:
        if intent.year in str(payload.get("academic_year") or "") or intent.year in str(payload.get("cycle") or ""):
            score += 0.08
    return score