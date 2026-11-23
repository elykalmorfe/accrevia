"""OCR / text extraction service."""
from __future__ import annotations

import logging
import zipfile
from xml.etree import ElementTree
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

        images = convert_from_path(str(path), dpi=200, poppler_path=settings.POPPLER_PATH or None)
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
    # Some imported originals have a .pdf label but contain an Office ZIP.
    # Preserve their bytes and extract the actual format rather than misreading it.
    if suffix == ".pdf" and zipfile.is_zipfile(path):
        with zipfile.ZipFile(path) as archive:
            entries = set(archive.namelist())
        if "word/document.xml" in entries:
            suffix = ".docx"
        elif "xl/workbook.xml" in entries:
            suffix = ".xlsx"
    if suffix == ".pdf":
        return extract_text_from_pdf(path)
    if suffix in {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"}:
        return extract_text_from_image(path)
    if suffix == ".docx":
        with zipfile.ZipFile(path) as document:
            root = ElementTree.fromstring(document.read("word/document.xml"))
            ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
            paragraphs = ["".join(p.itertext()) for p in root.findall(".//w:p", ns)]
            return "\n".join(paragraphs).strip(), False
    if suffix == ".xlsx":
        from openpyxl import load_workbook

        source = path.open("rb")
        workbook = load_workbook(source, read_only=True, data_only=True)
        try:
            rows = []
            for sheet in workbook:
                rows.append(sheet.title)
                for row in sheet.iter_rows(values_only=True):
                    values = [str(cell) for cell in row if cell is not None]
                    if values:
                        rows.append(" | ".join(values))
            return "\n".join(rows).strip(), False
        finally:
            workbook.close()
            source.close()
    if suffix not in {".txt", ".md", ".csv", ".json", ".xml", ".log", ".html"}:
        raise ValueError(f"Text extraction needs a supported original or PDF preview, not {suffix}.")
    # Best-effort: read as text
    try:
        return path.read_text(encoding="utf-8", errors="ignore").strip(), False
    except Exception:  # noqa: BLE001
        return "", False
