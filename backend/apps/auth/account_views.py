"""HTTP API for the shared, realtime account directory."""
from __future__ import annotations

import json

from django.http import StreamingHttpResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.middleware.csrf import get_token
from .models import PortalAccount
from .session_auth import session_account, establish_session
from .directory import hash_password, password_matches
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


@method_decorator(csrf_protect, name="dispatch")
class AccountRegisterView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        status_code, payload = register_account(_json_body(request))
        return Response(payload, status=status_code)


@method_decorator(csrf_protect, name="dispatch")
class AccountLoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        body = _json_body(request)
        status_code, payload = authenticate(str(body.get("email") or ""), str(body.get("password") or ""))
        if status_code == 200:
            account = PortalAccount.objects.get(email=body.get("email", "").strip().lower())
            establish_session(request, account)
        return Response(payload, status=status_code)


@method_decorator(csrf_protect, name="dispatch")
class AccountSyncView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if not _is_admin(request):
            return Response({"detail": "Administrator session required."}, status=403)
        body = _json_body(request)
        accounts = body.get("accounts") if isinstance(body.get("accounts"), list) else []
        users = body.get("users") if isinstance(body.get("users"), list) else []
        return Response(sync_snapshot(accounts, users))


@method_decorator(csrf_protect, name="dispatch")
class AccountUserUpsertView(APIView):
    authentication_classes = []
    permission_classes = []

    def put(self, request):
        account = session_account(request)
        if not account:
            return Response({"detail": "Sign in required."}, status=401)
        body = _json_body(request)
        if not _is_admin(request):
            portal = body.get("user", body)
            if str(portal.get("email", "")).lower() != account.email.lower():
                return Response({"detail": "Access denied."}, status=403)
            allowed = {key: value for key, value in portal.items() if key in {"email", "name", "office"}}
            body = {"user": {**account.to_portal(), **allowed}}
        status_code, payload = upsert_portal_user(body)
        return Response(payload, status=status_code)


@method_decorator(csrf_protect, name="dispatch")
class AccountPasswordView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        account = session_account(request)
        if not account:
            return Response({"detail": "Sign in required."}, status=401)
        body = _json_body(request)
        new = str(body.get("newPassword") or "")
        if not password_matches(str(body.get("currentPassword") or ""), account.password_hash):
            return Response({"detail": "Current password is incorrect."}, status=400)
        if len(new) < 12 or password_matches(new, account.password_hash):
            return Response({"detail": "Use a different password of at least 12 characters."}, status=400)
        account.password_hash = hash_password(new)
        account.must_change_password = False
        account.save(update_fields=["password_hash", "must_change_password", "updated_at"])
        establish_session(request, account)
        return Response({"ok": True})


@method_decorator(csrf_protect, name="dispatch")
class AccountApprovalView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        body = _json_body(request)
        if not _is_admin(request):
            return Response({"detail": "Administrator session required."}, status=403)
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


def _is_admin(request):
    account = session_account(request)
    return account is not None and account.role in {"Superadmin", "Administrator"}


class AccountSessionView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        account = session_account(request)
        return Response({"account": account.to_session() if account else None, "csrfToken": get_token(request)})


@method_decorator(csrf_protect, name="dispatch")
class AccountLogoutView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        request.session.flush()
        return Response(status=204)
