"""HTTP API for the shared, realtime account directory."""
from __future__ import annotations

import json

from django.http import StreamingHttpResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.auth.directory import (
    authenticate,
    list_directory,
    register_account,
    set_approval,
    set_password_hash,
    sync_snapshot,
    upsert_portal_user,
    wait_for_revision,
    current_revision,
)


def _json_body(request) -> dict:
    if isinstance(getattr(request, "data", None), dict):
        return request.data
    try:
        raw = request.body.decode("utf-8") if request.body else ""
        parsed = json.loads(raw) if raw else {}
    except (UnicodeDecodeError, json.JSONDecodeError):
        return {}
    return parsed if isinstance(parsed, dict) else {}


class AccountDirectoryView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response(list_directory())


class AccountRegisterView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        status_code, payload = register_account(_json_body(request))
        return Response(payload, status=status_code)


class AccountLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        body = _json_body(request)
        status_code, payload = authenticate(str(body.get("email") or ""), str(body.get("password") or ""))
        return Response(payload, status=status_code)


class AccountSyncView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        body = _json_body(request)
        accounts = body.get("accounts") if isinstance(body.get("accounts"), list) else []
        users = body.get("users") if isinstance(body.get("users"), list) else []
        return Response(sync_snapshot(accounts, users))


class AccountUserUpsertView(APIView):
    authentication_classes = []
    permission_classes = []

    def put(self, request):
        status_code, payload = upsert_portal_user(_json_body(request))
        return Response(payload, status=status_code)


class AccountPasswordView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        body = _json_body(request)
        status_code, payload = set_password_hash(str(body.get("email") or ""), str(body.get("passwordHash") or ""))
        return Response(payload, status=status_code)


class AccountApprovalView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        body = _json_body(request)
        status_code, payload = set_approval(str(body.get("email") or ""), str(body.get("decision") or ""))
        return Response(payload, status=status_code)


@method_decorator(csrf_exempt, name="dispatch")
class AccountEventsView(View):
    """Server-sent events. Each directory write wakes every connected browser."""

    def get(self, request):
        def stream():
            # Padding encourages proxies and dev servers to flush the first chunk.
            yield ":" + (" " * 2048) + "\n\n"
            last = current_revision()
            yield f"data: {json.dumps({'type': 'ready', 'revision': last})}\n\n"
            while True:
                latest = wait_for_revision(last, timeout=12)
                if latest != last:
                    last = latest
                    yield f"data: {json.dumps({'type': 'directory', 'revision': last})}\n\n"
                else:
                    yield ": keepalive\n\n"

        response = StreamingHttpResponse(stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache, no-transform"
        response["X-Accel-Buffering"] = "no"
        return response
