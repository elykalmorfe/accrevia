"""Backfill the selected portable workspace into the hybrid search index."""
import hashlib
import json
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import unquote

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connections
from django.db.models import BinaryField
from django.db.models.functions import Substr

from apps.auth.models import PortalFile, PortalFileChunk
from apps.auth.workspace_storage import workspace_database, workspace_records, workspace_source
from apps.documents.models import EvidenceDocument
from apps.ingestion.services.chunking import chunk_text
from apps.ingestion.services.embedders import dense_backend_info, dense_vector_size
from apps.ingestion.services.indexer import chunk_point_id, embed_chunks, ensure_collection, get_qdrant, index_chunks
from apps.ingestion.services.ocr import extract_text


def valid_original(file, header):
    suffix = Path(file.name).suffix.lower()
    if suffix == ".pdf":
        return b"%PDF-" in header
    if suffix in {".docx", ".xlsx", ".pptx"}:
        return header.startswith(b"PK\x03\x04")
    if suffix in {".jpg", ".jpeg"}:
        return header.startswith(b"\xff\xd8\xff")
    if suffix == ".png":
        return header.startswith(b"\x89PNG\r\n\x1a\n")
    if suffix in {".doc", ".pub"}:
        return header.startswith(bytes.fromhex("d0cf11e0a1b11ae1"))
    if suffix in {".tif", ".tiff"}:
        return header.startswith((b"II*\0", b"MM\0*"))
    if suffix in {".txt", ".csv", ".md", ".log"}:
        return bool(header) and b"\0" not in header and not header.lstrip().lower().startswith((b"<html", b"<!doctype html"))
    return False


def evidence_record(data, original):
    return EvidenceDocument(
        id=data["id"], title=data.get("title") or original.name, description=data.get("description") or "",
        framework_id=data.get("frameworkId") or "ia", area_id=data.get("areaId") or "",
        criterion_id=data.get("criterionId") or "", indicator_id=data.get("indicatorId") or "",
        folder_id=data.get("folderId") or "", doc_type=data.get("docType") or "Other",
        file_type=data.get("fileType") or Path(original.name).suffix[1:].upper(),
        academic_year=data.get("academicYear") or "", cycle=data.get("cycle") or "", program=data.get("program") or "",
        college=data.get("college") or "", department=data.get("department") or "", office=data.get("office") or "",
        campus=data.get("campus") or "", campus_id=data.get("campusId") or "",
        confidentiality=data.get("confidentiality") or "Internal", approval_status=data.get("approvalStatus") or "Pending Review",
        uploaded_by=data.get("uploadedBy") or "system",
    )


def extract_chunks(file):
    database = file._state.db
    try:
        with TemporaryDirectory(prefix="accrevia-index-") as folder:
            path = Path(folder) / ("original" + Path(file.name).suffix.lower())
            with path.open("wb") as stream:
                for chunk in file.content.chunks.order_by("position").values_list("data", flat=True).iterator(chunk_size=4):
                    stream.write(chunk)
            text, ocr = extract_text(path)
            return chunk_text(text), ocr, None
    except Exception as exc:
        return [], False, str(exc)
    finally:
        connections[database].close()


