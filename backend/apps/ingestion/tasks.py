"""Celery ingestion orchestration."""
from __future__ import annotations

import logging
from pathlib import Path

from celery import shared_task
from django.conf import settings

from apps.documents.models import EvidenceDocument, utcnow
from apps.ingestion.services.chunking import chunk_text
from apps.ingestion.services.indexer import index_chunks
from apps.ingestion.services.ocr import extract_text

logger = logging.getLogger(__name__)


def _set_progress(doc: EvidenceDocument, stage: str, percent: int) -> None:
    doc.progress = {"stage": stage, "percent": percent}
    doc.mark_updated()
    doc.save(update_fields=["progress", "updated_at"])


@shared_task(bind=True, name="ingestion.ingest_document")
def ingest_document(self, doc_id: str) -> dict:
    doc = EvidenceDocument.objects.filter(pk=doc_id).first()
    if not doc:
        return {"ok": False, "error": "not_found"}

    try:
        doc.status = "Processing"
        doc.progress = {"stage": "extracting", "percent": 10}
        doc.mark_updated()
        doc.save(update_fields=["status", "progress", "updated_at"])

        path = Path(settings.MEDIA_ROOT) / doc.storage_path
        text, ocr_applied = extract_text(path)
        doc.ocr_applied = "true" if ocr_applied else "false"
        if not text.strip():
            raise ValueError("No extractable text from document (OCR/PDF empty).")

        _set_progress(doc, "chunking", 40)
        chunks = chunk_text(text)
        if not chunks:
            raise ValueError("Chunking produced no passages.")

        _set_progress(doc, "indexing", 70)
        count = index_chunks(doc, chunks)

        doc.passages = chunks[:8]
        doc.chunk_count = count
        doc.status = "Indexed"
        doc.indexed_at = utcnow()
        doc.error_message = ""
        _set_progress(doc, "done", 100)
        doc.save(
            update_fields=[
                "ocr_applied",
                "passages",
                "chunk_count",
                "status",
                "indexed_at",
                "error_message",
                "progress",
                "updated_at",
            ]
        )
        return {"ok": True, "doc_id": doc_id, "chunks": count, "ocr": ocr_applied}
    except Exception as exc:  # noqa: BLE001
        logger.exception("Ingestion failed for %s", doc_id)
        doc.status = "Failed"
        doc.error_message = str(exc)
        doc.progress = {"stage": "failed", "percent": 100}
        doc.mark_updated()
        doc.save(update_fields=["status", "error_message", "progress", "updated_at"])
        return {"ok": False, "doc_id": doc_id, "error": str(exc)}
