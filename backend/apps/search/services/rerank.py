"""Cross-encoder reranking service."""
from __future__ import annotations

import logging
from functools import lru_cache

from django.conf import settings

logger = logging.getLogger(__name__)


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


def rerank(query: str, candidates: list[dict], top_k: int | None = None) -> list[dict]:
    """Each candidate: {text, score, payload, ...}. Returns sorted by cross-encoder score."""
    if not candidates:
        return []
    k = top_k or settings.RERANK_TOP_K
    subset = candidates[: max(k * 2, k)]
    try:
        model = _cross_encoder()
        if model is None:
            logger.warning("Cross-encoder unavailable; keeping hybrid order (degraded)")
            return candidates[:k]
        pairs = [(query, c.get("text") or "") for c in subset]
        scores = model.predict(pairs)
        for c, s in zip(subset, scores):
            c["rerank_score"] = float(s)
            c["score"] = float(s)
        subset.sort(key=lambda x: x.get("rerank_score", 0.0), reverse=True)
        return subset[:k]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Cross-encoder rerank failed (%s); keeping hybrid order", exc)
        return candidates[:k]