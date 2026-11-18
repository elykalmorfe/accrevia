"""MongoDB document model (MVC Model)."""
from __future__ import annotations

from datetime import datetime, timezone

from mongoengine import DateTimeField, DictField, Document, FloatField, IntField, ListField, StringField


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EvidenceDocument(Document):
    meta = {
        "collection": "evidence_documents",
        "indexes": ["status", "framework_id", "campus_id", "uploaded_by"],
    }

    id = StringField(primary_key=True)
    title = StringField(required=True)
    description = StringField(default="")
    keywords = ListField(StringField(), default=list)

    framework_id = StringField(default="ia")
    area_id = StringField(default="")
    criterion_id = StringField(default="")
    indicator_id = StringField(default="")
    requirement_id = StringField(default="")
    folder_id = StringField(default="")

    doc_type = StringField(default="Other")
    common_doc_type = StringField(default="")
    iso_stage = StringField(default="")
    academic_year = StringField(default="")
    cycle = StringField(default="")
    program = StringField(default="")
    college = StringField(default="")
    department = StringField(default="")
    office = StringField(default="")
    campus = StringField(default="")
    campus_id = StringField(default="")
    document_date = StringField(default="")
    confidentiality = StringField(default="Internal")

    original_file_name = StringField(default="")
    mime_type = StringField(default="")
    file_type = StringField(default="PDF")
    size_bytes = IntField(default=0)
    storage_path = StringField(required=True)
    pages = IntField(default=0)

    status = StringField(default="Processing")  # Processing | Indexed | Failed | Archived
    approval_status = StringField(default="Pending Review")
    uploaded_by = StringField(default="system")
    passages = ListField(StringField(), default=list)

    ocr_applied = StringField(default="false")
    indexed_at = DateTimeField(null=True)
    error_message = StringField(default="")
    progress = DictField(default=dict)
    chunk_count = IntField(default=0)

    date_added = DateTimeField(default=utcnow)
    updated_at = DateTimeField(default=utcnow)

    def mark_updated(self) -> None:
        self.updated_at = utcnow()

    def to_api_dict(self) -> dict:
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "keywords": self.keywords,
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
            "passages": self.passages,
            "ocrApplied": self.ocr_applied == "true",
            "indexedAt": self.indexed_at.isoformat() if self.indexed_at else None,
            "errorMessage": self.error_message or None,
            "progress": self.progress or {},
            "chunkCount": self.chunk_count,
            "dateAdded": self.date_added.isoformat() if self.date_added else None,
        }