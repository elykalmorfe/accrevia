"""Health + JWT stub (auth optional in DEBUG)."""
from __future__ import annotations

from django.conf import settings
from qdrant_client import QdrantClient
from rest_framework.response import Response
from rest_framework.views import APIView
from mongoengine.connection import get_db

from apps.ingestion.services.embedders import dense_backend_info


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        mongo_ok = False
        qdrant_ok = False
        mongo_error = None
        qdrant_error = None
        embedding = None
        embedding_error = None

        try:
            get_db().command("ping")
            mongo_ok = True
        except Exception as exc:  # noqa: BLE001
            mongo_error = str(exc)

        try:
            client = QdrantClient(url=settings.QDRANT_URL, timeout=3)
            client.get_collections()
            qdrant_ok = True
        except Exception as exc:  # noqa: BLE001
            qdrant_error = str(exc)

        try:
            embedding = dense_backend_info()
        except Exception as exc:  # noqa: BLE001
            embedding_error = str(exc)
            embedding = {"name": "unavailable", "degraded": True, "kind": "error"}

        ready = mongo_ok and qdrant_ok
        embedding_degraded = bool(embedding and embedding.get("degraded"))
        payload = {
            "status": "ok" if ready and not embedding_degraded else "degraded" if ready else "unavailable",
            "mongo": mongo_ok,
            "qdrant": qdrant_ok,
            "jwt_required": settings.REQUIRE_JWT,
            "collection": settings.QDRANT_COLLECTION,
            "embedding_backend": embedding.get("name") if embedding else None,
            "embedding_degraded": embedding_degraded,
        }
        if mongo_error:
            payload["mongo_error"] = mongo_error
        if qdrant_error:
            payload["qdrant_error"] = qdrant_error
        if embedding_error:
            payload["embedding_error"] = embedding_error
        # Infra ready => 200 even when embeddings are degraded (search still works)
        return Response(payload, status=200 if ready else 503)


class JwtStubView(APIView):
    """Placeholder for future JWT issuance — not required in DEBUG."""

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        return Response(
            {
                "detail": "JWT auth is stubbed. Set REQUIRE_JWT=true and implement token issue later.",
                "access": None,
            },
            status=501,
        )