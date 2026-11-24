"""One authoritative record per folder/document; ordered commit log for live readers."""
from __future__ import annotations

import logging
import re
from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import RepositoryClock, RepositoryEntry, RepositoryChange, RepositoryOperation, PortalFile
from .workspace_storage import workspace_records, workspace_source, workspace_database

log = logging.getLogger(__name__)
FRAMEWORKS = {'ia', 'pa', 'copc', 'pqa', 'iso'}
CAMPUSES = ('tandag', 'cantilan', 'cagwait', 'san-miguel', 'lianga', 'tagbina', 'bislig')
ROOTS = {f'folder-{key}' for key in FRAMEWORKS}
MANAGERS = {'Superadmin', 'Administrator', 'QA Personnel'}


class VersionConflict(Exception):
    pass


def campus_id(value):
    text = str(value or '').strip().lower().replace(' ', '-')
    if text in CAMPUSES:
        return text
    matches = [key for key in CAMPUSES if key in text]
    if len(matches) == 1:
        return matches[0]
    if 'main-campus' in text:
        return 'tandag'
    return ''


def campuses_for(account):
    if account.role in {'Faculty', 'Staff'}:
        from .repository_access import assignments_for
        assigned = {key[0] for key, level in assignments_for(account).items() if level in {'viewer', 'editor'}}
        own = campus_id(account.campus_id)
        return assigned | ({own} if own else set())
    if account.role == 'Superadmin' or not account.campus_id:
        return set(CAMPUSES)
    campus = campus_id(account.campus_id)
    return {campus} if campus else set()


def record_origin(data):
    return data.get('sourceModule') or ('upload-documents' if data.get('libraryOnly') else 'accreditation')


def infer_campus(data, folders):
    if data.get('id') in ROOTS:
        return '*'
    explicit = data.get('campusId') or data.get('campus')
    if explicit:
        return campus_id(explicit)
    seen = set()
    parent = data.get('folderId') or data.get('parentId')
    while parent and parent not in seen:
        seen.add(parent)
        item = folders.get(parent, {})
        explicit = item.get('campusId') or item.get('campus')
        if explicit:
            return campus_id(explicit)
        parent = item.get('parentId')
    if data.get('isSystem') and (data.get('id') in ROOTS or str(data.get('id', '')).startswith(('folder-pa-', 'folder-copc-'))):
        return '*'
    return ''


def record(entry):
    return {**entry.data, 'id': entry.record_id, 'sourceModule': entry.origin,
            'libraryOnly': entry.origin == 'upload-documents', 'syncVersion': entry.version,
            'campusId': '*' if entry.kind == 'folder' and entry.record_id in ROOTS else entry.campus,
            **({'syncIssue': 'ambiguous-campus'} if not entry.campus else {})}


def may_read(account, data, kind='document'):
    campus = data.get('campusId') or ''
    if campus not in campuses_for(account) and campus != '*' and not (not campus and account.role == 'Superadmin'):
        return False
    if account.role in MANAGERS:
        return True
    from .repository_access import effective_level
    level = effective_level(account, data)
    if level is not None:
        return level in {'viewer', 'editor'}
    if kind == 'folder':
        return False  # Non-managers receive only ancestors of their authorized files.
    if data.get('confidentiality', '').lower() == 'public' or data.get('uploadedBy') in {account.pk, account.email}:
        return True
    if not hasattr(account, '_repository_grants'):
        from .live import snapshot_for
        from .models import PortalRecord
        from datetime import date
        grants = snapshot_for(account.role, account.pk, account.email).get('fileGrants') or []
        allowed = {item['documentId'] for item in grants if item.get('canView') and item.get('documentId')}
        shares = PortalRecord.objects.using(workspace_database()).filter(collection_id=str(workspace_source()) + '/shares').values_list('data', flat=True)
        for share in shares:
            if not isinstance(share, dict) or not share.get('canView') or share.get('revokedAt'):
                continue
            if share.get('expiresAt') and share['expiresAt'][:10] < date.today().isoformat():
                continue
            if (share.get('recipientType') == 'user' and share.get('recipientId') == account.pk) or (share.get('recipientType') == 'role' and share.get('recipientRole') == account.role):
                allowed.add(share.get('documentId'))
        account._repository_grants = allowed
    return data['id'] in account._repository_grants


