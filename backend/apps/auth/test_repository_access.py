import io
import uuid
from unittest.mock import patch
from django.test import TestCase, Client
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import (PortalAccount, RepositoryEntry, RepositoryClock, RepositoryAccessAssignment,
                     RepositoryAccessAudit, RepositoryAreaDefinition)
from .repository import snapshot, changes, mutate, may_read, record, VersionConflict
from .repository_access import save_assignments, scope_token, validate_scope
from .portal_storage import store_collection, store_file
from .session_auth import SESSION_ACCOUNT_KEY, password_stamp


class RepositoryAreaAccessTests(TestCase):
    def setUp(self):
        self.admin = PortalAccount.objects.create(id='access-super', email='super@access.test', role='Superadmin', approval_status='approved', portal_status='Active')
        self.editor = PortalAccount.objects.create(id='access-editor', email='editor@access.test', role='Faculty', approval_status='approved', portal_status='Active', campus_id='tandag')
        self.viewer = PortalAccount.objects.create(id='access-viewer', email='viewer@access.test', role='Staff', approval_status='approved', portal_status='Active', campus_id='tandag')
        self.scope = {'campus': 'tandag', 'framework': 'ia', 'area': 'area-i', 'program': ''}
        RepositoryClock.objects.create(pk=1)
        self.delivery = patch('apps.auth.repository_index.synchronize_index.delay').start()
        self.addCleanup(patch.stopall)
        self.original = store_file('repository-stage', self.editor.pk + ':original', 'actual.txt', 'text/plain', io.BytesIO(b'Exact shared original'))

    def assign(self, updates, scope=None):
        scope = scope or self.scope
        rows = list(RepositoryAccessAssignment.objects.filter(**scope).order_by('user_id').values('user_id', 'level', 'updated_at'))
        return save_assignments(self.admin, scope, [{'userId': user.pk, 'level': level} for user, level in updates], scope_token(rows))

    def write(self, user, identity='shared-folder', data=None, kind='folder', delete=False, context='accreditation'):
        entry = RepositoryEntry.objects.filter(kind=kind, record_id=identity).first()
        value = data or {'id': identity, 'frameworkId': 'ia', 'campusId': 'tandag', 'areaId': 'area-i', 'name': identity}
        return mutate(user, str(uuid.uuid4()), [{'kind': kind, 'id': identity, 'expectedVersion': entry.version if entry else 0, 'data': None if delete else value}], context)

    def client_for(self, user):
        client = Client(enforce_csrf_checks=True)
        session = client.session
        session[SESSION_ACCOUNT_KEY] = user.pk
        session['portal_password_stamp'] = password_stamp(user)
        session.save()
        return client

    def test_official_catalog_has_nine_ten_seven_database_entries(self):
        self.assertEqual([RepositoryAreaDefinition.objects.filter(framework=k).count() for k in ('ia','pa','pqa')], [9,10,7])

    def test_multiple_editors_and_viewers_share_one_exact_record(self):
        self.assign([(self.editor, 'editor'), (self.viewer, 'viewer')])
        self.write(self.editor)
        self.assertEqual(snapshot(self.viewer)['folders'][0]['id'], 'shared-folder')
        self.assertEqual(snapshot(self.admin)['folders'][0]['id'], 'shared-folder')
        self.assign([(self.viewer, 'editor')])
        self.write(self.viewer, data={'id': 'shared-folder', 'name': 'Other editor rename', 'frameworkId':'ia', 'campusId':'tandag', 'areaId':'area-i'})
        self.assertEqual(RepositoryEntry.objects.count(), 1)
        self.assertEqual(snapshot(self.editor)['folders'][0]['name'], 'Other editor rename')
        self.assertEqual(RepositoryAccessAssignment.objects.filter(**self.scope).count(), 2)

    def test_unassigned_defaults_no_access_even_for_public_and_own_upload(self):
        self.write(self.admin)
        row = RepositoryEntry.objects.get(record_id='shared-folder')
        self.assertFalse(may_read(self.editor, {**record(row), 'confidentiality':'Public', 'uploadedBy':self.editor.pk}, 'folder'))
        self.assertEqual(snapshot(self.editor)['folders'], [])
        with self.assertRaises(PermissionDenied): self.write(self.editor, 'forbidden')

    def test_viewer_reads_empty_folders_but_all_mutations_are_denied(self):
        self.assign([(self.editor,'editor'), (self.viewer,'viewer')])
        self.write(self.editor)
        self.assertEqual(len(snapshot(self.viewer)['folders']),1)
        with self.assertRaises(PermissionDenied): self.write(self.viewer, 'another')
        with self.assertRaises(PermissionDenied): self.write(self.viewer, delete=True)

    def test_nested_folders_and_files_inherit_area_permission(self):
        self.assign([(self.editor,'editor'), (self.viewer,'viewer')])
        self.write(self.editor)
        self.write(self.editor, 'nested', {'id':'nested', 'name':'Nested', 'parentId':'shared-folder', 'frameworkId':'ia', 'campusId':'tandag'})
        self.write(self.editor, 'file', {'id':'file','title':'Shared file', 'folderId':'nested','frameworkId':'ia','campusId':'tandag','fileRef':self.original.key}, kind='document')
        response = self.client_for(self.viewer).get('/api/repository/files/file/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(b''.join(response.streaming_content),b'Exact shared original')
        self.assertEqual(len(snapshot(self.viewer)['documents']),1)

    def test_independent_area_campus_and_framework_permissions(self):
        self.assign([(self.editor,'editor')])
        for scope in [dict(self.scope, campus='cantilan'), dict(self.scope, area='area-ii'), dict(self.scope, framework='pqa', area='pqa-1')]:
            with self.assertRaises(PermissionDenied):
                self.write(self.editor, str(uuid.uuid4()), {'frameworkId':scope['framework'],'campusId':scope['campus'],'areaId':scope['area'],'name':'Denied'})

    def test_aaccup_program_isolation_uses_real_program_requirements(self):
        store_collection('workspace','config',{'source':'access-source'})
        store_collection('access-source','programAccreditations',[
            {'id':p,'campusId':'tandag','requirements':[{'id':p+'-req-1','areaCode':'AREA-1'}]} for p in ('program-a','program-b')])
        scope={'campus':'tandag','framework':'pa','area':'program-a-req-1','program':'program-a'}
        self.assign([(self.editor,'editor')],scope)
        self.write(self.editor,'program-a-folder',{'frameworkId':'pa','campusId':'tandag','areaId':'program-a-req-1','name':'Assigned'})
        with self.assertRaises(PermissionDenied): self.write(self.editor,'program-b-folder',{'frameworkId':'pa','campusId':'tandag','areaId':'program-b-req-1','name':'Denied'})
        with self.assertRaises(ValidationError): validate_scope(dict(scope, program='program-b'))

    def test_revoke_and_downgrade_immediately_reject_stale_user_writes(self):
        self.assign([(self.editor,'editor')]); self.write(self.editor)
        cursor = RepositoryClock.objects.get(pk=1).revision
        self.assign([(self.editor,'viewer')])
        with self.assertRaises(PermissionDenied): self.write(self.editor,'stale')
        self.assign([(self.editor,'none')])
        self.assertEqual(snapshot(self.editor)['folders'],[])
        self.assertTrue(any(e['kind']=='access' for e in changes(self.editor,cursor)['events']))
        self.assertFalse(any(e['data'] for e in changes(self.editor,cursor)['events']))

    def test_cached_operation_replay_does_not_bypass_revocation(self):
        from .models import RepositoryOperation
        self.assign([(self.editor,'editor')]); self.write(self.editor)
        operation=RepositoryOperation.objects.get(account_id=self.editor.pk)
        self.assign([(self.editor,'none')])
        with self.assertRaises(PermissionDenied): mutate(self.editor,operation.pk,[],'accreditation')

    def test_only_superadmin_assigns_and_concurrent_assignment_edits_conflict(self):
        with self.assertRaises(PermissionDenied): save_assignments(self.editor,self.scope,[{'userId':self.editor.pk,'level':'editor'}],scope_token([]))
        token=scope_token([])
        self.assign([(self.editor,'editor')])
        with self.assertRaises(VersionConflict): save_assignments(self.admin,self.scope,[{'userId':self.editor.pk,'level':'viewer'}],token)
        self.assertEqual(self.client_for(self.editor).get('/api/repository/assignments/',self.scope).status_code,403)

    def test_audit_records_actor_scope_and_before_after(self):
        self.assign([(self.editor,'editor')]); self.write(self.editor)
        self.write(self.editor,data={'frameworkId':'ia','campusId':'tandag','areaId':'area-i','name':'Renamed'})
        self.assertTrue(RepositoryAccessAudit.objects.filter(actor_id=self.editor.pk, action='renamed', area='area-i', resource_id='shared-folder').exists())
        audit=RepositoryAccessAudit.objects.get(action='renamed')
        self.assertEqual(audit.previous['name'],'shared-folder')
        self.assertEqual(audit.updated['name'],'Renamed')

    def test_scope_spoofing_parent_area_and_upload_origin_are_rejected(self):
        self.assign([(self.editor,'editor')]); self.write(self.editor)
        with self.assertRaises(ValidationError): self.write(self.editor,'spoof',{'frameworkId':'ia','campusId':'tandag','areaId':'area-ii','parentId':'shared-folder','name':'Spoof'})
        with self.assertRaises(PermissionDenied): self.write(self.editor,'upload-only',context='upload-documents')

    def test_revoked_original_and_legacy_endpoints_deny_direct_access(self):
        self.assign([(self.editor,'editor'), (self.viewer,'viewer')]); self.write(self.editor)
        self.write(self.editor,'file',{'frameworkId':'ia','campusId':'tandag','areaId':'area-i','folderId':'shared-folder','fileRef':self.original.key,'title':'Secret'},kind='document')
        self.assign([(self.viewer,'none')])
        client=self.client_for(self.viewer)
        self.assertEqual(client.get('/api/repository/files/file/').status_code,404)
        self.assertEqual(client.get('/api/live/files/file/').status_code,403)
        self.assertEqual(client.get('/api/repository/')['Content-Type'],'application/json')

    def test_search_passes_only_authorized_assigned_documents_to_retriever(self):
        self.assign([(self.editor,'editor'),(self.viewer,'viewer')]); self.write(self.editor)
        self.write(self.editor,'file',{'frameworkId':'ia','campusId':'tandag','areaId':'area-i','folderId':'shared-folder','fileRef':self.original.key,'title':'Secret'},kind='document')
        entry=RepositoryEntry.objects.get(record_id='file'); entry.data['status']='Indexed'; entry.save()
        client=self.client_for(self.viewer)
        csrf=client.get('/api/accounts/session/').json()['csrfToken']
        with patch('apps.search.views.run_search',return_value=[]) as search, patch('apps.search.views.dense_backend_info',return_value={'name':'test','degraded':False}):
            response=client.post('/api/search/',data={'q':'evidence'},content_type='application/json',HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(response.status_code,200)
        self.assertEqual(search.call_args.kwargs['filters']['documentIds'],['file'])

    def test_assignment_api_lists_real_users_and_persists_multiple_levels(self):
        client=self.client_for(self.admin)
        state=client.get('/api/repository/assignments/',self.scope).json()
        self.assertEqual({u['id'] for u in state['users']},{self.editor.pk,self.viewer.pk})
        csrf=client.get('/api/accounts/session/').json()['csrfToken']
        response=client.post('/api/repository/assignments/',data={'scope':self.scope,'version':state['version'],'assignments':[{'userId':self.editor.pk,'level':'editor'},{'userId':self.viewer.pk,'level':'viewer'}]},content_type='application/json',HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(response.status_code,200)
        reloaded=client.get('/api/repository/assignments/',self.scope).json()
        self.assertEqual({u['id']:u['level'] for u in reloaded['users']},{self.editor.pk:'editor',self.viewer.pk:'viewer'})

    def test_unassigned_snapshot_does_not_query_program_catalog_per_document(self):
        from django.db import connection
        from django.test.utils import CaptureQueriesContext
        RepositoryEntry.objects.bulk_create([RepositoryEntry(kind='document', record_id=f'private-{i}', framework='pa', campus='tandag', origin='accreditation', data={'id':f'private-{i}', 'frameworkId':'pa','campusId':'tandag','areaId':'pa-repo'}) for i in range(100)])
        with CaptureQueriesContext(connection) as queries:
            result=snapshot(self.editor)
        self.assertEqual(result['documents'],[])
        self.assertLess(len(queries),12)

    def test_legacy_shares_cannot_override_explicit_area_revocation(self):
        from .models import PortalLiveBoard
        from .live import snapshot_for
        self.write(self.admin)
        self.write(self.admin,'file',{'frameworkId':'ia','campusId':'tandag','areaId':'area-i','folderId':'shared-folder','documentUrl':'https://example.invalid/original','title':'Protected'},kind='document')
        PortalLiveBoard.objects.create(pk=1, document_requests=[{'id':'request','createdByUserId':self.viewer.pk,'requesterId':self.viewer.pk,'messages':[{'attachments':[{'kind':'document','documentId':'file','name':'Protected','access':'anyone'}]}]}])
        result=snapshot_for(self.viewer.role,self.viewer.pk,self.viewer.email)
        self.assertFalse(any(g['documentId']=='file' for g in result['fileGrants']))
