"""Exact, database-backed area assignments. No grant is inferred from document ownership."""
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import (PortalAccount, PortalRecord, RepositoryAccessAssignment, RepositoryAccessAudit,
                     RepositoryAreaDefinition, RepositoryClock, RepositoryChange, RepositoryEntry)
from .workspace_storage import workspace_source, workspace_database

PROTECTED = {'ia', 'pa', 'pqa'}
MEMBER_ROLES = {'Faculty', 'Staff'}


def programs():
    return [row for row in PortalRecord.objects.using(workspace_database()).filter(
        collection_id=str(workspace_source()) + '/programAccreditations').values_list('data', flat=True) if isinstance(row, dict)]


def validate_scope(data):
    from .repository import campus_id
    campus = campus_id(data.get('campus'))
    framework, area, program = str(data.get('framework') or ''), str(data.get('area') or '').lower(), str(data.get('program') or '')
    if not campus or framework not in PROTECTED:
        raise ValidationError('Choose a campus and an official IA, AACCUP, or PQA area.')
    if framework == 'pa':
        match = next((p for p in programs() if p.get('id') == program and p.get('campusId') == campus), None)
        req = next((r for r in (match or {}).get('requirements', []) if str(r.get('id', '')).lower() == area), None)
        if not req or not RepositoryAreaDefinition.objects.filter(framework='pa', code=str(req.get('areaCode', '')).lower()).exists():
            raise ValidationError('This official survey area does not belong to the selected campus and program.')
    elif program or not RepositoryAreaDefinition.objects.filter(framework=framework, code=area).exists():
        raise ValidationError('Invalid official area or category.')
    return {'campus': campus, 'framework': framework, 'area': area, 'program': program}


def resource_scope(data, parent=None):
    """Resolve inheritance through canonical parents, never a client supplied permission."""
    framework = data.get('frameworkId') or (parent.framework if parent else '')
    campus = data.get('campusId') or (parent.campus if parent else '')
    area = str(data.get('areaId') or '').lower()
    program = str(data.get('programId') or '')
    if framework == 'pa' and area:
        for item in programs():
            if item.get('campusId') == campus and any(str(r.get('id', '')).lower() == area for r in item.get('requirements', [])):
                program = item['id']
                break
    if not parent:
        identity = data.get('parentId') or data.get('folderId')
        parent = RepositoryEntry.objects.filter(kind='folder', record_id=identity, deleted=False).first() if identity else None
    seen = set()
    while parent and parent.record_id not in seen:
        seen.add(parent.record_id)
        if parent.data.get('areaId'):
            inherited = resource_scope({**parent.data, 'campusId': parent.campus, 'frameworkId': parent.framework})
            if area and (area != inherited['area'] or program and program != inherited['program']):
                raise ValidationError('The resource area must match its parent folder.')
            area, program = inherited['area'], inherited['program']
            break
        parent = RepositoryEntry.objects.filter(kind='folder', record_id=parent.parent_id, deleted=False).first() if parent.parent_id else None
    return {'campus': campus, 'framework': framework, 'area': area, 'program': program}


def assignments_for(account):
    if not hasattr(account, '_area_assignments'):
        account._area_assignments = {(a.campus, a.framework, a.area, a.program): a.level
                                    for a in RepositoryAccessAssignment.objects.filter(user=account)}
    return account._area_assignments


def effective_level(account, data):
    if account.role not in MEMBER_ROLES or data.get('frameworkId') not in PROTECTED:
        return None
    # Upload Documents has independent records, even when its areaId happens to match.
    if data.get('sourceModule') == 'upload-documents' or data.get('libraryOnly'):
        return 'none'
    grants = assignments_for(account)
    candidates = [(key, level) for key, level in grants.items() if key[0] == data.get('campusId') and key[1] == data.get('frameworkId') and level != 'none']
    if not candidates:
        return 'none'
    if data.get('areaId') and not any(key[2] == str(data['areaId']).lower() for key, _ in candidates):
        return 'none'
    try:
        scope = resource_scope(data)
    except ValidationError:
        return 'none'
    return grants.get(tuple(scope[k] for k in ('campus', 'framework', 'area', 'program')), 'none')


