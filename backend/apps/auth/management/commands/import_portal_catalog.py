import json
import mimetypes
import subprocess
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.auth.portal_storage import store_collection, store_file
from apps.auth.shared_files import open_shared_file
from apps.documents.models import EvidenceDocument


class Command(BaseCommand):
    help = "Copy the project catalog and available original files into the portal tables in MySQL."

    def handle(self, *args, **options):
        frontend = settings.BASE_DIR.parent / "frontend"
        try:
            result = subprocess.run(
                ["node", "scripts/export-portal-catalog.mjs"], cwd=frontend,
                check=True, capture_output=True, encoding="utf-8",
            )
            catalog = json.loads(result.stdout)
        except subprocess.CalledProcessError as exc:
            raise CommandError(exc.stderr.strip() or "Could not export the frontend catalog.") from exc
        except (OSError, ValueError) as exc:
            raise CommandError(f"Could not export the frontend catalog: {exc}") from exc

        for name, value in catalog.items():
            count = store_collection("catalog", name, value)
            self.stdout.write(f"{name}: {count} records")

        public = frontend / "public"
        for folder_name in ("certificates", "activities"):
            for path in sorted((public / folder_name).rglob("*")):
                if path.is_file():
                    self.import_file("catalog", path.relative_to(public).as_posix(), path)

        media = Path(settings.MEDIA_ROOT)
        documents = {document.storage_path: document for document in EvidenceDocument.objects.iterator()}
        for path in sorted((media / "uploads").rglob("*")):
            if path.is_file():
                relative = path.relative_to(media).as_posix()
                doc = documents.get(relative)
                if doc:
                    self.import_file("upload", doc.id, path, doc.original_file_name, doc.mime_type)
                else:
                    self.import_file("upload", relative, path)

        shared = media / "shared"
        if shared.is_dir():
            for directory in sorted(shared.iterdir()):
                found = open_shared_file(directory.name)
                if found:
                    path, meta = found
                    self.import_file("shared", directory.name, path, meta.get("name"), meta.get("type"))

    def import_file(self, source, key, path, name=None, content_type=None):
        with path.open("rb") as stream:
            store_file(source, key, name or path.name, content_type or mimetypes.guess_type(path)[0] or "", stream)
