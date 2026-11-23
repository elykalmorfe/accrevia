"""Warm search models once per web server process."""
import logging
from threading import Thread

from django.conf import settings

from apps.ingestion.services.embedders import dense_backend_info, embed_dense, embed_sparse, sparse_backend_is_bm25
from apps.search.services.rerank import rerank

logger = logging.getLogger(__name__)
_status = "idle"


def search_warmup_status():
    return _status


def _warm_models():
    global _status
    try:
        sample = "Accreditation evidence"
        embed_dense([sample])
        embed_sparse([sample], for_query=True)
        results = rerank(sample, [{"text": sample, "score": 1.0, "covers_topics": True}], top_k=1)
        ready = not dense_backend_info()["degraded"] and sparse_backend_is_bm25() and "rerank_score" in results[0]
        _status = "ready" if ready else "degraded"
    except Exception:
        logger.exception("Search warmup failed")
        _status = "failed"


def start_search_warmup():
    global _status
    if settings.SEARCH_WARMUP and _status == "idle":
        _status = "warming"
        Thread(target=_warm_models, name="search-warmup", daemon=True).start()
