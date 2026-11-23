"""Restore a portable portal snapshot, with original-byte integrity verification."""
import hashlib
import json
import zipfile

from django.core import serializers
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.auth.models import PortalAccount, PortalLiveBoard, PortalCollection, PortalRecord, PortalFileContent, PortalFileChunk, PortalFile
from apps.documents.models import EvidenceDocument
from apps.auth.models import RepositoryAccessAssignment, RepositoryAccessAudit, RepositoryAreaDefinition, RepositoryEntry, RepositoryClock, RepositoryChange, RepositoryOperation


class Command(BaseCommand):
    help = "Restore a developer's portable portal ZIP into a fresh MySQL database."

    def add_arguments(self, parser):
        parser.add_argument("bundle")
        parser.add_argument("--replace", action="store_true", help="Explicitly replace existing portal records, accounts, and files.")

    def handle(self, *args, **options):
        models = [PortalAccount, PortalLiveBoard, EvidenceDocument, PortalCollection, PortalRecord, PortalFileContent, PortalFile, RepositoryClock, RepositoryEntry, RepositoryAccessAssignment, RepositoryAccessAudit, RepositoryAreaDefinition]
        if not options["replace"] and any(model.objects.exists() for model in models if model != RepositoryAreaDefinition):
            raise CommandError("Portal data already exists. Restore into a fresh database, or use --replace to replace it explicitly.")
        with zipfile.ZipFile(options["bundle"]) as bundle:
            manifest = json.loads(bundle.read("manifest.json"))
            if manifest.get("format") != "accrevia-portal" or manifest.get("version") != 1:
                raise CommandError("Unsupported portal bundle.")
            records = {}
            for model in models:
                filename = "records/" + model._meta.model_name + ".json"
                if filename not in bundle.namelist() and model in {RepositoryClock, RepositoryEntry, RepositoryAccessAssignment, RepositoryAccessAudit, RepositoryAreaDefinition}:
                    records[model] = []
                    continue
                rows = list(serializers.deserialize("json", bundle.read(filename)))
                if any(row.object._meta.label_lower != model._meta.label_lower for row in rows):
                    raise CommandError("Unexpected record type in bundle.")
                records[model] = rows
            # Verify all bytes before changing the destination database.
            for row in records[PortalFileContent]:
                digest = hashlib.sha256()
                size = 0
                with bundle.open("originals/" + row.object.pk) as stream:
                    for data in iter(lambda: stream.read(1024 * 1024), b""):
                        digest.update(data)
                        size += len(data)
                if size != row.object.size_bytes or digest.hexdigest() != row.object.pk:
                    raise CommandError("Original file integrity check failed: " + row.object.pk)
            with transaction.atomic():
                if options["replace"]:
                    for model in [RepositoryAccessAssignment, RepositoryAccessAudit, RepositoryAreaDefinition, RepositoryChange, RepositoryOperation, RepositoryEntry, RepositoryClock, PortalFile, PortalFileChunk, PortalFileContent, PortalRecord, PortalCollection, EvidenceDocument, PortalLiveBoard, PortalAccount]:
                        if model == RepositoryAreaDefinition and not records[model]:
                            continue
                        model.objects.all().delete()
                for model in models:
                    for row in records[model]:
                        row.save()
                for row in records[PortalFileContent]:
                    with bundle.open("originals/" + row.object.pk) as stream:
                        batch = []
                        for position, data in enumerate(iter(lambda: stream.read(1024 * 1024), b"")):
                            batch.append(PortalFileChunk(content_id=row.object.pk, position=position, data=data))
                            if len(batch) == 4:
                                PortalFileChunk.objects.bulk_create(batch)
                                batch = []
                        if batch:
                            PortalFileChunk.objects.bulk_create(batch)
        self.stdout.write(self.style.SUCCESS("Restored portal records, accounts, and exact original files. Start the API, then refresh the frontend."))
