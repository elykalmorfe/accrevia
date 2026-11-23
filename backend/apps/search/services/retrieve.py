"""Hybrid BM25 + dense retrieval from Qdrant."""
from __future__ import annotations

import logging

from django.conf import settings
from qdrant_client.http import models as qm

from apps.ingestion.services.embedders import embed_dense, embed_sparse
from apps.ingestion.services.indexer import ensure_collection, get_qdrant
from apps.search.services.scoring import accreditation_boost, evidence_priority, normalized_phrase, parse_intent, topic_terms

logger = logging.getLogger(__name__)


def _build_filter(filters: dict | None, workspace_ids=None, workspace=None) -> qm.Filter:
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
    if filters and "documentIds" in filters:
        must.append(qm.FieldCondition(key="document_id", match=qm.MatchAny(any=filters["documentIds"])))
    workspace_indexed = qm.FieldCondition(key="workspace_indexed", match=qm.MatchValue(value=True))
    normal_uploads = qm.Filter(must_not=[workspace_indexed])
    if workspace and workspace_ids:
        selected = qm.Filter(must=[
            workspace_indexed,
            qm.FieldCondition(key="workspace_source", match=qm.MatchValue(value=workspace)),
            qm.FieldCondition(key="document_id", match=qm.MatchAny(any=workspace_ids)),
        ])
        return qm.Filter(must=must, should=[normal_uploads, selected])
    return qm.Filter(must=must, must_not=[workspace_indexed])


def hybrid_retrieve(query: str, filters: dict | None = None, limit: int | None = None, *, workspace_ids=None, workspace=None) -> list[dict]:
    ensure_collection()
    client = get_qdrant()
    top_k = limit or settings.RETRIEVE_TOP_K
    intent = parse_intent(query)
    phrase = normalized_phrase(query)
    literal_query = " ".join(query.split())
    terms = topic_terms(query)
    if intent.framework_id:
        terms.discard(intent.framework_id)

    dense = embed_dense([query])[0]
    sparse_idx, sparse_vals = embed_sparse([query], for_query=True)[0]
    query_filter = _build_filter(filters, workspace_ids, workspace)
    group_options = {"group_by": "document_id", "group_size": 2, "limit": top_k, "with_payload": True}

    try:
        results = client.query_points_groups(
            collection_name=settings.QDRANT_COLLECTION,
            prefetch=[
                qm.Prefetch(
                    query=qm.SparseVector(indices=sparse_idx, values=sparse_vals),
                    using="bm25",
                    limit=top_k * 4,
                    filter=query_filter,
                ),
                qm.Prefetch(
                    query=dense,
                    using="dense",
                    limit=top_k * 4,
                    filter=query_filter,
                ),
            ],
            query=qm.FusionQuery(fusion=qm.Fusion.RRF),
            **group_options,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Hybrid query failed (%s); trying dense-only", exc)
        results = client.query_points_groups(
            collection_name=settings.QDRANT_COLLECTION,
            query=dense,
            using="dense",
            query_filter=query_filter,
            **group_options,
        )
    points = {point.id: point for group in results.groups for point in group.hits}

    # Supplement body retrieval with titles, program names, and verbatim passages.
    if " " in phrase:
        title_matches = [qm.FieldCondition(key=field, match=qm.MatchText(text=query)) for field in ("title", "program")]
        if len(terms) >= 2:
            title_matches.append(qm.Filter(min_should=qm.MinShould(
                conditions=[qm.FieldCondition(key="title", match=qm.MatchText(text=term)) for term in sorted(terms)],
                min_count=max(2, (2 * len(terms) + 2) // 3),
            )))
        match_conditions = [qm.Filter(
            must=[qm.FieldCondition(key="sequence", match=qm.MatchValue(value=0))],
            should=title_matches,
        )]
        if len(phrase.split()) >= 3:
            match_conditions.append(qm.FieldCondition(key="text", match=qm.MatchText(text=literal_query)))
        matches, _ = client.scroll(
            collection_name=settings.QDRANT_COLLECTION,
            scroll_filter=qm.Filter(must=[query_filter], should=match_conditions),
            limit=top_k,
        )
        for point in matches:
            points.setdefault(point.id, point)

    candidates: list[dict] = []
    for p in points.values():
        payload = dict(p.payload or {})
        base = max(0.0, float(getattr(p, "score", 0.0) or 0.0))
        boosted = accreditation_boost(payload, intent, base)
        priority = evidence_priority(payload, phrase, literal_query)
        title_topics = topic_terms(payload.get("title") or "")
        title_coverage = len(terms & title_topics) / max(1, len(terms))
        context_topics = title_topics | topic_terms(payload.get("program") or "") | topic_terms(payload.get("text") or "")
        candidates.append(
            {
                "id": str(p.id),
                "score": priority + 0.55 * boosted / (1 + boosted) + 0.45 * title_coverage,
                "match_priority": priority,
                "covers_topics": bool(terms) and terms <= context_topics,
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
