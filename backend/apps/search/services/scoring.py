"""Accreditation-aware scoring (intent boosts)."""
from __future__ import annotations

import re
from dataclasses import dataclass


FRAMEWORK_CUES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\biso\b", re.I), "iso"),
    (re.compile(r"\bcopc\b|certificate of program compliance", re.I), "copc"),
    (re.compile(r"\bpqa\b|quality award", re.I), "pqa"),
    (re.compile(r"institutional accreditation", re.I), "ia"),
    (re.compile(r"\baaccup\b|program accreditation", re.I), "pa"),
]

QUERY_FILLER = {
    "a", "an", "and", "are", "at", "be", "by", "can", "do", "does", "for", "from", "has", "how",
    "i", "in", "is", "it", "me", "of", "on", "or", "our", "that", "the", "this", "to", "was", "were",
    "what", "where", "which", "who", "with", "would", "your", "document", "documents", "find", "looking",
    "need", "show", "want", "accreditation", "evidence", "program",
}
TERM_ALIASES = {
    "certificates": "certificate",
    "certification": "certificate",
    "certifications": "certificate",
    "certified": "certificate",
    "certifies": "certificate",
    "certify": "certificate",
    "procedures": "procedure",
    "sop": "procedure",
}


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


def normalized_phrase(text: str) -> str:
    return " ".join(re.findall(r"[^\W_]+", text.casefold()))


def topic_terms(text: str) -> set[str]:
    words = re.findall(r"[^\W\d_]+|\d+", text.casefold())
    return {TERM_ALIASES.get(word, word) for word in words if word not in QUERY_FILLER}


def metadata_priority(payload: dict, phrase: str) -> int:
    title = normalized_phrase(payload.get("title") or "")
    if phrase and title == phrase:
        return 4
    program = normalized_phrase(payload.get("program") or "")
    if " " in phrase and (phrase == program or f" {phrase} " in f" {title} "):
        return 3
    return 0


def evidence_priority(payload: dict, phrase: str, literal_query: str) -> int:
    priority = metadata_priority(payload, phrase)
    if priority or len(phrase.split()) < 3:
        return priority
    passage = payload.get("text") or ""
    if re.search(rf"(?<!\w){re.escape(literal_query)}(?!\w)", passage):
        return 2
    return int(f" {phrase} " in f" {normalized_phrase(passage)} ")


def accreditation_boost(payload: dict, intent: QueryIntent, base_score: float) -> float:
    score = float(base_score)
    fw = (payload.get("framework_id") or "").lower()
    if intent.framework_id and fw == intent.framework_id:
        score *= 1.35
    if intent.criterion_number:
        crit = str(payload.get("criterion_id") or "")
        if re.search(rf"(?:^|[-_.]){re.escape(intent.criterion_number)}$", crit):
            score += 0.15
    if intent.indicator_code:
        ind = str(payload.get("indicator_id") or "")
        if re.search(rf"(?<!\d){re.escape(intent.indicator_code)}(?!\d)", ind):
            score += 0.2
    if intent.year:
        if intent.year in str(payload.get("academic_year") or "") or intent.year in str(payload.get("cycle") or ""):
            score += 0.08
    return score
