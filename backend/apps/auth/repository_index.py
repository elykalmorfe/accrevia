"""Reuse the existing OCR/embedding pipeline and publish its actual status."""
import logging
from pathlib import Path
from celery import shared_task
from django.conf import settings
from django.db import transaction, OperationalError
from .models import RepositoryEntry, RepositoryClock, PortalFile, RepositoryIndexDelivery
from django.utils import timezone
from datetime import timedelta

log = logging.getLogger(__name__)


def schedule_index(identity):
    entry = RepositoryEntry.objects.filter(kind='document',record_id=identity).first()
    if not entry:
        return
    RepositoryIndexDelivery.objects.get_or_create(record_id=identity, defaults={'target_version':entry.version,'next_attempt':timezone.now()})
    dispatch_due_index_jobs([identity])


def dispatch_due_index_jobs(identities=None):
    try:
        _dispatch_due_index_jobs(identities)
    except OperationalError as exc:
        if exc.args and exc.args[0] in {1205, 1213}:
            log.warning('Index delivery lock contention; the durable queue will retry on the next pass.')
            return
        raise


def _dispatch_due_index_jobs(identities=None):
    due = RepositoryIndexDelivery.objects.filter(next_attempt__lte=timezone.now())
    if identities is not None:
        due = due.filter(record_id__in=identities)
    if not due.exists():
        return
    with transaction.atomic():
        # Use the same clock -> delivery lock order as repository mutations.
        RepositoryClock.objects.select_for_update().get(pk=1)
        jobs = RepositoryIndexDelivery.objects.select_for_update().filter(next_attempt__lte=timezone.now())
        if identities is not None:
            jobs = jobs.filter(record_id__in=identities)
        for job in jobs.order_by('next_attempt')[:10]:
            job.attempts += 1
            job.next_attempt = timezone.now() + timedelta(minutes=10)
            try:
                synchronize_index.delay(job.record_id)
                job.last_error = ''
            except Exception as exc:
                job.next_attempt = timezone.now() + timedelta(seconds=10)
                job.last_error = str(exc)[:1000]
                log.exception('Repository index delivery failed for %s; durable job retained',job.record_id)
            job.save()


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=5, acks_late=True, reject_on_worker_lost=True)
def synchronize_index(self, identity):
    job = RepositoryIndexDelivery.objects.filter(pk=identity).first()
    version = job.target_version if job else None
    try:
        result = _synchronize_index(identity)
        if version is not None:
            RepositoryIndexDelivery.objects.filter(pk=identity,target_version=version).delete()
        return result
    except Exception as exc:
        RepositoryIndexDelivery.objects.filter(pk=identity).update(next_attempt=timezone.now()+timedelta(seconds=10),last_error=str(exc)[:1000])
        raise


