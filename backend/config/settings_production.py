
"""Production Django settings for ACCREVIA on Hostinger."""

import os

from django.core.exceptions import ImproperlyConfigured
from .settings import *


def required_env(name):
    value = os.environ.get(name, "").strip()
    if not value:
        raise ImproperlyConfigured(
            f"Missing required production setting: {name}"
        )
    return value


# Core security
DEBUG = False
SECRET_KEY = required_env("DJANGO_SECRET_KEY")

if len(SECRET_KEY) < 50 or SECRET_KEY.startswith(
    ("django-insecure-", "dev-insecure-")
):
    raise ImproperlyConfigured(
        "Use a strong production DJANGO_SECRET_KEY."
    )

ALLOWED_HOSTS = [
    host.strip()
    for host in required_env("DJANGO_ALLOWED_HOSTS").split(",")
    if host.strip()
]

# Frontend and API origins
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]

# HTTPS settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SECURE_CONTENT_TYPE_NOSNIFF = True

# Keep HSTS disabled until HTTPS is fully verified.
SECURE_HSTS_SECONDS = 0

# Enable only after configuring a trusted reverse proxy
# that removes incoming X-Forwarded-Proto headers.
if os.getenv("TRUST_PROXY_SSL_HEADER", "false").lower() == "true":
    SECURE_PROXY_SSL_HEADER = (
        "HTTP_X_FORWARDED_PROTO",
        "https",
    )

# Static assets and uploaded files
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# AI processing
EMBEDDING_DEVICE = "cpu"
EMBEDDING_BATCH_SIZE = 1
SEARCH_WARMUP = False
