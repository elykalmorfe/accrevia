"""Verify runtime readiness without starting the API, frontend, or a worker."""
import importlib
import json
import subprocess
import tempfile
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection


class Command(BaseCommand):
    help = "Check MySQL, Redis, Qdrant, OCR, dependencies, and optional real model inference without running servers."

    def add_arguments(self, parser):
        parser.add_argument("--load-models", action="store_true")
        parser.add_argument("--ocr-smoke", action="store_true")
        parser.add_argument("--search-smoke", action="store_true")

    def handle(self, *args, **options):
        checks = {}

        def check(name, probe):
            try:
                detail = probe()
                checks[name] = {"ok": True, "detail": detail}
                self.stdout.write(name + ": OK")
            except Exception as exc:
                checks[name] = {"ok": False, "error": str(exc)[:500]}
                self.stderr.write(name + ": FAILED: " + str(exc)[:300])

        def database():
            if connection.vendor != "mysql":
                raise RuntimeError("MySQL is required; configured database is " + connection.vendor)
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                assert cursor.fetchone()[0] == 1
            return connection.vendor

        def imports():
            for name in ("packaging", "pytesseract", "PIL", "pdf2image", "openpyxl", "FlagEmbedding", "sentence_transformers", "fastembed"):
                importlib.import_module(name)
            from config.celery import app
            app.loader.import_default_modules()
            return "OCR, embeddings, and Celery task imports"

        def redis():
            from redis import Redis
            assert Redis.from_url(settings.CELERY_BROKER_URL, socket_connect_timeout=3, socket_timeout=3).ping()
            return "broker reachable"

        def index():
            from qdrant_client import QdrantClient
            client = QdrantClient(url=settings.QDRANT_URL, timeout=5, check_compatibility=False)
            if not client.collection_exists(settings.QDRANT_COLLECTION):
                raise RuntimeError("Run manage.py index_portal_documents to create the search index.")
            info = client.get_collection(settings.QDRANT_COLLECTION)
            sparse = info.config.params.sparse_vectors or {}
            if "dense" not in info.config.params.vectors or "bm25" not in sparse or str(sparse["bm25"].modifier) != "idf":
                raise RuntimeError("The hybrid index schema is incomplete; rerun manage.py index_portal_documents.")
            if not info.points_count:
                raise RuntimeError("The search index is empty; run manage.py index_portal_documents.")
            return {"collection": settings.QDRANT_COLLECTION, "points": info.points_count}

        def ocr_tools():
            from apps.ingestion.services.ocr import _configure_tesseract
            import pytesseract
            _configure_tesseract()
            version = str(pytesseract.get_tesseract_version())
            command = str(Path(settings.POPPLER_PATH) / "pdftoppm.exe") if settings.POPPLER_PATH else "pdftoppm"
            subprocess.run([command, "-v"], check=True, capture_output=True, timeout=10)
            return {"tesseract": version, "poppler": "available"}

        def real_ocr():
            from PIL import Image, ImageDraw, ImageFont
            from apps.ingestion.services.ocr import extract_text
            with tempfile.TemporaryDirectory(prefix="accrevia-ocr-check-") as temporary:
                image = Image.new("RGB", (1600, 350), "white")
                font = ImageFont.truetype("arial.ttf", 60)
                ImageDraw.Draw(image).text((50, 100), "QUALITY MANAGEMENT EVIDENCE 2026", font=font, fill="black")
                for suffix in ("png", "pdf"):
                    path = Path(temporary) / ("scanned." + suffix)
                    image.save(path)
                    text, used_ocr = extract_text(path)
                    if not used_ocr or "QUALITY" not in text or "2026" not in text:
                        raise RuntimeError("OCR smoke test failed for " + suffix)
            return "image and scanned PDF passed"

        def models():
            from apps.ingestion.services.embedders import dense_backend_info, embed_dense, embed_sparse, _sparse_model
            from apps.search.services.rerank import _cross_encoder
            vector = embed_dense(["quality management accreditation evidence"])[0]
            sparse = embed_sparse(["quality management accreditation evidence"])[0]
            if _sparse_model() is None:
                raise RuntimeError("The BM25 model is unavailable; hashed sparse fallback is active.")
            info = dense_backend_info()
            if info["degraded"]:
                raise RuntimeError("A fallback embedding backend is active: " + info["name"])
            reranker = _cross_encoder()
            if reranker is None:
                raise RuntimeError("Cross-encoder is unavailable.")
            scores = reranker.predict([("quality management", "University quality management evidence"), ("quality management", "Unrelated sports timetable")])
            if float(scores[0]) <= float(scores[1]) or not sparse[0]:
                raise RuntimeError("Model inference check failed.")
            return {"backend": info["name"], "dense_dimensions": len(vector), "sparse_terms": len(sparse[0]), "reranker": "passed"}

        def real_search():
            from django.test import Client
            from apps.auth.models import PortalAccount
            from apps.auth.session_auth import SESSION_ACCOUNT_KEY, password_stamp
            from django.contrib.sessions.models import Session

            account = PortalAccount.objects.filter(role="Superadmin", approval_status="approved", portal_status="Active").first()
            if account is None:
                raise RuntimeError("An active Superadmin is required for the private-index smoke test.")
            client = Client(enforce_csrf_checks=True, HTTP_HOST="localhost")
            session = client.session
            session[SESSION_ACCOUNT_KEY] = account.pk
            session["portal_password_stamp"] = password_stamp(account)
            session.save()
            session_key = session.session_key
            try:
                token = client.get("/api/accounts/session/").json()["csrfToken"]
                response = client.post("/api/search/", json.dumps({"q": "quality management", "limit": 5}), content_type="application/json", HTTP_X_CSRFTOKEN=token)
                if response.status_code != 200:
                    raise RuntimeError("Search API returned HTTP " + str(response.status_code))
                result = response.json()
                if not result.get("results") or not any(item.get("passages") for item in result["results"]):
                    raise RuntimeError("The search index did not return matching document passages.")
                if result.get("embedding_degraded"):
                    raise RuntimeError("Search used a fallback embedding backend.")
                return {"http": 200, "results": result["count"], "backend": result["embedding_backend"]}
            finally:
                Session.objects.filter(session_key=session_key).delete()

        check("mysql", database)
        check("python_dependencies", imports)
        check("redis", redis)
        check("search_index", index)
        check("ocr_tools", ocr_tools)
        if options["ocr_smoke"]:
            check("real_ocr", real_ocr)
        if options["load_models"]:
            check("model_inference", models)
        if options["search_smoke"]:
            check("search_api", real_search)
        self.stdout.write(json.dumps(checks))
        if any(not result["ok"] for result in checks.values()):
            raise CommandError("Runtime checks failed; see the component errors above.")
