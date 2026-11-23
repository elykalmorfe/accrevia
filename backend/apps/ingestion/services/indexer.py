"""Qdrant hybrid indexer service."""
from __future__ import annotations

import logging
import uuid
from functools import lru_cache

from django.conf import settings
from qdrant_client import QdrantClient
from qdrant_client.http import models as qm

from apps.ingestion.services.embedders import dense_vector_size, embed_dense, embed_sparse

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_qdrant() -> QdrantClient:
    return QdrantClient(url=settings.QDRANT_URL, timeout=60, check_compatibility=False)


def ensure_collection() -> None:
    client = get_qdrant()
    name = settings.QDRANT_COLLECTION
    existing = {c.name for c in client.get_collections().collections}
    if name in existing:
        info = client.get_collection(name)
        sparse = info.config.params.sparse_vectors or {}
        if "bm25" not in sparse or sparse["bm25"].modifier != qm.Modifier.IDF:
            client.update_collection(
                name,
                sparse_vectors_config={"bm25": qm.SparseVectorParams(index=qm.SparseIndexParams(on_disk=False), modifier=qm.Modifier.IDF)},
            )
        _ensure_filter_indexes(client, name, info.payload_schema)
        return

    size = dense_vector_size()
    client.create_collection(
        collection_name=name,
        vectors_config={
            "dense": qm.VectorParams(size=size, distance=qm.Distance.COSINE),
        },
        sparse_vectors_config={
            "bm25": qm.SparseVectorParams(index=qm.SparseIndexParams(on_disk=False), modifier=qm.Modifier.IDF),
        },
    )
    logger.info("Created Qdrant collection %s (dense=%s)", name, size)
    _ensure_filter_indexes(client, name, {})


def _ensure_filter_indexes(client, name, schema):
    for field in ("document_id", "doc_type", "program", "academic_year", "framework_id", "campus_id"):
        if field not in schema:
            client.create_payload_index(name, field, field_schema=qm.PayloadSchemaType.KEYWORD, wait=True)
    if "title" not in schema:
        client.create_payload_index(
            name,
            field_name="title",
            field_schema=qm.TextIndexParams(type=qm.TextIndexType.TEXT, tokenizer=qm.TokenizerType.WORD, lowercase=True),
            wait=True,
        )


def document_payload(doc, chunk_id: str, text: str, sequence: int) -> dict:
    return {
        "document_id": str(doc.id),
        "chunk_id": chunk_id,
        "sequence": sequence,
        "text": text,
        "title": doc.title,
        "framework_id": doc.framework_id,
        "area_id": doc.area_id,
        "criterion_id": doc.criterion_id,
        "indicator_id": doc.indicator_id,
        "folder_id": doc.folder_id,
        "campus_id": doc.campus_id,
        "campus": doc.campus,
        "program": doc.program,
        "college": doc.college,
        "department": doc.department,
        "office": doc.office,
        "academic_year": doc.academic_year,
        "cycle": doc.cycle,
        "doc_type": doc.doc_type,
        "file_type": doc.file_type,
        "confidentiality": doc.confidentiality,
        "approval_status": doc.approval_status,
        "uploaded_by": doc.uploaded_by,
    }


def chunk_point_id(document_id, sequence):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"{document_id}:{sequence}"))


def embed_chunks(chunks: list[str]):
    vectors = []
    for start in range(0, len(chunks), 16):
        batch = chunks[start:start + 16]
        vectors.extend(zip(embed_dense(batch), embed_sparse(batch), strict=True))
    return vectors


def index_chunks(doc, chunks: list[str], *, vectors=None, dense_vectors=None, sparse_vectors=None, metadata=None) -> int:
    if not chunks:
        return 0
    ensure_collection()
    client = get_qdrant()
    if vectors is None:
        if dense_vectors is not None and sparse_vectors is not None:
            vectors = list(zip(dense_vectors, sparse_vectors, strict=True))
        else:
            vectors = embed_chunks(chunks)

    points: list[qm.PointStruct] = []
    for i, (text, (dense, (indices, values))) in enumerate(zip(chunks, vectors, strict=True)):
        chunk_id = f"{doc.id}:{i}"
        points.append(
            qm.PointStruct(
                id=chunk_point_id(doc.id, i),
                vector={
                    "dense": dense,
                    "bm25": qm.SparseVector(indices=indices, values=values),
                },
                payload={**document_payload(doc, chunk_id, text, i), **(metadata or {})},
            )
        )

    for start in range(1, len(points), 100):
        client.upsert(collection_name=settings.QDRANT_COLLECTION, points=points[start:start + 100], wait=True)
    try:
        client.delete(
            collection_name=settings.QDRANT_COLLECTION,
            points_selector=qm.FilterSelector(filter=qm.Filter(must=[
                qm.FieldCondition(key="document_id", match=qm.MatchValue(value=str(doc.id))),
                qm.FieldCondition(key="sequence", range=qm.Range(gte=len(chunks))),
            ])),
            wait=True,
        )
    except Exception as exc:  # noqa: BLE001
        logger.debug("No prior points to delete for %s (%s)", doc.id, exc)

    # The first point also marks a completed workspace indexing run for this file.
    client.upsert(collection_name=settings.QDRANT_COLLECTION, points=points[:1], wait=True)
    return len(points)
