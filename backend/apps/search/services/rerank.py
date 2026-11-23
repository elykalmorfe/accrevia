"""Cross-encoder reranking service."""
from __future__ import annotations

import logging
from functools import lru_cache
from math import tanh

from django.conf import settings

logger = logging.getLogger(__name__)
MIN_RELEVANCE_LOGIT = -6.0


@lru_cache(maxsize=1)
def _cross_encoder():
    try:
        from sentence_transformers import CrossEncoder
    except Exception as exc:  # noqa: BLE001
        # Includes App Control DLL blocks on regex/transformers
        logger.warning("Cross-encoder import failed (%s); rerank disabled", exc)
        return None

    model_name = settings.CROSS_ENCODER_MODEL
    device = getattr(settings, "EMBEDDING_DEVICE", "cpu")
    logger.info("Loading cross-encoder %s on %s", model_name, device)
    return CrossEncoder(model_name, device=device)


def _document_key(candidate):
    return candidate.get("payload", {}).get("document_id") or candidate.get("id") or id(candidate)


def rerank(query: str, candidates: list[dict], top_k: int | None = None) -> list[dict]:
    """Combine retrieval and cross-encoder relevance within each match tier."""
    if not candidates:
        return []
    k = top_k or settings.RERANK_TOP_K
    first_passages = {}
    extra_passages = []
    for candidate in candidates:
        key = _document_key(candidate)
        if key in first_passages:
            extra_passages.append(candidate)
        else:
            first_passages[key] = candidate
    subset = [*first_passages.values(), *extra_passages][: k * 2]
    try:
        model = _cross_encoder()
        if model is None:
            logger.warning("Cross-encoder unavailable; keeping hybrid order (degraded)")
            return subset[:k]
        pairs = []
        for candidate in subset:
            payload = candidate.get("payload", {})
            context = "\n".join(filter(None, (payload.get("title"), payload.get("program"), candidate.get("text"))))
            pairs.append((query, context))
        scores = model.predict(pairs)
        ranked = []
        for candidate, logit in zip(subset, scores, strict=True):
            priority = candidate.get("match_priority", 0)
            if logit < MIN_RELEVANCE_LOGIT and not (priority or candidate.get("covers_topics")):
                continue
            semantic = (1 + tanh(float(logit) / 4)) / 2
            ranked.append({
                **candidate,
                "rerank_score": float(logit),
                "score": priority + (candidate["score"] - priority + semantic) / 2,
            })
        ranked.sort(key=lambda x: x["score"], reverse=True)
        selected = set(list(dict.fromkeys(map(_document_key, ranked)))[:k])
        return [candidate for candidate in ranked if _document_key(candidate) in selected]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Cross-encoder rerank failed (%s); keeping hybrid order", exc)
        return subset[:k]
