"""Django settings for ACCREVIA document intelligence API."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from mongoengine import connect

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-insecure-accrevia-key")
DEBUG = os.getenv("DJANGO_DEBUG", "true").lower() in {"1", "true", "yes"}
ALLOWED_HOSTS = [h.strip() for h in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    "apps.documents.apps.DocumentsConfig",
    "apps.ingestion.apps.IngestionConfig",
    "apps.search.apps.SearchConfig",
    "apps.auth.apps.AuthConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Django still needs a relational DB for admin/sessions; sqlite is fine alongside Mongo.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Manila"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / os.getenv("MEDIA_ROOT", "media")
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True
CORS_EXPOSE_HEADERS = ["Content-Disposition"]

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_AUTHENTICATION_CLASSES": [],
}

SPECTACULAR_SETTINGS = {
    "TITLE": "ACCREVIA Document Intelligence API",
    "DESCRIPTION": "Upload → OCR → chunk → BM25+BGE-M3 → Qdrant hybrid search → accreditation scoring → cross-encoder rerank.",
    "VERSION": "1.0.0",
}

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/accrevia")
try:
    connect(host=MONGO_URI, alias="default", serverSelectionTimeoutMS=3000)
except Exception as exc:  # noqa: BLE001
    # Allow `manage.py` commands to load; /api/health/ reports mongo status.
    import logging

    logging.getLogger(__name__).warning("MongoDB connect deferred/failed: %s", exc)

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "accrevia_chunks")

CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_TASK_TRACK_STARTED = True
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TASK_ALWAYS_EAGER = os.getenv("CELERY_TASK_ALWAYS_EAGER", "false").lower() in {"1", "true", "yes"}

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "800"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "120"))
RETRIEVE_TOP_K = int(os.getenv("RETRIEVE_TOP_K", "40"))
RERANK_TOP_K = int(os.getenv("RERANK_TOP_K", "12"))
SEARCH_RESULT_LIMIT = int(os.getenv("SEARCH_RESULT_LIMIT", "20"))

TESSERACT_CMD = os.getenv("TESSERACT_CMD", "")
BGE_MODEL = os.getenv("BGE_MODEL", "BAAI/bge-m3")
FASTEMBED_DENSE_MODEL = os.getenv(
    "FASTEMBED_DENSE_MODEL",
    "sentence-transformers/all-MiniLM-L6-v2",
)
# Used only by hashed-dense last-resort backend (native model dims otherwise)
DENSE_VECTOR_SIZE = int(os.getenv("DENSE_VECTOR_SIZE", "384"))
CROSS_ENCODER_MODEL = os.getenv("CROSS_ENCODER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
EMBEDDING_DEVICE = os.getenv("EMBEDDING_DEVICE", "cpu")

# JWT stub flag for later production auth
REQUIRE_JWT = os.getenv("REQUIRE_JWT", "false").lower() in {"1", "true", "yes"}