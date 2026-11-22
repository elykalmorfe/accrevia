"""Original files shared on a request. Privacy is checked before a file is read."""
from __future__ import annotations

import json
import re
from pathlib import Path

from django.conf import settings

from .portal_storage import store_file

SAFE_ID = re.compile(r"^[\w.-]{1,120}$")
DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def shared_folder(document_id: str) -> Path:
    if not SAFE_ID.match(document_id):
        raise ValueError("Invalid document id")
    return Path(settings.MEDIA_ROOT) / "shared" / document_id


def save_shared_file(document_id: str, filename: str, content_type: str, source) -> None:
    folder = shared_folder(document_id)
    folder.mkdir(parents=True, exist_ok=True)
    for child in folder.iterdir():
        if child.is_file():
            child.unlink()
    suffix = Path(filename).suffix.lower()
    if suffix not in {".pdf", ".docx", ".xlsx", ".pptx", ".png", ".jpg", ".jpeg", ".txt", ".csv"}:
        suffix = ".bin"
    destination = folder / f"original{suffix}"
    with destination.open("wb") as out:
        if hasattr(source, "chunks"):
            for chunk in source.chunks():
                out.write(chunk)
        else:
            out.write(source.read())
    meta = {
        "name": Path(filename).name or destination.name,
        "type": content_type or "application/octet-stream",
    }
    with destination.open("rb") as original:
        store_file("shared", document_id, meta["name"], meta["type"], original)
    (folder / "meta.json").write_text(json.dumps(meta), encoding="utf-8")


def open_shared_file(document_id: str) -> tuple[Path, dict] | None:
    try:
        folder = shared_folder(document_id)
    except ValueError:
        return None
    meta_path = folder / "meta.json"
    if not meta_path.is_file():
        return None
    try:
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None
    original = next((path for path in folder.iterdir() if path.is_file() and path.name.startswith("original")), None)
    if original is None:
        return None
    return original, meta
