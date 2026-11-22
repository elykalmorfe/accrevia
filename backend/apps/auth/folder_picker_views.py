"""Local-only endpoint that opens a Windows window for choosing several folders."""
from __future__ import annotations

import sys

from django.http import FileResponse
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.auth.folder_picker import forget_pick, pick_multiple_folders, picked_file, remember_folders


def _on_this_computer(request) -> bool:
    return request.META.get("REMOTE_ADDR") in {"127.0.0.1", "::1"}


class PickFoldersView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if not _on_this_computer(request):
            return Response({"detail": "Choosing folders from this window only works on this computer."}, status=403)
        if sys.platform != "win32":
            return Response({"supported": False}, status=501)
        raw_limit = 25
        if isinstance(getattr(request, "data", None), dict):
            try:
                raw_limit = int(request.data.get("maxMb") or 25)
            except (TypeError, ValueError):
                raw_limit = 25
        max_bytes = max(1, min(raw_limit, 200)) * 1024 * 1024
        try:
            paths = pick_multiple_folders()
        except OSError:
            return Response({"detail": "Could not open the folder window."}, status=500)
        if not paths:
            return Response({"cancelled": True})
        return Response(remember_folders(paths, max_bytes))


class PickedFolderFileView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, pick_id: str, index: int):
        if not _on_this_computer(request):
            return Response(status=403)
        path = picked_file(pick_id, index)
        if path is None:
            return Response(status=404)
        return FileResponse(path.open("rb"), as_attachment=False, filename=path.name)


class ForgetPickView(APIView):
    authentication_classes = []
    permission_classes = []

    def delete(self, request, pick_id: str):
        if _on_this_computer(request):
            forget_pick(pick_id)
        return Response(status=204)
