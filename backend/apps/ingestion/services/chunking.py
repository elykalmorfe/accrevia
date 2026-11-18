"""Document chunking service."""
from __future__ import annotations

from django.conf import settings


def chunk_text(text: str, chunk_size: int | None = None, overlap: int | None = None) -> list[str]:
    size = chunk_size or settings.CHUNK_SIZE
    ov = overlap if overlap is not None else settings.CHUNK_OVERLAP
    cleaned = " ".join((text or "").split())
    if not cleaned:
        return []
    if len(cleaned) <= size:
        return [cleaned]

    chunks: list[str] = []
    start = 0
    n = len(cleaned)
    while start < n:
        end = min(start + size, n)
        # Prefer breaking on sentence/space near the end
        if end < n:
            window = cleaned[start:end]
            br = max(window.rfind(". "), window.rfind(" "))
            if br > size * 0.4:
                end = start + br + 1
        piece = cleaned[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= n:
            break
        start = max(end - ov, start + 1)
    return chunks