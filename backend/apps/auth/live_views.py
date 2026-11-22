"""HTTP API for the role-filtered live board."""
from __future__ import annotations

import json

from django.http import FileResponse, StreamingHttpResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.auth.live import OFFICE_ROLES, current_revision, file_grant_for, snapshot_for, sync_board, wait_for_revision
from apps.auth.shared_files import open_shared_file, save_shared_file


def _json_body(request) -> dict:
    if isinstance(getattr(request, "data", None), dict):
        return request.data
    try:
        raw = request.body.decode("utf-8") if request.body else ""
        parsed = json.loads(raw) if raw else {}
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _identity(request, body: dict | None = None) -> tuple[str, str, str]:
    source = body or {}
    role = str(source.get("role") or request.GET.get("role") or "Faculty")
    user_id = str(source.get("userId") or request.GET.get("userId") or "")
    email = str(source.get("email") or request.GET.get("email") or "")
    return role, user_id, email


class LiveStateView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        role, user_id, email = _identity(request)
        return Response(snapshot_for(role, user_id, email))


class LiveSyncView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        body = _json_body(request)
        role, user_id, email = _identity(request, body)
        body["role"] = role
        body["userId"] = user_id
        body["email"] = email
        return Response(sync_board(body))


class LiveFileView(APIView):
    """The original file for a sent document. View follows the request's privacy setting."""

    authentication_classes = []
    permission_classes = []
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, document_id: str):
        role, user_id, email = _identity(request)
        if not file_grant_for(role, user_id, email, document_id):
            return Response({"detail": "You do not have permission to view this file."}, status=403)
        found = open_shared_file(document_id)
        if not found:
            return Response({"detail": "Original file is not stored."}, status=404)
        path, meta = found
        response = FileResponse(path.open("rb"), content_type=meta.get("type") or "application/octet-stream")
        response["Content-Disposition"] = f'inline; filename="{meta.get("name") or path.name}"'
        response["Cache-Control"] = "private"
        return response

    def post(self, request, document_id: str):
        role, _, _ = _identity(request)
        if role not in OFFICE_ROLES:
            return Response({"detail": "Only the office can store a shared original."}, status=403)
        upload = request.FILES.get("file")
        if upload is None:
            return Response({"detail": "Choose a file."}, status=400)
        try:
            save_shared_file(document_id, upload.name, upload.content_type or "", upload)
        except ValueError:
            return Response({"detail": "Invalid document id."}, status=400)
        return Response({"documentId": document_id, "name": upload.name})


@method_decorator(csrf_exempt, name="dispatch")
class LiveEventsView(View):
    """Server-sent events. A board write wakes every signed-in browser."""

    def get(self, request):
        def stream():
            yield ":" + (" " * 2048) + "\n\n"
            last = current_revision()
            yield f"data: {json.dumps({'type': 'ready', 'revision': last})}\n\n"
            while True:
                latest = wait_for_revision(last, timeout=12)
                if latest != last:
                    last = latest
                    yield f"data: {json.dumps({'type': 'live', 'revision': last})}\n\n"
                else:
                    yield ": keepalive\n\n"

        response = StreamingHttpResponse(stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache, no-transform"
        response["X-Accel-Buffering"] = "no"
        return response
