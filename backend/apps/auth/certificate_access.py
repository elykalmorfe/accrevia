"""Certificate permissions share repository identities, transactions and durable live events."""
import hashlib
import json
from django.db import transaction
from .models import (CertificatePolicy, CertificateGrant, CertificateDefault, RepositoryEntry,
                     RepositoryClock, RepositoryChange, RepositoryAccessAudit, PortalAccount)
from .repository_access import resource_scope
from rest_framework.exceptions import PermissionDenied, ValidationError

LEVELS = {'none', 'viewer', 'download'}


def is_certificate(data):
    return str(data.get('docType', '')).lower() == 'certificate'


def permissions(account):
    if not hasattr(account, '_certificate_permissions'):
        account._certificate_permissions = {p.certificate_id: p for p in CertificatePolicy.objects.select_related('certificate').prefetch_related('grants')}
    return account._certificate_permissions


def rights(account, data, entry=None):
    from .repository import campus_id, campuses_for
    if account.role == 'Superadmin':
        return {'canView': True, 'canDownload': True, 'canManage': True, 'level': 'download'}
    campus = entry.campus if entry else data.get('campusId') or ''
    if account.role not in {'Faculty', 'Staff'}:
        if account.role in {'Administrator','QA Personnel'}:
            allowed=campus in campuses_for(account)
        else:
            from .repository import may_read
            allowed=may_read(account,{**data,'docType':'Other'})
        return {'canView': allowed, 'canDownload': allowed, 'canManage': False, 'level': 'download' if allowed else 'none'}
    if account.approval_status != 'approved' or account.portal_status != 'Active':
        return {'canView': False, 'canDownload': False, 'canManage': False, 'level': 'none'}
    from .repository import CAMPUSES
    if campus not in CAMPUSES:
        return {'canView': False, 'canDownload': False, 'canManage': False, 'level': 'none'}
    policy = permissions(account).get(entry.pk) if entry else next((p for p in permissions(account).values() if p.certificate.record_id == data.get('id')), None)
    level, cross = 'viewer', False  # Existing certificates start with the specified safe default.
    if policy:
        grant = next((g for g in policy.grants.all() if g.user_id == account.pk), None)
        if grant:
            level, cross = grant.level, grant.allow_cross_campus
        elif policy.general != 'inherit':
            level, cross = policy.general, policy.allow_cross_campus
        else:
            level, cross = policy.inherited_level, policy.inherited_cross_campus
    if not cross and campus_id(account.campus_id) != campus:
        level = 'none'
    return {'canView': level in {'viewer','download'}, 'canDownload': level == 'download', 'canManage': False, 'level': level}


def cross_campuses(account):
    if account.role not in {'Faculty', 'Staff'}:
        return set()
    allowed = set()
    for policy in permissions(account).values():
        if not policy.certificate.deleted and rights(account, policy.certificate.data, policy.certificate)['canView']:
            allowed.add(policy.certificate.campus)
    return allowed


def for_viewer(account, data):
    if not is_certificate(data):
        return data
    return {**data, **({'documentUrl':''} if account.role!='Superadmin' else {}), 'certificateProtected': True, 'certificateAccess': rights(account, data)}


def ancestors(entry):
    chain, seen = [], set()
    parent = entry.parent_id
    while parent and parent not in seen:
        seen.add(parent); chain.append(parent)
        row = RepositoryEntry.objects.filter(kind='folder',record_id=parent,deleted=False).first()
        parent = row.parent_id if row else ''
    return chain


def applicable_default(entry):
    scope = resource_scope({**entry.data, 'campusId':entry.campus})
    chain = ancestors(entry)
    matches = []
    for default in CertificateDefault.objects.all():
        if any(getattr(default,key) and getattr(default,key) != scope[key] for key in ('campus','framework','area','program')):
            continue
        if default.folder and default.folder not in chain:
            continue
        priority = (1000-chain.index(default.folder) if default.folder else 0, bool(default.area), bool(default.framework), bool(default.campus), bool(default.program))
        matches.append((priority, default))
    if not matches:
        return 'viewer', False, {'scope':'initial global default'}
    row = max(matches,key=lambda item:item[0])[1]
    return row.level, row.allow_cross_campus, {'id':row.pk, 'version':row.version, 'scope':{key:getattr(row,key) for key in ('campus','framework','area','program','folder')}}


def ensure_policy(entry):
    policy = CertificatePolicy.objects.filter(certificate=entry).first()
    if not policy:
        level, cross, source = applicable_default(entry)
        policy,_ = CertificatePolicy.objects.get_or_create(certificate=entry,defaults={'inherited_level':level,'inherited_cross_campus':cross,'inherited_from':source})
    return policy


