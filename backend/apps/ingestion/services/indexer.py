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
            client.update_collection(name, sparse_vectors_config={"bm25": qm.SparseVectorParams(index=qm.SparseIndexParams(on_disk=False), modifier=qm.Modifier.IDF)})
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
        "confidentiality": doc.confidentiality,
        "approval_status": doc.approval_status,
        "uploaded_by": doc.uploaded_by,
    }


def index_chunks(doc, chunks: list[str], *, dense_vectors=None, sparse_vectors=None) -> int:
    if not chunks:
        return 0
    ensure_collection()
    client = get_qdrant()
    dense_vecs = dense_vectors if dense_vectors is not None else embed_dense(chunks)
    sparse_vecs = sparse_vectors if sparse_vectors is not None else embed_sparse(chunks)

    points: list[qm.PointStruct] = []
    for i, text in enumerate(chunks):
        chunk_id = f"{doc.id}:{i}"
        indices, values = sparse_vecs[i]
        points.append(
            qm.PointStruct(
                id=str(uuid.uuid5(uuid.NAMESPACE_URL, chunk_id)),
                vector={
                    "dense": dense_vecs[i],
                    "bm25": qm.SparseVector(indices=indices, values=values),
                },
                payload=document_payload(doc, chunk_id, text, i),
            )
        )

    try:
        client.delete(
            collection_name=settings.QDRANT_COLLECTION,
            points_selector=qm.FilterSelector(
                filter=qm.Filter(
                    must=[qm.FieldCondition(key="document_id", match=qm.MatchValue(value=str(doc.id)))]
                )
            ),
        )
    except Exception as exc:  # noqa: BLE001
        logger.debug("No prior points to delete for %s (%s)", doc.id, exc)

    client.upsert(collection_name=settings.QDRANT_COLLECTION, points=points)
    return len(points)
