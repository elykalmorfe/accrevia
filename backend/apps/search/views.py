"""Thin search controller."""
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ingestion.services.embedders import dense_backend_info
from apps.search.serializers import SearchRequestSerializer
from apps.search.services.search_service import run_search


class SearchView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = SearchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        filters = {
            k: data[k]
            for k in (
                "docType",
                "program",
                "academicYear",
            )
            if data.get(k)
        }
        results = run_search(data["q"], filters=filters, limit=data.get("limit"))
        info = dense_backend_info()
        return Response(
            {
                "results": results,
                "count": len(results),
                "source": "hybrid",
                "embedding_backend": info["name"],
                "embedding_degraded": info["degraded"],
            }
        )