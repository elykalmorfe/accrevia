"""Index saved originals from a portable workspace without running a worker."""
import hashlib
import json
from collections import Counter
from pathlib import Path
from urllib.parse import unquote

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.auth.models import PortalFile, PortalRecord
from apps.auth.workspace_storage import workspace_database, workspace_source
from apps.documents.models import EvidenceDocument, utcnow
from apps.ingestion.services.chunking import chunk_text
from apps.ingestion.services.embedders import dense_backend_info, embed_dense, embed_sparse
from apps.ingestion.services.indexer import ensure_collection, get_qdrant, index_chunks
from qdrant_client.http import models as qm
from apps.ingestion.services.ocr import extract_text


class Command(BaseCommand):
    help = "Build the application's hybrid search index from saved workspace documents and originals."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int)
        parser.add_argument("--force", action="store_true")
        parser.add_argument("--framework")
        parser.add_argument("--document-id", action="append", help="Index only the selected document ID; may be repeated.")
        parser.add_argument("--apply", action="store_true", help="Apply indexing changes. Without this flag, run as a dry-run.")

    def handle(self, *args, **options):
        if not options["apply"]:
            self.stdout.write("DRY-RUN: no EvidenceDocument, media, or Qdrant changes will be made.")
        database = workspace_database()
        source = workspace_source()
        if not source:
            raise CommandError("Import a portable workspace before indexing.")
        if not options["apply"]:
            files = {(file.source, file.key): file for file in PortalFile.objects.using(database).select_related("content")}
            rows = PortalRecord.objects.using(database).filter(collection_id=source + "/documents").order_by("position")
            eligible = 0
            missing_original = []
            for row in rows:
                data = row.data or {}
                if options["document_id"] and data.get("id") not in options["document_id"]:
                    continue
                if options["framework"] and data.get("frameworkId") != options["framework"]:
                    continue
                identity = str(data.get("id") or "")
                url = data.get("documentUrl") or ""
                original = files.get(("catalog", unquote(url).lstrip("/"))) if url.startswith("/certificates/") else None
                original = files.get(("repository-stage", data.get("fileRef"))) or original or files.get((source, identity))
                if not original:
                    missing_original.append(identity)
                    continue
                eligible += 1
            self.stdout.write(json.dumps({"dry_run": True, "eligible_with_original": eligible, "missing_original": missing_original}))
            return
        ensure_collection()
        backend = dense_backend_info()["name"]
        # SQL snapshots may contain Indexed flags without the separate Qdrant data.
        # Only resume past a document when its actual vector points are present.
        indexed_counts = Counter()
        offset = None
        while True:
            points, offset = get_qdrant().scroll(settings.QDRANT_COLLECTION, limit=256, offset=offset, with_payload=["document_id"], with_vectors=False)
            indexed_counts.update(str(point.payload["document_id"]) for point in points if point.payload and point.payload.get("document_id"))
            if offset is None:
                break
        files = {(file.source, file.key): file for file in PortalFile.objects.using(database).select_related("content")}
        from apps.auth.models import RepositoryEntry
        from types import SimpleNamespace
        if RepositoryEntry.objects.exists():
            rows = [SimpleNamespace(data=row.data) for row in RepositoryEntry.objects.filter(kind='document', deleted=False).order_by('pk')]
        else:
            rows = PortalRecord.objects.using(database).filter(collection_id=source + "/documents").order_by("position")
        folder = Path(settings.MEDIA_ROOT) / "uploads" / "portal"
        folder.mkdir(parents=True, exist_ok=True)
        cache = {}
        stats = {"full_text": 0, "metadata_only": 0, "unchanged": 0, "failed": 0}
        for position, row in enumerate(rows):
            data = row.data
            if options["document_id"] and data.get("id") not in options["document_id"]:
                continue
            if options["framework"] and data.get("frameworkId") != options["framework"]:
                continue
            if options["limit"] and sum(stats.values()) >= options["limit"]:
                break
            original_url = data.get("documentUrl") or ""
            original = files.get(("catalog", unquote(original_url).lstrip("/"))) if original_url.startswith("/certificates/") else None
            original = files.get(('repository-stage', data.get('fileRef'))) or original or files.get((source, str(data["id"])))
            if not original:
                stats["failed"] += 1
                self.stderr.write(f"Skipped {data.get('id')}: no exact original file is available.")
                continue
            content_id = original.content_id
            fingerprint = hashlib.sha256(json.dumps([data, content_id, backend], sort_keys=True).encode()).hexdigest()
            existing = EvidenceDocument.objects.filter(pk=data["id"]).first()
            if (existing and not options["force"] and existing.status == "Indexed"
                    and existing.progress.get("index_fingerprint") == fingerprint
                    and existing.chunk_count > 0 and indexed_counts[existing.pk] == existing.chunk_count):
                if existing.iso_stage != (data.get("isoStage") or ""):
                    existing.iso_stage = data.get("isoStage") or ""
                    existing.save(update_fields=["iso_stage"])
                if original and existing.storage_path:
                    self.materialize(original, Path(settings.MEDIA_ROOT) / existing.storage_path, database)
                if content_id not in cache and existing.progress.get("indexed_source") == "original":
                    points, offset = [], None
                    while True:
                        batch, offset = get_qdrant().scroll(
                            settings.QDRANT_COLLECTION,
                            scroll_filter=qm.Filter(must=[qm.FieldCondition(key="document_id", match=qm.MatchValue(value=existing.pk))]),
                            limit=256, offset=offset, with_vectors=True, with_payload=True,
                        )
                        points.extend(batch)
                        if offset is None:
                            break
                    points.sort(key=lambda point: point.payload.get("sequence", 0))
                    if len(points) == existing.chunk_count:
                        cache[content_id] = (
                            [point.payload["text"] for point in points],
                            [point.vector["dense"] for point in points],
                            [(point.vector["bm25"].indices, point.vector["bm25"].values) for point in points],
                            existing.ocr_applied == "true", Path(settings.MEDIA_ROOT) / existing.storage_path,
                        )
                stats["unchanged"] += 1
                continue
            original_path = None
            text = ""
            ocr = False
            extraction_error = None
            try:
                cache_key = content_id
                if cache_key in cache:
                    chunks, dense, sparse, ocr, original_path = cache[cache_key]
                else:
                    if original:
                        suffix = Path(original.name).suffix.lower()
                        original_path = folder / (original.content_id + suffix)
                        self.materialize(original, original_path, database)
                        target = original_path
                        if suffix in {".pub", ".doc"}:
                            preview = files.get(("preview", original.content_id))
                            if preview:
                                target = folder / (preview.content_id + ".pdf")
                                self.materialize(preview, target, database)
                        try:
                            text, ocr = extract_text(target)
                        except Exception as exc:
                            extraction_error = str(exc)[:300]
                    if text.strip():
                        chunks = chunk_text(text)
                        dense, sparse = embed_dense(chunks), embed_sparse(chunks)
                        cache[cache_key] = (chunks, dense, sparse, ocr, original_path)
                    else:
                        chunks = chunk_text("\n".join(str(data.get(key) or "") for key in ("title", "description", "program", "campus", "docType", "academicYear")))
                        dense, sparse = embed_dense(chunks), embed_sparse(chunks)
                field_map = {
                    "framework_id": "frameworkId", "area_id": "areaId", "criterion_id": "criterionId", "indicator_id": "indicatorId",
                    "requirement_id": "requirementId", "folder_id": "folderId", "doc_type": "docType", "academic_year": "academicYear",
                    "campus_id": "campusId", "iso_stage": "isoStage", "document_date": "documentDate", "uploaded_by": "uploadedBy", "approval_status": "approvalStatus",
                }
                defaults = {field: data.get(key) or "" for field, key in field_map.items()}
                defaults.update({field: data.get(field) or "" for field in ("title", "description", "cycle", "program", "college", "department", "office", "campus", "confidentiality")})
                defaults.update({"keywords": data.get("keywords") or [], "file_type": data.get("fileType") or "PDF",
                                 "original_file_name": original.name if original else "", "size_bytes": original.content.size_bytes if original else 0,
                                 "mime_type": original.mime_type if original else "", "storage_path": str(original_path.relative_to(settings.MEDIA_ROOT)).replace("\\", "/") if original_path else "",
                                 "status": "Processing"})
                document, _ = EvidenceDocument.objects.update_or_create(pk=data["id"], defaults=defaults)
                count = index_chunks(document, chunks, dense_vectors=dense, sparse_vectors=sparse)
                # Cached full-text chunks also indicate an original extraction, even when not repeated.
                full_text = content_id in cache
                document.status = "Indexed"
                document.indexed_at = utcnow()
                document.passages = chunks[:8]
                document.chunk_count = count
                document.ocr_applied = "true" if ocr else "false"
                document.progress = {"stage": "done", "percent": 100, "index_fingerprint": fingerprint,
                                     "indexed_source": "original" if full_text else "metadata", "original_url": original_url, "embedding_backend": backend}
                if extraction_error:
                    document.progress["extraction_error"] = extraction_error
                document.save()
                stats["full_text" if full_text else "metadata_only"] += 1
                self.stdout.write(f"{position + 1}: {document.id}: {count} chunks ({'original' if full_text else 'metadata only'})")
                self.stdout.flush()
            except Exception as exc:
                stats["failed"] += 1
                self.stderr.write(f"Failed {data.get('id')}: {exc}")
        self.stdout.write(json.dumps(stats))
        if stats["failed"]:
            raise CommandError("Some records could not be indexed; rerun after resolving the reported errors.")

    @staticmethod
    def materialize(file, destination, database):
        if destination.is_file() and destination.stat().st_size == file.content.size_bytes:
            return
        digest = hashlib.sha256()
        with destination.open("wb") as output:
            for data in file.content.chunks.using(database).order_by("position").values_list("data", flat=True).iterator(chunk_size=4):
                output.write(bytes(data))
                digest.update(data)
        if digest.hexdigest() != file.content_id:
            destination.unlink()
            raise ValueError("Original checksum mismatch.")
