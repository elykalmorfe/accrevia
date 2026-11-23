"""Thin search controller."""
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.auth.portal_storage_views import is_local_browser
from apps.auth.workspace_storage import workspace_source
from apps.ingestion.services.embedders import dense_backend_info
from apps.search.serializers import SearchRequestSerializer
from apps.search.services.search_service import run_search
from apps.search.services.warmup import search_warmup_status
from apps.auth.session_auth import session_account
from apps.auth.live import snapshot_for
from apps.documents.models import EvidenceDocument
from django.db.models import Q


@method_decorator(csrf_protect, name="dispatch")
class SearchView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if search_warmup_status() == "warming":
            return Response({"detail": "Search models are warming up."}, status=503)
        account = session_account(request)
        if not account:
            return Response({"detail": "Sign in to search the document index."}, status=401)
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
        from apps.auth.models import RepositoryEntry
        if not RepositoryEntry.objects.exists() and account.role not in {"Superadmin", "Administrator", "QA Personnel"}:
            allowed = set(EvidenceDocument.objects.filter(Q(confidentiality__iexact="Public") | Q(uploaded_by__in=[account.pk, account.email])).values_list("pk", flat=True))
            grants = snapshot_for(account.role, account.pk, account.email).get("fileGrants") or []
            allowed.update(grant["documentId"] for grant in grants if grant.get("canView") and grant.get("documentId"))
            if not allowed:
                return Response({"results": [], "count": 0, "source": "hybrid"})
            filters["documentIds"] = sorted(allowed)
        if RepositoryEntry.objects.exists():
            from apps.auth.repository import may_read, record
            permitted = {entry.record_id for entry in RepositoryEntry.objects.filter(kind='document', deleted=False) if entry.data.get('status') == 'Indexed' and may_read(account, record(entry))}
            if filters.get('documentIds') is not None:
                permitted.intersection_update(filters['documentIds'])
            if not permitted:
                return Response({'results': [], 'count': 0, 'source': 'hybrid'})
            filters['documentIds'] = sorted(permitted)

        workspace_ids = data.get("workspaceDocumentIds", []) if is_local_browser(request) else []
        results = run_search(
            data["q"], filters=filters, limit=data.get("limit"), workspace_ids=workspace_ids,
            workspace=workspace_source() if workspace_ids else None,
        )
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
