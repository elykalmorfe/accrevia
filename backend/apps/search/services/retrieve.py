"""Hybrid BM25 + dense retrieval from Qdrant."""
from __future__ import annotations

import logging

from django.conf import settings
from qdrant_client.http import models as qm

from apps.ingestion.services.embedders import embed_dense, embed_sparse
from apps.ingestion.services.indexer import ensure_collection, get_qdrant
from apps.search.services.scoring import QueryIntent, accreditation_boost, parse_intent

logger = logging.getLogger(__name__)


def _build_filter(filters: dict | None) -> qm.Filter | None:
    if not filters:
        return None
    must: list[qm.FieldCondition] = []
    mapping = {
        "docType": "doc_type",
        "program": "program",
        "academicYear": "academic_year",
    }
    for key, field in mapping.items():
        val = (filters or {}).get(key)
        if val:
            must.append(qm.FieldCondition(key=field, match=qm.MatchValue(value=val)))
    if "documentIds" in filters:
        must.append(qm.FieldCondition(key="document_id", match=qm.MatchAny(any=filters["documentIds"])))
    if not must:
        return None
    return qm.Filter(must=must)


def hybrid_retrieve(query: str, filters: dict | None = None, limit: int | None = None) -> list[dict]:
    ensure_collection()
    client = get_qdrant()
    top_k = limit or settings.RETRIEVE_TOP_K
    intent = parse_intent(query)

    dense = embed_dense([query])[0]
    sparse_idx, sparse_vals = embed_sparse([query])[0]
    query_filter = _build_filter(filters)

    try:
        results = client.query_points(
            collection_name=settings.QDRANT_COLLECTION,
            prefetch=[
                qm.Prefetch(
                    query=qm.SparseVector(indices=sparse_idx, values=sparse_vals),
                    using="bm25",
                    limit=top_k,
                    filter=query_filter,
                ),
                qm.Prefetch(
                    query=dense,
                    using="dense",
                    limit=top_k,
                    filter=query_filter,
                ),
            ],
            query=qm.FusionQuery(fusion=qm.Fusion.RRF),
            limit=top_k,
            with_payload=True,
        )
        points = results.points
    except Exception as exc:  # noqa: BLE001
        logger.warning("Hybrid query failed (%s); trying dense-only", exc)
        fallback = client.query_points(
            collection_name=settings.QDRANT_COLLECTION,
            query=dense,
            using="dense",
            query_filter=query_filter,
            limit=top_k,
            with_payload=True,
        )
        points = fallback.points

    candidates: list[dict] = []
    for p in points:
        payload = dict(p.payload or {})
        base = float(getattr(p, "score", 0.0) or 0.0)
        boosted = accreditation_boost(payload, intent, base)
        candidates.append(
            {
                "id": str(p.id),
                "score": boosted,
                "hybrid_score": base,
                "text": payload.get("text") or "",
                "payload": payload,
                "intent": intent,
            }
        )
    candidates.sort(key=lambda c: c["score"], reverse=True)
    return candidates


def aggregate_by_document(ranked_chunks: list[dict], result_limit: int) -> list[dict]:
    by_doc: dict[str, dict] = {}
    for chunk in ranked_chunks:
        payload = chunk["payload"]
        doc_id = str(payload.get("document_id") or "")
        if not doc_id:
            continue
        bucket = by_doc.get(doc_id)
        if not bucket:
            by_doc[doc_id] = {
                "document_id": doc_id,
                "score": chunk["score"],
                "passages": [chunk["text"]],
                "payload": payload,
                "terms": [],
            }
        else:
            bucket["score"] = max(bucket["score"], chunk["score"])
            if chunk["text"] and chunk["text"] not in bucket["passages"]:
                bucket["passages"].append(chunk["text"])
    docs = sorted(by_doc.values(), key=lambda d: d["score"], reverse=True)
    return docs[:result_limit]