class Command(BaseCommand):
    help = "Extract and index original files from the selected workspace. A repeated run skips completed documents."

    def add_arguments(self, parser):
        parser.add_argument("--document-id", action="append", help="Index only the selected workspace document ID (repeatable).")
        parser.add_argument("--workers", type=int, default=4, help="Parallel file extraction workers.")

    def handle(self, *args, **options):
        database = workspace_database()
        source = workspace_source()
        if not source:
            raise CommandError("No portable workspace is configured.")
        documents = {doc["id"]: doc for doc in workspace_records().get("documents", [])}
        selected = options["document_id"]
        if selected:
            if missing := set(selected) - documents.keys():
                raise CommandError(f"Unknown workspace document ID: {', '.join(sorted(missing))}")
            documents = {key: documents[key] for key in selected}

        files = list(PortalFile.objects.using(database).filter(source__in=[source, "catalog", "preview"]).select_related("content"))
        originals = {(file.source, file.key): file for file in files}
        prefixes = dict(PortalFileChunk.objects.using(database).filter(
            content_id__in={file.content_id for file in files}, position=0,
        ).values_list("content_id", Substr("data", 1, 1024, output_field=BinaryField())))

        ensure_collection()
        client = get_qdrant()
        collection = settings.QDRANT_COLLECTION
        markers = {}
        ids = [chunk_point_id(key, 0) for key in documents]
        for start in range(0, len(ids), 200):
            for point in client.retrieve(collection, ids[start:start + 200], with_payload=True):
                markers[str(point.id)] = point.payload or {}

        stats = Counter()
        groups = defaultdict(list)
        for key, doc in documents.items():
            if doc.get("status") == "Archived":
                stats["archived"] += 1
                continue
            current = markers.get(chunk_point_id(key, 0))
            if current and not current.get("workspace_indexed"):
                stats["already indexed as upload"] += 1
                continue
            url = doc.get("documentUrl") or ""
            path = unquote(url.split("?", 1)[0].split("#", 1)[0]).lstrip("/") if url.startswith("/certificates/") else ""
            candidates = [originals.get((source, key)), originals.get(("catalog", path))]
            original = next((file for file in candidates if file and valid_original(file, prefixes.get(file.content_id, b""))), None)
            if original is None:
                stats["no valid original"] += 1
                continue
            extract_file = original
            if Path(original.name).suffix.lower() in {".doc", ".pub"}:
                extract_file = originals.get(("preview", original.content_id))
                if not extract_file or not valid_original(extract_file, prefixes.get(extract_file.content_id, b"")):
                    stats["legacy file without PDF preview"] += 1
                    continue
            record = evidence_record(doc, original)
            signature = hashlib.sha256(json.dumps([
                source, extract_file.content_id, record.to_api_dict() | {"dateAdded": None},
                settings.CHUNK_SIZE, settings.CHUNK_OVERLAP,
            ], sort_keys=True).encode()).hexdigest()
            if current and current.get("workspace_signature") == signature:
                stats["already indexed"] += 1
                continue
            groups[extract_file.content_id, Path(extract_file.name).suffix.lower()].append((extract_file, record, signature))

        self.stdout.write(f"{len(documents)} records. {sum(map(len, groups.values()))} to index from {len(groups)} unique files. {dict(stats)}")
        if not groups:
            return
        if dense_backend_info()["degraded"]:
            raise CommandError("BGE-M3 did not load. Retry once it is available for the existing search collection.")
        vectors_config = client.get_collection(collection).config.params.vectors
        if vectors_config["dense"].size != dense_vector_size():
            raise CommandError("The active BGE-M3 vector size does not match the existing collection.")

        batches = sorted(groups.values(), key=lambda group: group[0][0].content.size_bytes)
        with ThreadPoolExecutor(max_workers=options["workers"]) as executor:
            extracted = executor.map(extract_chunks, (batch[0][0] for batch in batches))
            for position, (batch, (chunks, ocr, error)) in enumerate(zip(batches, extracted, strict=True), 1):
                if not chunks:
                    stats["extraction failed" if error else "no extractable text"] += len(batch)
                    if error:
                        self.stderr.write(f"Could not extract {batch[0][1].id}: {error}")
                    continue
                vectors = embed_chunks(chunks)
                for _, record, signature in batch:
                    index_chunks(record, chunks, vectors=vectors, metadata={
                        "workspace_indexed": True, "workspace_source": source,
                        "workspace_signature": signature, "ocr_applied": ocr,
                    })
                    stats["indexed"] += 1
                if position % 10 == 0 or position == len(batches):
                    self.stdout.write(f"Files processed {position}/{len(batches)}. {dict(stats)}")
        self.stdout.write(self.style.SUCCESS(f"Workspace indexing complete. {dict(stats)}"))
