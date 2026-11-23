"""Export records, accounts, and deduplicated original bytes for another developer."""
import hashlib
import json
import zipfile
from pathlib import Path

from django.core import serializers
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.auth.models import PortalAccount, PortalLiveBoard, PortalCollection, PortalRecord, PortalFileContent, PortalFile
from apps.auth.portal_storage import store_collection
from apps.documents.models import EvidenceDocument
from apps.auth.models import RepositoryAccessAssignment, RepositoryAccessAudit, RepositoryAreaDefinition, RepositoryEntry, RepositoryClock


class Command(BaseCommand):
    help = "Export all portal data and original file bytes to a portable ZIP (includes account password hashes)."

    def add_arguments(self, parser):
        parser.add_argument("output")
        parser.add_argument("--overwrite", action="store_true", help="Atomically replace an existing exported bundle after verification.")
        parser.add_argument("--source", required=True, help="Browser source whose portal layout other developers should see.")

    def handle(self, *args, **options):
        source = options["source"]
        if not PortalCollection.objects.filter(pk=source + "/documents").exists():
            raise CommandError("Source has no saved document collection.")
        destination = Path(options["output"]).resolve()
        if destination.exists() and not options["overwrite"]:
            raise CommandError("Output already exists; choose a new filename.")
        destination.parent.mkdir(parents=True, exist_ok=True)
        partial = destination.with_name(destination.name + ".partial")
        if partial.exists():
            raise CommandError("A partial export already exists; choose a new filename.")
        models = [PortalAccount, PortalLiveBoard, EvidenceDocument, PortalCollection, PortalRecord, PortalFileContent, PortalFile, RepositoryClock, RepositoryEntry, RepositoryAccessAssignment, RepositoryAccessAudit, RepositoryAreaDefinition]
        counts = {}
        try:
            with transaction.atomic():
                store_collection("workspace", "config", {"source": source})
                with zipfile.ZipFile(partial, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=1, allowZip64=True) as bundle:
                    bundle.writestr("manifest.json", json.dumps({"format": "accrevia-portal", "version": 1, "source": source}))
                    for model in models:
                        rows = model.objects.order_by(model._meta.pk.name)
                        counts[model._meta.label_lower] = rows.count()
                        bundle.writestr("records/" + model._meta.model_name + ".json", serializers.serialize("json", rows.iterator()))
                    for content in PortalFileContent.objects.iterator():
                        digest = hashlib.sha256()
                        size = 0
                        with bundle.open("originals/" + content.pk, "w", force_zip64=True) as output:
                            for chunk in content.chunks.order_by("position").iterator(chunk_size=4):
                                data = bytes(chunk.data)
                                digest.update(data)
                                size += len(data)
                                output.write(data)
                        if size != content.size_bytes or digest.hexdigest() != content.pk:
                            raise CommandError("Stored original failed integrity verification: " + content.pk)
                    bundle.writestr("counts.json", json.dumps(counts))
            partial.replace(destination)
        except Exception:
            if partial.exists():
                partial.unlink()
            raise
        self.stdout.write(self.style.SUCCESS("Exported " + str(destination)))
        self.stdout.write(json.dumps(counts))
