"""Thin search controller."""
from rest_framework.response import Response
from rest_framework.views import APIView

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
                "frameworkId",
                "areaId",
                "criterionId",
                "indicatorId",
                "campusId",
                "program",
                "confidentiality",
            )
            if data.get(k)
        }
        results = run_search(data["q"], filters=filters, limit=data.get("limit"))
        return Response({"results": results, "count": len(results), "source": "hybrid"})