def may_write(account, campus, origin, data=None):
    if account.role in {'Faculty', 'Staff'}:
        from .repository_access import require_editor
        if origin != 'accreditation' or not data:
            raise PermissionDenied('Editor access to an accreditation area is required.')
        require_editor(account, {**data, 'campusId': campus})
        return
    if account.role not in {'Superadmin', 'Administrator'}:
        raise PermissionDenied('Repository management permission is required.')
    feature = 'upload_evidence' if origin == 'upload-documents' else None
    if feature and account.allowed_features and feature not in account.allowed_features:
        raise PermissionDenied('Upload Documents permission is required.')
    if campus == '*' and account.role == 'Superadmin':
        return
    if campus not in campuses_for(account):
        raise PermissionDenied('This campus is not assigned to your account.')


def snapshot(account):
    account.__dict__.pop('_area_assignments', None)
    # The clock lock makes the snapshot and cursor consistent with every writer.
    with transaction.atomic():
        clock, _ = RepositoryClock.objects.get_or_create(pk=1)
        clock = RepositoryClock.objects.select_for_update().get(pk=1)
        scope = Q(campus__in=campuses_for(account)) | Q(campus='*') | Q(kind='folder',record_id__in=ROOTS)
        if account.role == 'Superadmin':
            scope |= Q(campus='')
        rows = list(RepositoryEntry.objects.filter(scope,deleted=False))
        docs = [record(row) for row in rows if row.kind == 'document' and may_read(account, record(row))]
        visible = {doc.get('folderId') for doc in docs}
        folders = {row.record_id: row for row in rows if row.kind == 'folder'}
        for folder_id in list(visible):
            seen = set()
            while folder_id in folders and folder_id not in seen:
                seen.add(folder_id)
                parent = folders[folder_id].parent_id
                visible.add(parent)
                folder_id = parent
        from .repository_access import access_snapshot
        return {'revision': clock.revision, 'folders': [record(row) for row in folders.values()
                if may_read(account, record(row), 'folder') or row.record_id in visible], 'documents': docs,
                'access': access_snapshot(account)}


def emit(entry, before=None):
    clock = RepositoryClock.objects.select_for_update().get(pk=1)
    clock.revision += 1
    clock.save(update_fields=['revision'])
    RepositoryChange.objects.create(revision=clock.revision, kind=entry.kind, record_id=entry.record_id,
                                    before=before, after=None if entry.deleted else record(entry))
    revision = clock.revision
    transaction.on_commit(lambda: notify_revision(revision))
    return clock.revision


def notify_revision(revision):
    from redis import Redis
    from django.conf import settings
    try:
        client = Redis.from_url(settings.CELERY_BROKER_URL,socket_connect_timeout=1,socket_timeout=1)
        try:
            client.publish('accrevia.repository.committed',str(revision))
        finally:
            client.close()
    except Exception:
        log.warning('Repository commit notification unavailable; durable event replay will recover revision %s',revision,exc_info=True)


def changes(account, since):
    result = []
    rows = list(RepositoryChange.objects.filter(revision__gt=since).order_by('revision')[:200])
    allowed_folders = {folder['id'] for folder in snapshot(account)['folders']} if rows and account.role not in MANAGERS else set()
    for event in rows:
        if event.kind == 'access':
            if event.record_id == account.pk or account.role == 'Superadmin':
                result.append({'revision': event.revision, 'kind': 'access', 'id': event.record_id, 'data': None})
            continue
        after = event.after
        if after and (may_read(account, after, event.kind) or event.kind == 'folder' and event.record_id in allowed_folders):
            result.append({'revision': event.revision, 'kind': event.kind, 'id': event.record_id, 'data': after})
        elif event.before and may_read(account, event.before, event.kind):
            result.append({'revision': event.revision, 'kind': event.kind, 'id': event.record_id, 'data': None})
    return {'revision': rows[-1].revision if rows else since, 'events': result}


