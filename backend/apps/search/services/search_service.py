"""Search orchestration service."""
from __future__ import annotations

import re
from math import expm1

from django.conf import settings

from apps.documents.models import EvidenceDocument
from apps.search.services.rerank import rerank
from apps.search.services.retrieve import aggregate_by_document, hybrid_retrieve


def _query_terms(q: str) -> list[str]:
    return [t for t in re.findall(r"[a-z0-9]{2,}", (q or "").lower()) if t]


def run_search(query: str, filters: dict | None = None, limit: int | None = None, *, workspace_ids=None, workspace=None) -> list[dict]:
    top = limit or settings.SEARCH_RESULT_LIMIT
    candidates = hybrid_retrieve(
        query, filters=filters, limit=settings.RETRIEVE_TOP_K, workspace_ids=workspace_ids, workspace=workspace,
    )
    reranked = rerank(query, candidates, top_k=settings.RERANK_TOP_K)
    aggregated = aggregate_by_document(reranked, result_limit=top)
    terms = _query_terms(query)

    results: list[dict] = []
    for item in aggregated:
        doc = EvidenceDocument.objects.filter(pk=item["document_id"]).first()
        doc_payload = doc.to_api_dict() if doc else {
            "id": item["document_id"],
            "title": item["payload"].get("title") or "Untitled",
            "frameworkId": item["payload"].get("framework_id"),
            "areaId": item["payload"].get("area_id"),
            "criterionId": item["payload"].get("criterion_id"),
            "indicatorId": item["payload"].get("indicator_id"),
            "campusId": item["payload"].get("campus_id"),
            "campus": item["payload"].get("campus"),
            "program": item["payload"].get("program"),
            "confidentiality": item["payload"].get("confidentiality"),
            "status": "Indexed",
            "passages": item["passages"],
            "docType": item["payload"].get("doc_type") or "Other",
            "description": "",
            "keywords": [],
            "academicYear": item["payload"].get("academic_year") or "",
            "cycle": item["payload"].get("cycle") or "",
            "college": item["payload"].get("college") or "",
            "department": item["payload"].get("department") or "",
            "office": item["payload"].get("office") or "",
            "documentDate": "",
            "fileType": item["payload"].get("file_type") or "PDF",
            "uploadedBy": item["payload"].get("uploaded_by") or "system",
            "dateAdded": None,
        }
        # Prefer fresh passages from index
        from apps.auth.models import RepositoryEntry
        from apps.auth.repository import record
        entry = RepositoryEntry.objects.filter(kind='document', record_id=item['document_id'], deleted=False).first()
        if entry:
            doc_payload.update(record(entry))
        passages = item["passages"][:5]
        doc_payload["passages"] = passages
        matchable_fields = {
            "title": doc_payload.get("title") or "",
            "program": doc_payload.get("program") or "",
            "document text": " ".join(passages),
        }
        matching = {field: set(_query_terms(text)).intersection(terms) for field, text in matchable_fields.items()}
        matched_terms = set().union(*matching.values())
        pct = -100 * expm1(-item["score"])
        results.append(
            {
                "doc": doc_payload,
                "score": round(pct, 1),
                "terms": terms,
                "passages": passages,
                "keywords": [term for term in dict.fromkeys(terms) if term in matched_terms],
                "relatedTerms": [],
                "fields": [field for field, matches in matching.items() if matches],
            }
        )
    return results