def _synchronize_index(identity):
    from apps.documents.models import EvidenceDocument
    from apps.ingestion.services.indexer import get_qdrant
    from qdrant_client.http import models as qm
    entry = RepositoryEntry.objects.filter(kind='document', record_id=identity).first()
    if not entry:
        return
    if entry.deleted:
        client = get_qdrant()
        if client.collection_exists(settings.QDRANT_COLLECTION):
            client.delete(settings.QDRANT_COLLECTION, qm.FilterSelector(filter=qm.Filter(must=[qm.FieldCondition(key='document_id', match=qm.MatchValue(value=identity))])), wait=True)
        EvidenceDocument.objects.filter(pk=identity).update(status='Archived')
        return
    data = entry.data
    doc = EvidenceDocument.objects.filter(pk=identity).first()
    file = PortalFile.objects.select_related('content').filter(source='repository-stage', key=data.get('fileRef', '')).first()
    fields = {key: data.get(name) or '' for key, name in {'title':'title', 'description':'description', 'framework_id':'frameworkId', 'campus_id':'campusId', 'campus':'campus', 'folder_id':'folderId', 'area_id':'areaId', 'doc_type':'docType', 'academic_year':'academicYear', 'program':'program', 'confidentiality':'confidentiality', 'uploaded_by':'uploadedBy'}.items()}
    if not doc and not file:
        from .repository import record,emit
        with transaction.atomic():
            RepositoryClock.objects.select_for_update().get(pk=1)
            entry=RepositoryEntry.objects.get(pk=entry.pk)
            before=record(entry)
            entry.data={**entry.data,'status':'Failed','errorMessage':'The original file is not stored. Upload the exact original to index this document.'}
            entry.version+=1
            entry.save()
            emit(entry,before)
        return
    if not doc:
        doc = EvidenceDocument(id=identity, storage_path='', **fields)
    else:
        for key, value in fields.items():
            setattr(doc, key, value)
    sha = file.content_id if file else data.get('storageSha256')
    unchanged = doc.status == 'Indexed' and (doc.progress.get('repository_sha') == sha or Path(doc.storage_path).stem == sha)
    if unchanged:
        client = get_qdrant()
        unchanged = client.collection_exists(settings.QDRANT_COLLECTION) and client.count(settings.QDRANT_COLLECTION,
            count_filter=qm.Filter(must=[qm.FieldCondition(key='document_id', match=qm.MatchValue(value=identity))]), exact=True).count == doc.chunk_count and doc.chunk_count > 0
    if unchanged:
        doc.progress = {**doc.progress, 'repository_sha': sha}
        doc.save()
        client = get_qdrant()
        if client.collection_exists(settings.QDRANT_COLLECTION):
            from apps.ingestion.services.indexer import document_payload
            payload = document_payload(doc, '', '', 0)
            for key in ('text','sequence','chunk_id'):
                payload.pop(key, None)
            client.set_payload(settings.QDRANT_COLLECTION, payload, qm.Filter(must=[qm.FieldCondition(key='document_id', match=qm.MatchValue(value=identity))]), wait=True)
        return
    if file:
        suffix = Path(file.name).suffix.lower() or '.bin'
        path = Path(settings.MEDIA_ROOT) / 'uploads/repository' / (sha + suffix)
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            partial = path.with_suffix(path.suffix + '.partial')
            with partial.open('wb') as output:
                for content in file.content.chunks.order_by('position').values_list('data', flat=True).iterator(chunk_size=4):
                    output.write(bytes(content))
            partial.replace(path)
        doc.storage_path = path.relative_to(settings.MEDIA_ROOT).as_posix()
        doc.original_file_name, doc.mime_type, doc.size_bytes = file.name, file.mime_type, file.content.size_bytes
    doc.status = 'Processing'
    doc.progress = {**doc.progress, 'repository_sha': sha}
    doc.save()
    from apps.ingestion.tasks import ingest_document
    ingest_document(identity)


def publish_index_status(sender, instance, **kwargs):
    """The entry already exists for new committed uploads; seed jobs need no mirror writes."""
    from .repository import record, emit
    try:
        with transaction.atomic():
            if not RepositoryEntry.objects.filter(kind='document', record_id=str(instance.pk), deleted=False).exists():
                return
            RepositoryClock.objects.get_or_create(pk=1)
            RepositoryClock.objects.select_for_update().get(pk=1)
            entry = RepositoryEntry.objects.get(kind='document', record_id=str(instance.pk), deleted=False)
            expected_sha = entry.data.get('storageSha256')
            if expected_sha and Path(instance.storage_path).stem != expected_sha and instance.progress.get('repository_sha') != expected_sha:
                return  # A newer replacement owns this record; stale worker results must not mark it indexed.
            patch = {'status': instance.status, 'passages': instance.passages, 'indexedAt': instance.indexed_at.isoformat() if instance.indexed_at else None}
            if all(entry.data.get(key) == value for key, value in patch.items()):
                return
            before = record(entry)
            entry.data = {**entry.data, **patch}
            entry.version += 1
            entry.save()
            emit(entry, before)
    except (RepositoryEntry.DoesNotExist,):
        return