def require_management(account, data, kind='document', before=None, entry=None):
    if account.role == 'Superadmin':
        return
    if kind == 'document' and (is_certificate(data or {}) or is_certificate(before or {})):
        raise PermissionDenied('Only the Super Admin may manage certificates.')
    if kind != 'folder' or not entry:
        return
    structural = data is None or any((data or {}).get(key) != (before or {}).get(key) for key in ('name','parentId','areaId','frameworkId','campusId'))
    if structural:
        folders = {row.record_id:row.parent_id for row in RepositoryEntry.objects.filter(kind='folder',deleted=False)}
        for doc in RepositoryEntry.objects.filter(kind='document',deleted=False,data__docType='Certificate'):
            parent, seen = doc.parent_id, set()
            while parent and parent not in seen:
                if parent == entry.record_id:
                    raise PermissionDenied('This folder contains a protected certificate. Only the Super Admin may rename, move, or delete it.')
                seen.add(parent); parent = folders.get(parent, '')


def audit(actor, entry, action, before=None, after=None, status='success'):
    data = entry.data if entry else {}
    scope = resource_scope({**data, 'campusId':entry.campus if entry else ''})
    RepositoryAccessAudit.objects.create(actor_id=actor.pk if actor else '', actor_role=actor.role if actor else 'Anonymous',
        action=action, resource_id=entry.record_id if entry else '', status=status, **scope, previous=before, updated=after)


def signal_access(identity):
    from .repository import notify_revision
    clock = RepositoryClock.objects.select_for_update().get(pk=1)
    clock.revision += 1; clock.save(update_fields=['revision'])
    RepositoryChange.objects.create(revision=clock.revision,kind='cert-access',record_id=identity,before=None,after=None)
    transaction.on_commit(lambda: notify_revision(clock.revision))


def selected_certificates(selection):
    from .repository import FRAMEWORKS, CAMPUSES
    rows = RepositoryEntry.objects.filter(kind='document',deleted=False,data__docType='Certificate')
    ids = selection.get('ids')
    if ids is not None:
        if not isinstance(ids,list) or not ids or len(ids)>10000:
            raise ValidationError('Select between one and 10,000 certificates.')
        rows=rows.filter(record_id__in=ids)
        if rows.count()!=len(set(ids)):
            raise ValidationError('Every selected record must be an existing certificate.')
    elif not selection.get('all') and not any(selection.get(k) for k in ('campus','framework','area','folder')):
        raise ValidationError('Choose certificates or an explicit bulk scope.')
    if selection.get('campus'):
        if selection['campus'] not in CAMPUSES: raise ValidationError('Invalid campus.')
        rows=rows.filter(campus=selection['campus'])
    if selection.get('framework'):
        if selection['framework'] not in FRAMEWORKS: raise ValidationError('Invalid framework.')
        rows=rows.filter(framework=selection['framework'])
    result = list(rows.order_by('record_id'))
    if selection.get('area'):
        result=[row for row in result if resource_scope(row.data)['area']==selection['area'].lower()]
    if selection.get('folder'):
        result=[row for row in result if selection['folder'] in ancestors(row)]
    return result


def selection_version(rows):
    policies=dict(CertificatePolicy.objects.filter(certificate_id__in=[r.pk for r in rows]).values_list('certificate_id','version'))
    values=[]
    for row in rows:
        values.append((row.record_id,row.version,policies.get(row.pk,0)))
    return hashlib.sha256(json.dumps(values).encode()).hexdigest()


def preview(selection):
    rows=selected_certificates(selection)
    return {'version':selection_version(rows),'certificates':len(rows),'campuses':len({r.campus for r in rows}),
            'features':len({r.framework for r in rows}), 'eligibleUsers':PortalAccount.objects.filter(role__in=['Faculty','Staff'],approval_status='approved',portal_status='Active').count(),
            'items':[{'id':r.record_id,'name':r.data.get('title'),'campus':r.campus,'framework':r.framework} for r in rows]}


