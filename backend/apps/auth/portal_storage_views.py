"""Copy Accrevia data from the local development portal into MySQL."""
import re
from urllib.parse import urlsplit

from django.conf import settings
from django.db import DEFAULT_DB_ALIAS
from django.http import StreamingHttpResponse
from django.utils.http import content_disposition_header
from rest_framework import serializers
from rest_framework.exceptions import NotFound, ValidationError, PermissionDenied
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PortalFile
from .portal_storage import store_collection, store_file
from .workspace_storage import workspace_database, workspace_records, workspace_source
from .repository_views import account_for
from .repository import snapshot, may_read, record
from .models import RepositoryEntry

BROWSER_COLLECTIONS = {
    "accessLog", "areas", "campuses", "copcRecords", "criteria", "dismissed_reminders",
    "documents", "folders", "frameworks", "hidden_folders", "iaRecords", "indicators",
    "isoRecords", "iso_area_layout", "iso_section_description", "iso_section_title",
    "pending", "pqaRecords", "programAccreditations", "recentSearches", "report_signatories",
    "saved_ids", "selected_campus", "settings", "shares", "sidebar_collapsed", "theme",
}
def is_local_browser(request):
    origin = request.headers.get("Origin", "")
    return (
        settings.DEBUG
        and request.META.get("REMOTE_ADDR") in {"127.0.0.1", "::1"}
        and origin in settings.CORS_ALLOWED_ORIGINS
        and urlsplit(origin).hostname in {"localhost", "127.0.0.1", "::1"}
    )


def require_local_browser(request):
    if not is_local_browser(request):
        raise NotFound()


def browser_source(request, browser_id):
    require_local_browser(request)
    return f"browser-{browser_id}"


class PortalRecordsView(APIView):
    def put(self, request, browser_id):
        source = browser_source(request, browser_id)
        account = account_for(request)
        if any(name in request.data for name in ('folders', 'documents')):
            raise ValidationError('Folders and documents must use the versioned repository API.')
        if account.role not in {'Superadmin','Administrator'}:
            personal = {'theme','sidebar_collapsed','saved_ids','recentSearches','dismissed_reminders','selected_campus'}
            if any(name not in personal and not str(name).startswith('profile_') for name in request.data):
                raise PermissionDenied('Institutional records require administrator permission.')
        if not isinstance(request.data, dict) or not request.data:
            raise ValidationError("Expected portal collections.")
        for name in request.data:
            if name not in BROWSER_COLLECTIONS and not re.fullmatch(r"profile_[\w.-]{1,80}", name):
                raise ValidationError("Unknown portal collection.")
        return Response({"records": sum(store_collection(source, name, value) for name, value in request.data.items())})


class PortalFileSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=512)
    file = serializers.FileField(allow_empty_file=True, max_length=512)


class PortalFilesView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, browser_id):
        source = browser_source(request, browser_id)
        account = account_for(request)
        if account.role not in {'Superadmin', 'Administrator'}:
            raise PermissionDenied('Use an authorized accreditation area to upload originals.')
        if RepositoryEntry.objects.filter(kind='document', record_id=request.data.get('id')).exists():
            raise ValidationError('Existing originals must be replaced through the versioned repository API.')
        serializer = PortalFileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload = serializer.validated_data["file"]
        file = store_file(source, serializer.validated_data["id"], upload.name, upload.content_type or "", upload)
        return Response({"id": file.key, "sha256": file.content_id})


class CatalogOriginalView(APIView):
    def get(self, request):
        path = request.query_params.get("path", "")
        account = account_for(request)
        matches = RepositoryEntry.objects.filter(kind='document', deleted=False, data__documentUrl=path)
        if not any(may_read(account, record(entry)) for entry in matches):
            raise NotFound()
        if (
            not path.startswith("/certificates/") or len(path) > 513
            or "\\" in path or any(part in {"", ".", ".."} for part in path[1:].split("/"))
        ):
            raise NotFound()
        files = PortalFile.objects.select_related("content").filter(source="catalog", key=path[1:])
        file = files.first()
        if file is None and workspace_database() != DEFAULT_DB_ALIAS:
            file = files.using(workspace_database()).first()
        if file is None:
            raise NotFound("Original file is unavailable.")

        chunks = file.content.chunks.order_by("position").values_list("data", flat=True).iterator(chunk_size=4)
        response = StreamingHttpResponse(chunks, content_type=file.mime_type or "application/octet-stream")
        response["Content-Disposition"] = content_disposition_header(False, file.name)
        response["Content-Length"] = file.content.size_bytes
        response["X-Content-Type-Options"] = "nosniff"
        return response


class WorkspaceRecordsView(APIView):
    def get(self, request):
        require_local_browser(request)
        account = account_for(request)
        records = workspace_records()
        shared = snapshot(account)
        records.update(folders=shared['folders'], documents=shared['documents'])
        return Response({"records": records})


class WorkspaceOriginalView(APIView):
    def get(self, request):
        require_local_browser(request)
        account = account_for(request)
        entry = RepositoryEntry.objects.filter(kind='document', record_id=request.query_params.get('id',''), deleted=False).first()
        if not entry or not may_read(account, record(entry)):
            raise NotFound()
        source = workspace_source()
        if not source:
            raise NotFound()
        files = PortalFile.objects.using(workspace_database()).select_related("content")
        file = files.filter(source=source, key=request.query_params.get("id", "")).first()
        if file is None:
            raise NotFound("Original file is unavailable.")
        if request.query_params.get("preview") == "1":
            file = files.filter(source="preview", key=file.content_id).first()
            if file is None:
                raise NotFound("A browser preview is unavailable.")
        chunks = file.content.chunks.order_by("position").values_list("data", flat=True)
        response = StreamingHttpResponse((bytes(data) for data in chunks.iterator(chunk_size=4)), content_type=file.mime_type or "application/octet-stream")
        response["Content-Disposition"] = content_disposition_header(False, file.name)
        response["Content-Length"] = file.content.size_bytes
        response["Cache-Control"] = "no-store"
        return response