def require_editor(account, data):
    scope = resource_scope(data)
    if effective_level(account, data) != 'editor':
        raise PermissionDenied('Editor access to this exact campus, program, and area is required.')
    validate_scope(scope)
    return scope


def access_snapshot(account):
    return {'assignments': [{'campus': a.campus, 'framework': a.framework, 'area': a.area, 'program': a.program, 'level': a.level}
                            for a in RepositoryAccessAssignment.objects.filter(user=account)],
            'officialAreas': list(RepositoryAreaDefinition.objects.order_by('framework', 'position').values('framework', 'code', 'name', 'position'))}


@transaction.atomic
def save_assignments(actor, scope, updates, expected):
    from .repository import notify_revision, VersionConflict
    if actor.role != 'Superadmin':
        raise PermissionDenied('Only the Super Admin can manage area assignments.')
    scope = validate_scope(scope)
    RepositoryClock.objects.get_or_create(pk=1)
    clock = RepositoryClock.objects.select_for_update().get(pk=1)
    current = list(RepositoryAccessAssignment.objects.filter(**scope).order_by('user_id').values('user_id', 'level', 'updated_at'))
    token = scope_token(current)
    if expected != token:
        raise VersionConflict('These assignments changed in another session. Reload the assignments before saving.')
    if not isinstance(updates, list) or not 1 <= len(updates) <= 1000:
        raise ValidationError('Select at least one faculty/staff member.')
    seen = set()
    for item in updates:
        user = PortalAccount.objects.filter(pk=item.get('userId'), role__in=MEMBER_ROLES, approval_status='approved', portal_status='Active').first()
        if not user or user.pk in seen or item.get('level') not in {'none', 'viewer', 'editor'}:
            raise ValidationError('Select distinct, active faculty/staff and valid access levels.')
        seen.add(user.pk)
        old = RepositoryAccessAssignment.objects.filter(user=user, **scope).first()
        if old and old.level == item['level']:
            continue
        RepositoryAccessAssignment.objects.update_or_create(user=user, **scope, defaults={'level': item['level'], 'updated_by': actor.pk})
        RepositoryAccessAudit.objects.create(actor_id=actor.pk, actor_role=actor.role, user_id=user.pk, **scope,
            action='revoked' if item['level'] == 'none' else 'assigned' if not old else 'permission_changed',
            previous_level=old.level if old else 'none', level=item['level'])
        clock.revision += 1
        RepositoryChange.objects.create(revision=clock.revision, kind='access', record_id=user.pk, before=None, after=None)
    clock.save(update_fields=['revision'])
    transaction.on_commit(lambda: notify_revision(clock.revision))
    return {'saved': True, 'revision': clock.revision}


def scope_token(rows):
    import hashlib
    return hashlib.sha256(str(rows).encode()).hexdigest()


def audit_resource(actor, before, after, kind, identity):
    data = after or before or {}
    scope = resource_scope(data)
    if scope['framework'] not in PROTECTED:
        return
    action = 'deleted' if after is None else 'folder_created' if before is None and kind == 'folder' else 'file_uploaded' if before is None else 'edited'
    if before and after:
        if before.get('parentId') != after.get('parentId') or before.get('folderId') != after.get('folderId'):
            action = 'moved'
        elif before.get('fileVersion') != after.get('fileVersion'):
            action = 'replaced'
        elif before.get('name') != after.get('name') or before.get('title') != after.get('title'):
            action = 'renamed'
    RepositoryAccessAudit.objects.create(actor_id=actor.pk, actor_role=actor.role, action=action, resource_id=identity,
        **scope, previous=before, updated=after)
