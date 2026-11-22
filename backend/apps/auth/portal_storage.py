"""MySQL copies of portal records and original files for database inspection."""
from hashlib import sha256
from itertools import islice

from django.db import transaction
from django.utils import timezone

from .models import PortalCollection, PortalFile, PortalFileChunk, PortalFileContent, PortalRecord

FILE_CHUNK_SIZE = 1024 * 1024


@transaction.atomic
def store_collection(source, name, value):
    collection, _ = PortalCollection.objects.select_for_update().get_or_create(pk=f"{source}/{name}")
    records = []
    for position, item in enumerate(value if isinstance(value, list) else [value]):
        identity = item.get("id") if isinstance(item, dict) else None
        key = str(identity)[:190] if identity else f"@{position}"
        records.append(PortalRecord(collection=collection, record_key=key, position=position, data=item))

    existing = list(collection.records.order_by("position").values_list("record_key", "data"))
    if existing == [(row.record_key, row.data) for row in records]:
        return len(records)

    collection.records.all().delete()
    PortalRecord.objects.bulk_create(records, batch_size=200)
    collection.save(update_fields=["updated_at"])
    return len(records)


@transaction.atomic
def store_file(source, key, name, mime_type, stream):
    stream.seek(0)
    digest = sha256()
    size = 0
    for data in iter(lambda: stream.read(FILE_CHUNK_SIZE), b""):
        digest.update(data)
        size += len(data)

    content, created = PortalFileContent.objects.get_or_create(pk=digest.hexdigest(), defaults={"size_bytes": size})
    if created:
        stream.seek(0)
        chunks = (
            PortalFileChunk(content=content, position=position, data=data)
            for position, data in enumerate(iter(lambda: stream.read(FILE_CHUNK_SIZE), b""))
        )
        while batch := list(islice(chunks, 4)):
            PortalFileChunk.objects.bulk_create(batch)

    defaults = {"name": name, "mime_type": mime_type, "content": content}
    file, created = PortalFile.objects.select_for_update().get_or_create(source=source, key=key, defaults=defaults)
    if not created and (file.content_id, file.name, file.mime_type) != (content.pk, name, mime_type):
        PortalFile.objects.filter(pk=file.pk).update(**defaults, updated_at=timezone.now())
        file.refresh_from_db()
    return file
