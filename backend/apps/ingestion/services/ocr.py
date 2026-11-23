"""OCR / text extraction service."""
from __future__ import annotations

import logging
from pathlib import Path
from xml.etree import ElementTree
from zipfile import ZipFile

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
    parts = [(page.extract_text() or "").strip() for page in reader.pages]
    needs_ocr = {i for i, page in enumerate(parts) if len(page) < 80}
    if not needs_ocr:
        return "\n".join(parts), False

    applied = False
    try:
        _configure_tesseract()
        import pytesseract
        from pdf2image import convert_from_path

        for start in range(0, len(parts), 6):
            end = min(start + 6, len(parts))
            if needs_ocr.isdisjoint(range(start, end)):
                continue
            images = convert_from_path(
                path, dpi=200, first_page=start + 1, last_page=end,
                grayscale=True, poppler_path=settings.POPPLER_PATH or None, timeout=60,
            )
            for index, image in enumerate(images, start):
                if index in needs_ocr:
                    recognized = pytesseract.image_to_string(image, timeout=45).strip()
                    if len(recognized) > len(parts[index]):
                        parts[index] = recognized
                        applied = True
    except Exception as exc:  # noqa: BLE001
        logger.warning("PDF OCR fallback failed for %s: %s", path, exc)

    return "\n".join(parts).strip(), applied


def extract_text_from_image(path: Path) -> tuple[str, bool]:
    _configure_tesseract()
    import pytesseract
    from PIL import Image

    with Image.open(path) as image:
        text = pytesseract.image_to_string(image, timeout=45)
    return (text or "").strip(), True


def extract_office_text(path: Path) -> str:
    """Read text from the XML parts of modern Word, Excel, and PowerPoint files."""
    def text_of(element):
        return "".join(node.text or "" for node in element.iterfind(".//{*}t"))

    with ZipFile(path) as archive:
        def read_xml(name):
            return ElementTree.fromstring(archive.read(name))

        names = archive.namelist()
        if path.suffix.lower() == ".docx":
            paragraphs = read_xml("word/document.xml").iterfind(".//{*}p")
            return "\n".join(text_of(paragraph) for paragraph in paragraphs).strip()
        if path.suffix.lower() == ".pptx":
            slides = [name for name in names if name.startswith("ppt/slides/slide") and name.endswith(".xml")]
            return "\n".join(text_of(p) for name in slides for p in read_xml(name).iterfind(".//{*}p")).strip()

        strings = [text_of(item) for item in read_xml("xl/sharedStrings.xml")] if "xl/sharedStrings.xml" in names else []
        sheets = [name for name in names if name.startswith("xl/worksheets/sheet") and name.endswith(".xml")]
        lines = []
        for name in sheets:
            for row in read_xml(name).iterfind(".//{*}row"):
                values = []
                for cell in row.iterfind("{*}c"):
                    value = cell.findtext("{*}v") or text_of(cell)
                    if cell.get("t") == "s" and value.isdecimal():
                        value = strings[int(value)]
                    if value:
                        values.append(value)
                lines.append(" ".join(values))
        return "\n".join(lines).strip()


def extract_text(path: Path) -> tuple[str, bool]:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return extract_text_from_pdf(path)
    if suffix in {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"}:
        return extract_text_from_image(path)
    if suffix in {".docx", ".xlsx", ".pptx"}:
        return extract_office_text(path), False
    if suffix in {".txt", ".csv", ".md", ".log"}:
        return path.read_text(encoding="utf-8-sig").strip(), False
    raise ValueError(f"Text extraction is unavailable for {suffix or 'files without an extension'}.")
