"""BM25 sparse + BGE-M3 dense embedding service (CPU-friendly defaults)."""
from __future__ import annotations

import hashlib
import logging
import re
from functools import lru_cache

import numpy as np
from django.conf import settings

logger = logging.getLogger(__name__)

_TOKEN = re.compile(r"[a-z0-9]{2,}")


def _tokenize(text: str) -> list[str]:
    return _TOKEN.findall((text or "").lower())


@lru_cache(maxsize=1)
def _dense_model():
    device = getattr(settings, "EMBEDDING_DEVICE", "cpu")
    model_name = settings.BGE_MODEL
    try:
        from FlagEmbedding import BGEM3FlagModel

        logger.info("Loading BGE-M3 via FlagEmbedding (%s)", model_name)
        return ("bge", BGEM3FlagModel(model_name, use_fp16=False, device=device))
    except Exception as exc:  # noqa: BLE001
        logger.warning("FlagEmbedding BGE-M3 unavailable (%s); falling back to sentence-transformers", exc)
        from sentence_transformers import SentenceTransformer

        # Smaller CPU fallback that still produces dense vectors for hybrid search
        fallback = "sentence-transformers/all-MiniLM-L6-v2"
        return ("st", SentenceTransformer(fallback, device=device))


@lru_cache(maxsize=1)
def _sparse_model():
    try:
        from fastembed import SparseTextEmbedding

        logger.info("Loading FastEmbed BM25 sparse model")
        return SparseTextEmbedding(model_name="Qdrant/bm25")
    except Exception as exc:  # noqa: BLE001
        logger.warning("FastEmbed BM25 unavailable (%s); using hashed sparse fallback", exc)
        return None


def embed_dense(texts: list[str]) -> list[list[float]]:
    kind, model = _dense_model()
    if kind == "bge":
        out = model.encode(texts, return_dense=True, return_sparse=False, return_colbert_vecs=False)
        dense = out["dense_vecs"]
        return [list(map(float, v)) for v in dense]
    vectors = model.encode(texts, normalize_embeddings=True)
    return [list(map(float, v)) for v in np.asarray(vectors)]


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
        # fastembed SparseEmbedding has indices / values
        indices = list(map(int, emb.indices))
        values = list(map(float, emb.values))
        if not indices:
            indices, values = [0], [0.0]
        results.append((indices, values))
    return results


def dense_vector_size() -> int:
    kind, model = _dense_model()
    if kind == "bge":
        sample = embed_dense(["dimension probe"])
        return len(sample[0])
    return int(model.get_sentence_embedding_dimension())