@transaction.atomic
def update_access(actor, body):
    from .repository import VersionConflict
    if actor.role!='Superadmin': raise PermissionDenied('Only the Super Admin may manage certificate access.')
    RepositoryClock.objects.get_or_create(pk=1); RepositoryClock.objects.select_for_update().get(pk=1)
    rows=selected_certificates(body.get('selection') or {})
    if not rows: raise ValidationError('No matching certificates.')
    if body.get('version')!=selection_version(rows): raise VersionConflict('The selected certificates or permissions changed. Preview the changes again.')
    general=body.get('general')
    if general is not None and general not in LEVELS | {'inherit'}: raise ValidationError('Invalid general access.')
    updates=body.get('users',[])
    if not isinstance(updates,list) or len(updates)>10000: raise ValidationError('Invalid user assignments.')
    if any(not isinstance(item,dict) for item in updates):raise ValidationError('Invalid user assignments.')
    eligible=set(PortalAccount.objects.filter(pk__in=[item.get('userId') for item in updates],role__in=['Faculty','Staff'],approval_status='approved',portal_status='Active').values_list('pk',flat=True))
    seen=set()
    for item in updates:
        if item.get('userId') in seen or item.get('level') not in LEVELS | {'reset'} or item.get('userId') not in eligible:
            raise ValidationError('Select distinct, active faculty/staff with valid permissions.')
        seen.add(item['userId'])
    for entry in rows:
        policy=ensure_policy(entry)
        before={'general':policy.general,'allowCrossCampus':policy.allow_cross_campus,'users':list(policy.grants.values('user_id','level','allow_cross_campus'))}
        if body.get('overwriteExceptions'):
            policy.grants.all().delete()
        if body.get('applyDefault'):
            policy.inherited_level,policy.inherited_cross_campus,policy.inherited_from=applicable_default(entry)
            policy.general='inherit'
        elif general is not None:
            policy.general=general
        if body.get('allowCrossCampus') is not None:
            if not isinstance(body['allowCrossCampus'],bool): raise ValidationError('Cross-campus authorization must be explicit.')
            policy.allow_cross_campus=body['allowCrossCampus']
        for item in updates:
            if item['level']=='reset': policy.grants.filter(user_id=item['userId']).delete()
            else:
                cross=item.get('allowCrossCampus',False)
                if not isinstance(cross,bool): raise ValidationError('Invalid cross-campus authorization.')
                CertificateGrant.objects.update_or_create(policy=policy,user_id=item['userId'],defaults={'level':item['level'],'allow_cross_campus':cross,'updated_by':actor.pk})
        policy.version+=1; policy.updated_by=actor.pk; policy.save()
        after={'general':policy.general,'allowCrossCampus':policy.allow_cross_campus,'users':list(policy.grants.values('user_id','level','allow_cross_campus'))}
        audit(actor,entry,'certificate_access_bulk' if len(rows)>1 else 'certificate_access',before,after)
    signal_access('*' if len(rows)>1 else rows[0].record_id)
    return {'saved':True,'certificates':len(rows),'users':len(updates)}


@transaction.atomic
def update_default(actor, body):
    from .repository import campus_id, FRAMEWORKS, VersionConflict
    if actor.role!='Superadmin': raise PermissionDenied('Only the Super Admin may configure defaults.')
    scope={key:str((body.get('scope') or {}).get(key) or '') for key in ('campus','framework','area','program','folder')}
    if scope['campus'] and campus_id(scope['campus'])!=scope['campus']: raise ValidationError('Invalid campus.')
    if scope['framework'] and scope['framework'] not in FRAMEWORKS: raise ValidationError('Invalid framework.')
    if scope['area'] and not scope['framework']: raise ValidationError('Choose a framework for this area default.')
    if scope['folder']:
        folder=RepositoryEntry.objects.filter(kind='folder',record_id=scope['folder'],deleted=False).first()
        if not folder or scope['campus'] and folder.campus not in {scope['campus'],'*'} or scope['framework'] and folder.framework!=scope['framework']:
            raise ValidationError('The default folder must match the selected campus and feature.')
    if body.get('level') not in LEVELS or not isinstance(body.get('allowCrossCampus',False),bool): raise ValidationError('Invalid default permission.')
    RepositoryClock.objects.get_or_create(pk=1); RepositoryClock.objects.select_for_update().get(pk=1)
    row=CertificateDefault.objects.filter(**scope).first()
    if int(body.get('version',0))!=(row.version if row else 0): raise VersionConflict('This default was changed in another session.')
    before={key:getattr(row,key) for key in ('level','allow_cross_campus')} if row else None
    row,_=CertificateDefault.objects.update_or_create(**scope,defaults={'level':body['level'],'allow_cross_campus':body.get('allowCrossCampus',False),'updated_by':actor.pk,'version':row.version+1 if row else 1})
    RepositoryAccessAudit.objects.create(actor_id=actor.pk,actor_role=actor.role,action='certificate_default',campus=scope['campus'],framework=scope['framework'],area=scope['area'],program=scope['program'],previous=before,updated={**scope,'level':row.level,'allowCrossCampus':row.allow_cross_campus})
    signal_access('defaults')
    if body.get('applyExisting'):
        update_access(actor,{**body['applyExisting'],'applyDefault':True})
    return {'saved':True,'id':row.pk,'version':row.version}
