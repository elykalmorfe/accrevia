import tempfile
import zipfile
import json
import hashlib
from contextlib import ExitStack
from io import StringIO
from types import SimpleNamespace
from unittest.mock import patch
from pathlib import Path

from django.test import SimpleTestCase, TestCase
from django.core.management import call_command

from .services.ocr import extract_text


class OfficeExtractionTests(SimpleTestCase):
    def test_word_extracts_document_text_instead_of_zip_bytes(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "manual.docx"
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Quality management evidence</w:t></w:r></w:p></w:body></w:document>')
            text, ocr = extract_text(path)
            self.assertEqual(text, "Quality management evidence")
            self.assertFalse(ocr)

    def test_excel_extracts_sheet_names_and_cell_values(self):
        from openpyxl import Workbook

        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "audit.xlsx"
            workbook = Workbook()
            workbook.active.title = "Audit evidence"
            workbook.active.append(["Status", "Approved", 2026])
            workbook.save(path)
            workbook.close()
            text, ocr = extract_text(path)
            self.assertIn("Audit evidence", text)
            self.assertIn("Status | Approved | 2026", text)
            self.assertFalse(ocr)

    def test_mislabeled_pdf_containing_word_is_read_as_word(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "misnamed.pdf"
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Original certification text</w:t></w:r></w:p></w:body></w:document>')
            text, used_ocr = extract_text(path)
            self.assertEqual(text, "Original certification text")
            self.assertFalse(used_ocr)

    def test_unsupported_binary_is_not_indexed_as_garbled_text(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "original.pub"
            path.write_bytes(b"\xd0\xcf\x11\xe0")
            with self.assertRaises(ValueError):
                extract_text(path)


class PortableIndexRestoreTests(TestCase):
    def setUp(self):
        from apps.auth.portal_storage import store_collection
        from apps.documents.models import EvidenceDocument

        self.data = {"id": "restored", "title": "Quality evidence", "frameworkId": "iso"}
        store_collection("browser-test", "documents", [self.data])
        fingerprint = hashlib.sha256(json.dumps([self.data, "metadata", "test"], sort_keys=True).encode()).hexdigest()
        EvidenceDocument.objects.create(id="restored", title="Quality evidence", storage_path="", status="Indexed", chunk_count=1,
                                        progress={"index_fingerprint": fingerprint, "indexed_source": "metadata"})

    def run_import(self, points):
        path = "apps.ingestion.management.commands.index_portal_documents."
        with tempfile.TemporaryDirectory() as folder, self.settings(MEDIA_ROOT=Path(folder)), ExitStack() as stack:
            stack.enter_context(patch(path + "workspace_database", return_value="default"))
            stack.enter_context(patch(path + "workspace_source", return_value="browser-test"))
            stack.enter_context(patch(path + "ensure_collection"))
            stack.enter_context(patch(path + "dense_backend_info", return_value={"name": "test"}))
            client = stack.enter_context(patch(path + "get_qdrant")).return_value
            client.scroll.return_value = (points, None)
            stack.enter_context(patch(path + "embed_dense", return_value=[[1.0, 0.0]]))
            stack.enter_context(patch(path + "embed_sparse", return_value=[([1], [1.0])]))
            index = stack.enter_context(patch(path + "index_chunks", return_value=1))
            call_command("index_portal_documents", stdout=StringIO())
            return index.call_count

    def test_sql_indexed_flag_does_not_skip_empty_qdrant_after_restore(self):
        self.assertEqual(self.run_import([]), 1)

    def test_complete_existing_vectors_are_not_rebuilt(self):
        self.assertEqual(self.run_import([SimpleNamespace(payload={"document_id": "restored"})]), 0)
