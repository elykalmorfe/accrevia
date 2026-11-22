"""Evidence document model (Django ORM / MySQL)."""
from __future__ import annotations

from datetime import datetime, timezone

from django.db import models


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EvidenceDocument(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    title = models.CharField(max_length=512)
    description = models.TextField(blank=True, default="")
    keywords = models.JSONField(default=list, blank=True)

    framework_id = models.CharField(max_length=64, default="ia", db_index=True)
    area_id = models.CharField(max_length=128, blank=True, default="")
    criterion_id = models.CharField(max_length=128, blank=True, default="")
    indicator_id = models.CharField(max_length=128, blank=True, default="")
    requirement_id = models.CharField(max_length=128, blank=True, default="")
    folder_id = models.CharField(max_length=128, blank=True, default="")

    doc_type = models.CharField(max_length=64, default="Other")
    common_doc_type = models.CharField(max_length=128, blank=True, default="")
    iso_stage = models.CharField(max_length=64, blank=True, default="")
    academic_year = models.CharField(max_length=64, blank=True, default="")
    cycle = models.CharField(max_length=128, blank=True, default="")
    program = models.CharField(max_length=512, blank=True, default="")
    college = models.CharField(max_length=256, blank=True, default="")
    department = models.CharField(max_length=256, blank=True, default="")
    office = models.CharField(max_length=256, blank=True, default="")
    campus = models.CharField(max_length=256, blank=True, default="")
    campus_id = models.CharField(max_length=64, blank=True, default="", db_index=True)
    document_date = models.CharField(max_length=64, blank=True, default="")
    confidentiality = models.CharField(max_length=64, default="Internal")

    original_file_name = models.CharField(max_length=512, blank=True, default="")
    mime_type = models.CharField(max_length=128, blank=True, default="")
    file_type = models.CharField(max_length=32, default="PDF")
    size_bytes = models.BigIntegerField(default=0)
    storage_path = models.CharField(max_length=1024)
    pages = models.IntegerField(default=0)

    status = models.CharField(max_length=32, default="Processing", db_index=True)
    approval_status = models.CharField(max_length=64, default="Pending Review")
    uploaded_by = models.CharField(max_length=128, default="system", db_index=True)
    passages = models.JSONField(default=list, blank=True)

    ocr_applied = models.CharField(max_length=8, default="false")
    indexed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")
    progress = models.JSONField(default=dict, blank=True)
    chunk_count = models.IntegerField(default=0)

    date_added = models.DateTimeField(default=utcnow)
    updated_at = models.DateTimeField(default=utcnow)

    class Meta:
        db_table = "evidence_documents"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["framework_id"]),
            models.Index(fields=["campus_id"]),
            models.Index(fields=["uploaded_by"]),
        ]

    def mark_updated(self) -> None:
        self.updated_at = utcnow()

    def to_api_dict(self) -> dict:
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "keywords": self.keywords or [],
            "frameworkId": self.framework_id,
            "areaId": self.area_id,
            "criterionId": self.criterion_id,
            "indicatorId": self.indicator_id,
            "requirementId": self.requirement_id or None,
            "folderId": self.folder_id or None,
            "docType": self.doc_type,
            "commonDocType": self.common_doc_type or None,
            "isoStage": self.iso_stage or None,
            "academicYear": self.academic_year,
            "cycle": self.cycle,
            "program": self.program,
            "college": self.college,
            "department": self.department,
            "office": self.office,
            "campus": self.campus,
            "campusId": self.campus_id or None,
            "documentDate": self.document_date,
            "confidentiality": self.confidentiality,
            "originalFileName": self.original_file_name,
            "mimeType": self.mime_type,
            "fileType": self.file_type,
            "sizeBytes": self.size_bytes,
            "pages": self.pages,
            "status": self.status,
            "approvalStatus": self.approval_status,
            "uploadedBy": self.uploaded_by,
            "passages": self.passages or [],
            "ocrApplied": self.ocr_applied == "true",
            "indexedAt": self.indexed_at.isoformat() if self.indexed_at else None,
            "errorMessage": self.error_message or None,
            "progress": self.progress or {},
            "chunkCount": self.chunk_count,
            "dateAdded": self.date_added.isoformat() if self.date_added else None,
        }

    def __str__(self) -> str:
        return f"{self.id}:{self.title}"
