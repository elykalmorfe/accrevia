"""OCR / text extraction service."""
from __future__ import annotations

import logging
from pathlib import Path

from django.conf import settings

logger = logging.getLogger(__name__)


def _configure_tesseract() -> None:
    cmd = getattr(settings, "TESSERACT_CMD", "") or ""
    if cmd:
        import pytesseract

        pytesseract.pytesseract.tesseract_cmd = cmd


def extract_text_from_pdf(path: Path) -> tuple[str, bool]:
    """Return (text, ocr_applied). Prefer embedded text; OCR pages when sparse."""
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    parts: list[str] = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    text = "\n".join(parts).strip()
    if len(text) >= 80:
        return text, False

    # Scanned / image-based PDF — OCR via pdf2image + tesseract when available
    try:
        _configure_tesseract()
        import pytesseract
        from pdf2image import convert_from_path

        images = convert_from_path(str(path), dpi=200)
        ocr_parts = [pytesseract.image_to_string(img) for img in images]
        ocr_text = "\n".join(ocr_parts).strip()
        if ocr_text:
            return ocr_text, True
    except Exception as exc:  # noqa: BLE001
        logger.warning("PDF OCR fallback failed for %s: %s", path, exc)

    return text, False


def extract_text_from_image(path: Path) -> tuple[str, bool]:
    _configure_tesseract()
    import pytesseract
    from PIL import Image

    text = pytesseract.image_to_string(Image.open(path))
    return (text or "").strip(), True


def extract_text(path: Path) -> tuple[str, bool]:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return extract_text_from_pdf(path)
    if suffix in {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"}:
        return extract_text_from_image(path)
    # Best-effort: read as text
    try:
        return path.read_text(encoding="utf-8", errors="ignore").strip(), False
    except Exception:  # noqa: BLE001
        return "", False