"""Copy Accrevia data from the local development portal into MySQL."""
import re

from django.conf import settings
from rest_framework import serializers
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .portal_storage import store_collection, store_file

BROWSER_COLLECTIONS = {
    "accessLog", "areas", "campuses", "copcRecords", "criteria", "dismissed_reminders",
    "documents", "folders", "frameworks", "hidden_folders", "iaRecords", "indicators",
    "isoRecords", "iso_area_layout", "iso_section_description", "iso_section_title",
    "pending", "pqaRecords", "programAccreditations", "recentSearches", "report_signatories",
    "saved_ids", "selected_campus", "settings", "shares", "sidebar_collapsed", "theme",
}
LOCAL_ORIGINS = {"http://localhost:5173", "http://127.0.0.1:5173"}


def browser_source(request, browser_id):
    if (
        not settings.DEBUG
        or request.META.get("REMOTE_ADDR") not in {"127.0.0.1", "::1"}
        or request.headers.get("Origin") not in LOCAL_ORIGINS
    ):
        raise NotFound()
    return f"browser-{browser_id}"


class PortalRecordsView(APIView):
    def put(self, request, browser_id):
        source = browser_source(request, browser_id)
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
        serializer = PortalFileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        upload = serializer.validated_data["file"]
        file = store_file(source, serializer.validated_data["id"], upload.name, upload.content_type or "", upload)
        return Response({"id": file.key, "sha256": file.content_id})
