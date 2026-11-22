import os
import sys

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("accrevia")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Prefork (default) breaks on Windows with WinError 5 / billiard PermissionError.
# Solo is the supported local-dev pool on Windows.
if sys.platform == "win32":
    app.conf.worker_pool = os.getenv("CELERY_WORKER_POOL", "solo")
