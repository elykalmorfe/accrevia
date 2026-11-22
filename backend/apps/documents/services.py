"""Document controller logic (MVC Service)."""
from __future__ import annotations

import mimetypes
import uuid
from pathlib import Path

from django.conf import settings
from django.db import transaction

from apps.auth.portal_storage import store_file
from apps.documents.models import EvidenceDocument


def _guess_file_type(name: str, mime: str) -> str:
    lower = name.lower()
    if lower.endswith(".pdf") or "pdf" in mime:
        return "PDF"
    if lower.endswith((".jpg", ".jpeg")):
        return "JPG"
    if lower.endswith(".png"):
        return "PNG"
    if lower.endswith((".tif", ".tiff")):
        return "TIFF"
    if lower.endswith(".docx"):
        return "DOCX"
    if lower.endswith(".xlsx"):
        return "XLSX"
    if lower.endswith(".pptx"):
        return "PPTX"
    return "PDF"


def create_document_from_upload(uploaded_file, meta: dict) -> EvidenceDocument:
    media_root = Path(settings.MEDIA_ROOT)
    media_root.mkdir(parents=True, exist_ok=True)

    ext = Path(uploaded_file.name).suffix or ".bin"
    doc_id = uuid.uuid4().hex
    relative = Path("uploads") / f"{doc_id}{ext}"
    absolute = media_root / relative
    absolute.parent.mkdir(parents=True, exist_ok=True)

    with absolute.open("wb") as out:
        for chunk in uploaded_file.chunks():
            out.write(chunk)

    mime = uploaded_file.content_type or mimetypes.guess_type(uploaded_file.name)[0] or "application/octet-stream"
    title = (meta.get("title") or "").strip() or Path(uploaded_file.name).stem
    keywords_raw = meta.get("keywords") or ""
    keywords = [k.strip() for k in keywords_raw.split(",") if k.strip()] if isinstance(keywords_raw, str) else list(keywords_raw)

    doc = EvidenceDocument(
        id=doc_id,
        title=title,
        description=meta.get("description") or "",
        keywords=keywords,
        framework_id=meta.get("frameworkId") or "ia",
        area_id=meta.get("areaId") or "",
        criterion_id=meta.get("criterionId") or "",
        indicator_id=meta.get("indicatorId") or "",
        folder_id=meta.get("folderId") or "",
        doc_type=meta.get("docType") or "Other",
        academic_year=meta.get("academicYear") or "",
        cycle=meta.get("cycle") or "",
        program=meta.get("program") or "",
        college=meta.get("college") or "",
        department=meta.get("department") or "",
        office=meta.get("office") or "",
        campus=meta.get("campus") or "",
        campus_id=meta.get("campusId") or "",
        confidentiality=meta.get("confidentiality") or "Internal",
        uploaded_by=meta.get("uploadedBy") or "system",
        original_file_name=uploaded_file.name,
        mime_type=mime,
        file_type=_guess_file_type(uploaded_file.name, mime),
        size_bytes=int(getattr(uploaded_file, "size", 0) or 0),
        storage_path=str(relative).replace("\\", "/"),
        status="Processing",
        progress={"stage": "queued", "percent": 0},
    )
    with transaction.atomic(), absolute.open("rb") as source:
        doc.save()
        store_file("upload", doc_id, uploaded_file.name, mime, source)

    from apps.ingestion.tasks import ingest_document

    try:
        ingest_document.delay(str(doc.id))
    except Exception:
        # Redis/Celery unavailable — run ingestion inline for local/dev smoke tests
        ingest_document(str(doc.id))
    return doc


def get_document(doc_id: str) -> EvidenceDocument | None:
    return EvidenceDocument.objects.filter(pk=doc_id).first()


def document_status_payload(doc: EvidenceDocument) -> dict:
    return {
        "id": str(doc.id),
        "status": doc.status,
        "progress": doc.progress or {},
        "chunkCount": doc.chunk_count,
        "ocrApplied": doc.ocr_applied == "true",
        "errorMessage": doc.error_message or None,
        "indexedAt": doc.indexed_at.isoformat() if doc.indexed_at else None,
    }
