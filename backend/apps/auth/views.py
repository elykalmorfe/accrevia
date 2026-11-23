"""Health + JWT stub (auth optional in DEBUG)."""
from __future__ import annotations

from django.conf import settings
from django.db import connection
from qdrant_client import QdrantClient
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ingestion.services.embedders import dense_backend_status


class HealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        mysql_ok = False
        qdrant_ok = False
        mysql_error = None
        qdrant_error = None
        search_index = False

        try:
            connection.ensure_connection()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            mysql_ok = True
        except Exception as exc:  # noqa: BLE001
            mysql_error = str(exc)

        try:
            # Skip client/server semver nag — local Docker image may lag pip client.
            client = QdrantClient(url=settings.QDRANT_URL, timeout=3, check_compatibility=False)
            client.get_collections()
            qdrant_ok = True
            search_index = client.collection_exists(settings.QDRANT_COLLECTION)
        except Exception as exc:  # noqa: BLE001
            qdrant_error = str(exc)

        # Do not load BGE/FastEmbed here — that blocks the whole runserver for minutes.
        embedding = dense_backend_status()
        ready = mysql_ok and qdrant_ok
        embedding_degraded = bool(embedding.get("degraded"))
        payload = {
            "status": "ok" if ready and not embedding_degraded else "degraded" if ready else "unavailable",
            "mysql": mysql_ok,
            "qdrant": qdrant_ok,
            "search_index": search_index,
            "jwt_required": settings.REQUIRE_JWT,
            "collection": settings.QDRANT_COLLECTION,
            "embedding_backend": embedding.get("name"),
            "embedding_degraded": embedding_degraded,
            "embedding_loaded": embedding.get("loaded", False),
        }
        if mysql_error:
            payload["mysql_error"] = mysql_error
        if qdrant_error:
            payload["qdrant_error"] = qdrant_error
        # Infra ready => 200 (embeddings load lazily on first search/ingest)
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


class RootView(APIView):
    """API index so GET / is not a bare 404."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response(
            {
                "service": "accrevia-api",
                "health": "/api/health/",
                "docs": "/api/docs/",
                "documents": "/api/documents/",
                "search": "/api/search/",
            }
        )


class DockerDesktopProbeView(APIView):
    """Docker Desktop probes /json/version; return a harmless 200 stub."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"ApiVersion": "1.0", "service": "accrevia-api"})
