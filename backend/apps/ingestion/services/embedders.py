"""BM25 sparse + dense embedding service (BGE-M3 primary, App Control–safe cascade)."""
from __future__ import annotations

import hashlib
import logging
import re
from functools import lru_cache

import numpy as np
from django.conf import settings

logger = logging.getLogger(__name__)

_TOKEN = re.compile(r"[a-z0-9]{2,}")

# kind -> (backend_name, degraded)
_BACKEND_META = {
    "bge": ("bge-m3", False),
    "bge_st": ("bge-m3", False),  # same model via sentence-transformers
    "fastembed": ("fastembed-dense", True),
    "st": ("sentence-transformers", True),
    "hash": ("hashed-dense", True),
}


def _tokenize(text: str) -> list[str]:
    return _TOKEN.findall((text or "").lower())


def _configured_dense_size() -> int:
    return int(getattr(settings, "DENSE_VECTOR_SIZE", 384))


@lru_cache(maxsize=1)
def _dense_model():
    """Return (kind, model_or_None). kind in bge|fastembed|st|hash."""
    device = getattr(settings, "EMBEDDING_DEVICE", "cpu")
    model_name = settings.BGE_MODEL
    fastembed_name = getattr(
        settings,
        "FASTEMBED_DENSE_MODEL",
        "sentence-transformers/all-MiniLM-L6-v2",
    )

    try:
        from FlagEmbedding import BGEM3FlagModel

        logger.info("Loading BGE-M3 via FlagEmbedding (%s)", model_name)
        model = BGEM3FlagModel(model_name, use_fp16=False, device=device)
        logger.info("Dense backend active: bge-m3 via FlagEmbedding (primary)")
        return ("bge", model)
    except Exception as exc:  # noqa: BLE001
        logger.warning("FlagEmbedding BGE-M3 unavailable (%s); trying sentence-transformers BGE-M3", exc)

    try:
        from sentence_transformers import SentenceTransformer

        logger.info("Loading BGE-M3 via sentence-transformers (%s)", model_name)
        model = SentenceTransformer(model_name, device=device)
        logger.info("Dense backend active: bge-m3 via sentence-transformers (primary)")
        return ("bge_st", model)
    except Exception as exc:  # noqa: BLE001
        logger.warning("sentence-transformers BGE-M3 unavailable (%s); trying FastEmbed dense", exc)

    try:
        from fastembed import TextEmbedding

        logger.info("Loading FastEmbed dense model (%s)", fastembed_name)
        model = TextEmbedding(model_name=fastembed_name)
        logger.info("Dense backend active: fastembed-dense (degraded vs BGE-M3)")
        return ("fastembed", model)
    except Exception as exc:  # noqa: BLE001
        logger.warning("FastEmbed dense unavailable (%s); trying MiniLM fallback", exc)

    try:
        from sentence_transformers import SentenceTransformer

        fallback = "sentence-transformers/all-MiniLM-L6-v2"
        logger.info("Loading sentence-transformers dense model (%s)", fallback)
        model = SentenceTransformer(fallback, device=device)
        logger.info("Dense backend active: sentence-transformers MiniLM (degraded vs BGE-M3)")
        return ("st", model)
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "sentence-transformers unavailable (%s); using hashed dense fallback. "
            "Hybrid search will run in degraded mode (not full BGE-M3 quality).",
            exc,
        )
        return ("hash", None)


def dense_backend_status() -> dict:
    """Lightweight status for /api/health/ — never downloads or loads models."""
    cache_info = getattr(_dense_model, "cache_info", None)
    loaded = bool(cache_info and cache_info().currsize > 0) if callable(cache_info) else False
    if loaded:
        kind, _model = _dense_model()
        name, degraded = _BACKEND_META.get(kind, (kind, True))
        return {"name": name, "degraded": degraded, "kind": kind, "loaded": True}
    return {
        "name": getattr(settings, "BGE_MODEL", "BAAI/bge-m3"),
        "degraded": False,
        "kind": "configured",
        "loaded": False,
    }


def dense_backend_info() -> dict:
    """Return {name, degraded, kind} for the active dense backend (loads model if needed)."""
    kind, _model = _dense_model()
    name, degraded = _BACKEND_META.get(kind, (kind, True))
    return {"name": name, "degraded": degraded, "kind": kind, "loaded": True}


def _hashed_dense(text: str, dim: int | None = None) -> list[float]:
    """Deterministic bag-of-tokens projection into a fixed dense vector (NumPy only)."""
    size = dim or _configured_dense_size()
    vec = np.zeros(size, dtype=np.float64)
    tokens = _tokenize(text)
    if not tokens:
        vec[0] = 1.0
        return vec.tolist()
    for tok in tokens:
        digest = hashlib.md5(tok.encode("utf-8")).digest()
        idx = int.from_bytes(digest[:4], "little") % size
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vec[idx] += sign
    norm = float(np.linalg.norm(vec))
    if norm > 0:
        vec /= norm
    return vec.tolist()


def embed_dense(texts: list[str]) -> list[list[float]]:
    kind, model = _dense_model()

    if kind == "bge":
        out = model.encode(texts, return_dense=True, return_sparse=False, return_colbert_vecs=False)
        dense = out["dense_vecs"]
        return [list(map(float, v)) for v in dense]

    if kind == "fastembed":
        vectors = list(model.embed(texts))
        return [list(map(float, v)) for v in vectors]

    if kind in {"bge_st", "st"}:
        vectors = model.encode(texts, normalize_embeddings=True)
        return [list(map(float, v)) for v in np.asarray(vectors)]

    dim = _configured_dense_size()
    return [_hashed_dense(t, dim) for t in texts]


@lru_cache(maxsize=1)
def _sparse_model():
    try:
        from fastembed import SparseTextEmbedding

        logger.info("Loading FastEmbed BM25 sparse model")
        return SparseTextEmbedding(model_name="Qdrant/bm25")
    except Exception as exc:  # noqa: BLE001
        logger.warning("FastEmbed BM25 unavailable (%s); using hashed sparse fallback", exc)
        return None


def _hashed_sparse(text: str, dim: int = 30000) -> tuple[list[int], list[float]]:
    counts: dict[int, float] = {}
    for tok in _tokenize(text):
        h = int(hashlib.md5(tok.encode("utf-8")).hexdigest(), 16) % dim
        counts[h] = counts.get(h, 0.0) + 1.0
    if not counts:
        return [0], [0.0]
    indices = sorted(counts.keys())
    values = [counts[i] for i in indices]
    return indices, values


def embed_sparse(texts: list[str]) -> list[tuple[list[int], list[float]]]:
    model = _sparse_model()
    if model is None:
        return [_hashed_sparse(t) for t in texts]

    results: list[tuple[list[int], list[float]]] = []
    for emb in model.embed(texts):
        indices = list(map(int, emb.indices))
        values = list(map(float, emb.values))
        if not indices:
            indices, values = [0], [0.0]
        results.append((indices, values))
    return results


def dense_vector_size() -> int:
    """Native dense size for the active backend (hash uses DENSE_VECTOR_SIZE)."""
    kind, model = _dense_model()
    if kind in {"bge", "fastembed"}:
        sample = embed_dense(["dimension probe"])
        return len(sample[0])
    if kind in {"bge_st", "st"}:
        return int(model.get_sentence_embedding_dimension())
    return _configured_dense_size()