@transaction.atomic
def mutate(account, operation_id, operations, context):
    account.__dict__.pop('_area_assignments', None)
    if context not in {'accreditation', 'upload-documents'} or not re.fullmatch(r'[\w-]{8,64}', operation_id or ''):
        raise ValidationError('An operation ID and valid origin context are required.')
    RepositoryClock.objects.get_or_create(pk=1)
    RepositoryClock.objects.select_for_update().get(pk=1)
    previous = RepositoryOperation.objects.filter(pk=operation_id).first()
    if previous:
        if previous.account_id != account.pk:
            raise PermissionDenied('Operation belongs to another account.')
        for event in previous.result.get('events', []):
            entry = RepositoryEntry.objects.filter(kind=event['kind'], record_id=event['id']).first()
            if entry:
                may_write(account, entry.campus, entry.origin, record(entry))
        return previous.result
    if not isinstance(operations, list) or not 1 <= len(operations) <= 500:
        raise ValidationError('Send between 1 and 500 record operations.')
    output = []
    for op in operations:
        kind, identity = op.get('kind'), str(op.get('id', ''))
        if kind not in {'folder', 'document'} or not identity or len(identity) > 190:
            raise ValidationError('Invalid record identity.')
        if kind == 'document' and identity in ROOTS:
            raise ValidationError('This identity is reserved for an evidence root folder.')
        entry = RepositoryEntry.objects.filter(kind=kind, record_id=identity).first()
        if int(op.get('expectedVersion', 0)) != (entry.version if entry else 0):
            raise VersionConflict(f'{kind} {identity} changed in another session. Your operation was not applied.')
        before = record(entry) if entry and not entry.deleted else None
        if entry and entry.origin != context:
            raise PermissionDenied('Source-owned records are read-only outside their originating module.')
        framework = entry.framework if entry else (op.get('data') or {}).get('frameworkId')
        if context == 'accreditation' and account.allowed_features and f'framework_{framework}' not in account.allowed_features:
            raise PermissionDenied('This accreditation framework is not enabled for your account.')
        data = op.get('data')
        if data is None:
            if not entry or entry.deleted:
                raise ValidationError('Record no longer exists.')
            may_write(account, entry.campus, context, record(entry))
            if kind == 'folder':
                if identity in ROOTS or entry.data.get('isSystem'):
                    raise PermissionDenied('Evidence root folders cannot be deleted.')
                if RepositoryEntry.objects.filter(parent_id=identity, deleted=False).exists():
                    raise ValidationError('Delete or move the contents before deleting this folder.')
            entry.deleted = True
        else:
            if not isinstance(data, dict) or data.get('frameworkId') not in FRAMEWORKS:
                raise ValidationError('A supported evidence framework is required.')
            parent_id = str(data.get('parentId') if kind == 'folder' else data.get('folderId') or '')
            parent_id = '' if parent_id == 'None' else parent_id
            parent = RepositoryEntry.objects.filter(kind='folder', record_id=parent_id, deleted=False).first() if parent_id else None
            if parent_id and not parent:
                raise ValidationError('Parent folder does not exist. Save the parent first.')
            campus = campus_id(data.get('campusId') or data.get('campus')) or (parent.campus if parent and parent.campus != '*' else '')
            if identity in ROOTS:
                campus = '*'
            candidate = {**data, 'campusId': campus, 'sourceModule': context, 'libraryOnly': context == 'upload-documents'}
            may_write(account, campus, context, candidate)
            if entry:
                may_write(account, entry.campus, context, record(entry))
            if entry and kind == 'folder' and (entry.campus != campus or entry.framework != data['frameworkId']) and RepositoryEntry.objects.filter(parent_id=identity,deleted=False).exists():
                raise ValidationError('A folder with contents cannot be reassigned to another campus or framework.')
            if parent and (parent.framework != data['frameworkId'] or parent.record_id not in ROOTS and parent.campus not in {campus, '*'}):
                raise ValidationError('Parent must belong to the same framework and campus.')
            if context == 'accreditation' and parent and parent.origin == 'upload-documents':
                raise ValidationError('Accreditation records cannot be placed in an independent upload folder.')
            cursor, seen = parent, {identity}
            while cursor:
                if cursor.record_id in seen:
                    raise ValidationError('A folder cannot contain itself or an ancestor.')
                seen.add(cursor.record_id)
                cursor = RepositoryEntry.objects.filter(kind='folder', record_id=cursor.parent_id, deleted=False).first() if cursor.parent_id else None
            if not entry:
                entry = RepositoryEntry(kind=kind, record_id=identity, origin=context)
            data = {key: value for key, value in data.items() if key not in {'syncVersion', 'syncIssue'}}
            if data.get('fileRef'):
                staged = PortalFile.objects.select_related('content').filter(source='repository-stage',key=data['fileRef']).first()
                if not staged or ((not entry or data['fileRef'] != entry.data.get('fileRef')) and not str(data['fileRef']).startswith(account.pk + ':')):
                    raise PermissionDenied('The staged file does not belong to this operation account.')
                if not entry.pk or data['fileRef'] != entry.data.get('fileRef'):
                    data['status'] = 'Processing'
                data.update(storageSha256=staged.content_id,fileVersion=staged.content_id,originalFileName=staged.name,mimeType=staged.mime_type,sizeBytes=staged.content.size_bytes)
            elif kind == 'document' and not entry.pk and not data.get('documentUrl') and not PortalFile.objects.filter(source='upload',key=identity).exists():
                raise ValidationError('Store the original file successfully before publishing its document record.')
            data.update(id=identity, sourceModule=context, libraryOnly=context == 'upload-documents', campusId=campus)
            entry.framework, entry.campus, entry.parent_id, entry.data = data['frameworkId'], campus, parent_id, data
            entry.deleted = False
        if before is not None or entry.pk:
            entry.version += 1
        entry.save()
        revision = emit(entry, before)
        from .repository_access import audit_resource
        audit_resource(account, before, None if entry.deleted else record(entry), kind, identity)
        output.append({'revision': revision, 'kind': kind, 'id': identity, 'data': None if entry.deleted else record(entry)})
        if kind == 'document':
            from django.utils import timezone
            from .models import RepositoryIndexDelivery
            RepositoryIndexDelivery.objects.update_or_create(record_id=identity, defaults={'target_version':entry.version, 'next_attempt':timezone.now(), 'last_error':''})
            from .repository_index import schedule_index
            transaction.on_commit(lambda identity=identity: schedule_index(identity))
    result = {'revision': RepositoryClock.objects.get(pk=1).revision, 'events': output}
    RepositoryOperation.objects.create(id=operation_id, account_id=account.pk, result=result)
    return result


