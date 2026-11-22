"""Shared live board. Writes wake every connected browser; reads are filtered by role."""
from __future__ import annotations

import threading

from django.db import transaction

from apps.auth.models import PortalLiveBoard

OFFICE_ROLES = {"Superadmin", "Administrator", "QA Personnel"}

_condition = threading.Condition()


def _items(value) -> list:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict) and item.get("id")]


def _stamp(item: dict) -> str:
    for key in ("updatedAt", "reviewedAt", "requestedAt", "createdAt", "submittedAt"):
        value = item.get(key)
        if isinstance(value, str) and value:
            return value
    return ""


def merge_items(existing, incoming) -> list:
    """Keep every id. An incoming copy replaces the stored one when it is newer."""
    merged = {item["id"]: item for item in _items(existing)}
    for item in _items(incoming):
        previous = merged.get(item["id"])
        if previous is None or _stamp(item) >= _stamp(previous):
            merged[item["id"]] = item
    return sorted(merged.values(), key=lambda item: str(item.get("id")))


def _board():
    board, _ = PortalLiveBoard.objects.get_or_create(pk=1)
    return board


def current_revision() -> int:
    return int(_board().revision)


def wait_for_revision(since: int, timeout: float) -> int:
    with _condition:
        latest = current_revision()
        if latest != since:
            return latest
        _condition.wait(timeout)
    return current_revision()


def _notify():
    with _condition:
        _condition.notify_all()


def _owns(item: dict, user_id: str, email: str) -> bool:
    if user_id and item.get("requesterId") == user_id:
        return True
    requester_email = str(item.get("requesterEmail") or "").strip().lower()
    return bool(email and requester_email == email)


def visible_for(board: PortalLiveBoard, role: str, user_id: str, email: str) -> dict:
    office = role in OFFICE_ROLES
    email = email.strip().lower()

    def requests():
        rows = _items(board.document_requests)
        if office:
            return rows
        return [row for row in rows if _owns(row, user_id, email)]

    def notifications():
        rows = []
        for item in _items(board.notifications):
            audience = item.get("audience")
            if not audience:
                rows.append(item)
            elif audience == "admins":
                if office:
                    rows.append(item)
            elif user_id and audience == user_id:
                rows.append(item)
        return rows

    def access():
        rows = _items(board.access_requests)
        if office:
            return rows
        return [row for row in rows if _owns(row, user_id, email)]

    def reviews():
        rows = _items(board.technical_reviews)
        if office:
            return rows
        return [row for row in rows if _owns(row, user_id, email)]

    def file_grants():
        grants = {}
        for request in _items(board.document_requests):
            owns = _owns(request, user_id, email)
            messages = request.get("messages") if isinstance(request.get("messages"), list) else []
            for message in messages:
                if not isinstance(message, dict):
                    continue
                attachments = message.get("attachments") if isinstance(message.get("attachments"), list) else []
                for item in attachments:
                    if not isinstance(item, dict) or item.get("kind") != "document" or not item.get("documentId"):
                        continue
                    access = item.get("access") or "restricted"
                    if not (office or owns or access == "anyone"):
                        continue
                    document_id = str(item.get("documentId"))
                    can_download = office or item.get("role") == "editor"
                    previous = grants.get(document_id)
                    if previous is None or (can_download and not previous["canDownload"]):
                        grants[document_id] = {
                            "documentId": document_id,
                            "canView": True,
                            "canDownload": can_download,
                            "name": item.get("name") or "",
                            "fileType": item.get("fileType") or "",
                        }
        return list(grants.values())

    return {
        "revision": int(board.revision),
        "role": role,
        "documentRequests": requests(),
        "notifications": notifications(),
        "accessRequests": access(),
        "technicalReviews": reviews(),
        "fileGrants": file_grants(),
    }


def snapshot_for(role: str, user_id: str, email: str) -> dict:
    return visible_for(_board(), role or "Faculty", user_id, email)


def file_grant_for(role: str, user_id: str, email: str, document_id: str) -> dict | None:
    grants = snapshot_for(role, user_id, email).get("fileGrants") or []
    return next((grant for grant in grants if grant.get("documentId") == document_id and grant.get("canView")), None)


def sync_board(body: dict) -> dict:
    role = str(body.get("role") or "Faculty")
    user_id = str(body.get("userId") or "")
    email = str(body.get("email") or "")
    with transaction.atomic():
        board, _ = PortalLiveBoard.objects.select_for_update().get_or_create(pk=1)
        changed = False

        def store(field: str, incoming) -> None:
            nonlocal changed
            merged = merge_items(getattr(board, field), incoming)
            if merged != sorted(_items(getattr(board, field)), key=lambda item: str(item.get("id"))):
                setattr(board, field, merged)
                changed = True

        if "documentRequests" in body:
            store("document_requests", body.get("documentRequests"))
        if "notifications" in body:
            store("notifications", body.get("notifications"))
        dismissed = body.get("dismissedNotificationIds")
        if isinstance(dismissed, list) and dismissed:
            drop = {str(item) for item in dismissed}
            kept = [item for item in _items(board.notifications) if item.get("id") not in drop]
            if len(kept) != len(_items(board.notifications)):
                board.notifications = kept
                changed = True
        if "accessRequests" in body:
            store("access_requests", body.get("accessRequests"))
        if "technicalReviews" in body:
            store("technical_reviews", body.get("technicalReviews"))
        if changed:
            board.revision = int(board.revision) + 1
            board.save()
        payload = visible_for(board, role, user_id, email)
    if changed:
        transaction.on_commit(_notify)
    return payload