def reconcile(apply=False):
    stored = workspace_records()
    folders = {item['id']: item for item in stored.get('folders', []) if item.get('id')}
    report = {'created': 0, 'existing': 0, 'conflicts': [], 'hierarchy_conflicts': [], 'root_scope_repairs': [], 'files_missing': [], 'source': workspace_source()}
    for item in folders.values():
        parent = item.get('parentId')
        if parent and parent not in folders:
            report['hierarchy_conflicts'].append({'id':item['id'],'parentId':parent,'reason':'parent is not present in selected source; original preserved'})
    with transaction.atomic():
        if apply:
            RepositoryClock.objects.get_or_create(pk=1)
            RepositoryClock.objects.select_for_update().get(pk=1)
        for kind, values in [('folder', list(folders.values())), ('document', stored.get('documents', []))]:
            for item in values:
                identity, framework = item.get('id'), item.get('frameworkId')
                if not identity or framework not in FRAMEWORKS:
                    report['conflicts'].append({'id': identity, 'reason': 'missing identity or supported framework'})
                    continue
                if item.get('status') == 'Archived' or item.get('deleted') is True:
                    report['conflicts'].append({'id': identity, 'reason': 'archived or deleted source record; original preserved'})
                    continue
                campus = infer_campus(item, folders)
                if not campus and identity not in ROOTS:
                    report['conflicts'].append({'id': identity, 'reason': 'ambiguous campus; original preserved'})
                    continue
                if kind == 'folder':
                    parent_id = item.get('parentId') or ''
                    if parent_id and parent_id not in folders:
                        report['hierarchy_conflicts'].append({'id': identity, 'parentId': parent_id, 'reason': 'parent is not present in selected source; original preserved'})
                        continue
                existing = RepositoryEntry.objects.filter(kind=kind, record_id=identity).first()
                if existing:
                    if kind == 'folder' and identity in ROOTS and existing.campus != '*':
                        report['root_scope_repairs'].append(identity)
                        if apply:
                            before=record(existing)
                            existing.campus='*'
                            existing.version+=1
                            existing.save()
                            emit(existing,before)
                    report['existing'] += 1
                    continue
                data = {**item, 'sourceModule': record_origin(item)}
                if kind == 'document':
                    file = PortalFile.objects.using(workspace_database()).filter(source=workspace_source(), key=identity).first()
                    if not file and str(item.get('documentUrl', '')).startswith('/certificates/'):
                        file = PortalFile.objects.using(workspace_database()).filter(source='catalog', key=item['documentUrl'].lstrip('/')).first()
                    if not file:
                        report['files_missing'].append(identity)
                        continue
                    if not file.content.chunks.using(workspace_database()).exists():
                        report['files_missing'].append(identity)
                        continue
                    data['storageSha256'] = file.content_id
                    data['fileVersion'] = file.content_id
                    parent_id = item.get('folderId') or ''
                    if parent_id and parent_id not in folders:
                        report['hierarchy_conflicts'].append({'id': identity, 'parentId': parent_id, 'reason': 'parent folder is not present in selected source; original preserved'})
                        continue
                report['created'] += 1
                if apply:
                    entry = RepositoryEntry.objects.create(kind=kind, record_id=identity, origin=record_origin(item), framework=framework,
                        campus=campus, parent_id=item.get('parentId' if kind == 'folder' else 'folderId') or '', data=data)
                    emit(entry)
    return report
