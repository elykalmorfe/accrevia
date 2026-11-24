import io
import json
import tempfile
from pathlib import Path
from unittest.mock import patch
from django.test import TestCase, Client, TransactionTestCase
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import PortalAccount, RepositoryClock, RepositoryEntry, RepositoryChange, RepositoryOperation, PortalFileContent
from .repository import mutate, changes, snapshot, VersionConflict, reconcile, record, FRAMEWORKS, CAMPUSES
from .portal_storage import store_file, store_collection
from .session_auth import establish_session, password_stamp, SESSION_ACCOUNT_KEY


class RepositoryContractTests(TestCase):
    def setUp(self):
        self.admin = PortalAccount.objects.create(id='repo-admin', email='admin@repo.test', role='Superadmin', portal_status='Active', approval_status='approved')
        self.local = PortalAccount.objects.create(id='repo-local', email='local@repo.test', role='Administrator', campus_id='cantilan', portal_status='Active', approval_status='approved')
        self.faculty = PortalAccount.objects.create(id='repo-faculty', email='faculty@repo.test', role='Faculty', campus_id='cantilan', portal_status='Active', approval_status='approved')
        RepositoryClock.objects.create(pk=1)
        self.seq = 0
        self.original=store_file('repository-stage',self.admin.pk+':fixture-original','fixture.txt','text/plain',io.BytesIO(b'Actual original text used by repository contract tests.'))
        self.delivery = patch('apps.auth.repository_index.synchronize_index.delay').start()
        self.addCleanup(patch.stopall)

    def write(self, kind, identity, data, context='accreditation', account=None, expected=None):
        self.seq += 1
        existing = RepositoryEntry.objects.filter(kind=kind, record_id=identity).first()
        version = existing.version if existing else 0
        return mutate(account or self.admin, f'operation-{self.seq:06}', [{'kind':kind,'id':identity,'expectedVersion':version if expected is None else expected,'data':data}], context)

    def folder(self, identity='parent', framework='ia', campus='cantilan', parent=None, **extra):
        data = {'id':identity,'name':identity,'code':'SRC','frameworkId':framework,'campusId':campus,'parentId':parent,**extra}
        self.write('folder', identity, data)
        return data

    def doc(self, identity='doc', framework='ia', campus='cantilan', folder='parent', **extra):
        return {'id':identity,'title':identity,'frameworkId':framework,'campusId':campus,'folderId':folder,'confidentiality':'Internal','fileRef':self.original.key,'storageSha256':self.original.content_id,**extra}

    def authenticated_client(self, account):
        client = Client(enforce_csrf_checks=True)
        session = client.session
        session[SESSION_ACCOUNT_KEY] = account.pk
        session['portal_password_stamp'] = password_stamp(account)
        session.save()
        return client

    def test_all_five_frameworks_and_seven_campuses_keep_identity_and_hierarchy(self):
        for framework in FRAMEWORKS:
            for campus in CAMPUSES:
                root = self.folder(f'{framework}-{campus}',framework,campus)
                child = self.folder(root['id']+'-child',framework,campus,root['id'])
                data = self.doc(child['id']+'-file',framework,campus,child['id'])
                self.write('document',data['id'],data)
        self.assertEqual(RepositoryEntry.objects.count(),105)
        self.assertEqual(len(snapshot(self.local)['documents']),5)
        self.assertTrue(all(doc['campusId']=='cantilan' for doc in snapshot(self.local)['documents']))
        self.assertEqual(len(snapshot(self.admin)['documents']),35)

    def test_one_way_protection_and_upload_origin_under_source_folder(self):
        parent = self.folder()
        self.write('folder','private', {**parent,'id':'private','parentId':'parent'}, 'upload-documents')
        row = RepositoryEntry.objects.get(record_id='private')
        self.assertEqual(row.origin,'upload-documents')
        self.assertTrue(record(row)['libraryOnly'])
        with self.assertRaises(PermissionDenied):
            self.write('folder','parent',{**parent,'name':'reverse overwrite'},'upload-documents')
        with self.assertRaises(PermissionDenied):
            self.write('folder','parent',None,'upload-documents')
        with self.assertRaises(ValidationError):
            self.write('folder','parent',None)
        self.assertFalse(RepositoryEntry.objects.get(record_id='parent').deleted)

    def test_cross_session_delivery_deduplication_and_conflicting_edit(self):
        parent = self.folder()
        old = snapshot(self.local)['revision']
        version = RepositoryEntry.objects.get(record_id='parent').version
        result = self.write('folder','parent',{**parent,'name':'Renamed by another admin'})
        batch = changes(self.local, old)
        self.assertEqual(batch['events'][0]['data']['name'],'Renamed by another admin')
        self.assertFalse(changes(self.local,batch['revision'])['events'])
        with self.assertRaises(VersionConflict):
            self.write('folder','parent',{**parent,'name':'stale'}, expected=version)
        op = RepositoryOperation.objects.order_by('-created_at').first()
        self.assertEqual(mutate(self.admin,op.pk,[], 'accreditation'),result)

    def test_campus_role_and_framework_permission_enforcement(self):
        self.folder(campus='tandag')
        self.assertEqual(snapshot(self.local)['folders'],[])
        self.assertEqual(changes(self.local,0)['events'],[])
        with self.assertRaises(PermissionDenied):
            self.write('folder','nope',self.folder_data('nope','tandag'),account=self.local)
        with self.assertRaises(PermissionDenied):
            self.write('folder','faculty',self.folder_data('faculty','cantilan'),account=self.faculty)
        self.local.allowed_features=['framework_iso']; self.local.save()
        with self.assertRaises(PermissionDenied):
            self.write('folder','disabled',self.folder_data('disabled','cantilan'),account=self.local)

    def folder_data(self, identity, campus):
        return {'id':identity,'name':identity,'frameworkId':'ia','campusId':campus}

    def test_atomic_batch_parent_validation_cycles_and_safe_delete(self):
        self.folder()
        operations = [{'kind':'folder','id':'child','expectedVersion':0,'data':self.folder_data('child','cantilan')},
                      {'kind':'folder','id':'bad','expectedVersion':0,'data':{**self.folder_data('bad','tandag'),'parentId':'parent'}}]
        with self.assertRaises(ValidationError): mutate(self.admin,'atomic-batch',operations,'accreditation')
        self.assertFalse(RepositoryEntry.objects.filter(record_id='child').exists())
        self.folder('nested',parent='parent')
        with self.assertRaises(ValidationError): self.write('folder','parent',{**self.folder_data('parent','cantilan'),'parentId':'nested'})
        with self.assertRaises(ValidationError): self.write('folder','parent',None)
        self.write('folder','nested',None)
        self.write('folder','parent',None)
        self.assertEqual(snapshot(self.admin)['folders'],[])

    def test_backfill_is_repeatable_and_preserves_original_records(self):
        store_collection('workspace','config',{'source':'browser-inventory'})
        stored = [self.folder_data('backfill','cantilan')]
        store_collection('browser-inventory','folders',stored)
        before = list(__import__('apps.auth.models',fromlist=['PortalRecord']).PortalRecord.objects.values_list('data',flat=True))
        with patch('apps.auth.workspace_storage.workspace_database',return_value='default'), patch('apps.auth.workspace_storage.workspace_source',return_value='browser-inventory'), patch('apps.auth.repository.workspace_database',return_value='default'), patch('apps.auth.repository.workspace_source',return_value='browser-inventory'):
            self.assertEqual(reconcile()['created'],1)
            self.assertEqual(RepositoryEntry.objects.count(),0)
            self.assertEqual(reconcile(True)['created'],1)
            self.assertEqual(reconcile(True)['created'],0)
        self.assertEqual(before,list(__import__('apps.auth.models',fromlist=['PortalRecord']).PortalRecord.objects.values_list('data',flat=True)))

    def test_original_bytes_shared_across_sessions_and_no_physical_delete(self):
        self.folder()
        data = b'%PDF-1.7\nExact original content'
        file = store_file('repository-stage',self.admin.pk+':file', 'original.pdf','application/pdf',io.BytesIO(data))
        self.write('document','doc',self.doc(fileRef=file.key,storageSha256=file.content_id))
        response = self.authenticated_client(self.local).get('/api/repository/files/doc/')
        self.assertEqual(response.status_code,200)
        self.assertEqual(b''.join(response.streaming_content),data)
        self.write('document','doc',None)
        self.assertEqual(self.authenticated_client(self.admin).get('/api/repository/files/doc/').status_code,404)
        self.assertTrue(PortalFileContent.objects.filter(pk=file.content_id).exists())

    def test_authenticated_sse_replay_and_csrf(self):
        client = self.authenticated_client(self.admin)
        response = client.get('/api/repository/events/?since=0', HTTP_ACCEPT='text/event-stream')
        iterator = iter(response.streaming_content)
        self.assertTrue(next(iterator).startswith(b':'))
        self.folder()
        self.assertIn(b'parent',next(iterator))
        response._iterator.close()
        self.assertNotEqual(Client().get('/api/repository/').status_code,200)
        self.assertEqual(client.post('/api/repository/mutate/',{},content_type='application/json').status_code,403)

    def test_indexing_completion_is_a_committed_live_event(self):
        from apps.documents.models import EvidenceDocument
        self.folder()
        self.write('document','status',self.doc('status'))
        doc = EvidenceDocument.objects.create(id='status',title='Status',storage_path='',status='Processing',progress={'repository_sha':self.original.content_id})
        cursor = RepositoryClock.objects.get(pk=1).revision
        doc.status='Indexed';doc.passages=['Actual extracted passage'];doc.save()
        result = changes(self.admin,cursor)
        self.assertEqual(result['events'][-1]['data']['status'],'Indexed')
        self.assertEqual(result['events'][-1]['data']['passages'],['Actual extracted passage'])

    def test_commit_notification_runs_only_after_successful_commit(self):
        with patch('apps.auth.repository.notify_revision') as notify:
            with self.captureOnCommitCallbacks(execute=True):
                self.folder()
                notify.assert_not_called()
            notify.assert_called_once()

    def test_failed_broker_delivery_is_durable_and_retry_is_deduplicated(self):
        from .models import RepositoryIndexDelivery
        from .repository_index import dispatch_due_index_jobs, synchronize_index
        from django.utils import timezone
        self.folder()
        self.write('document','delivery',self.doc('delivery'))
        self.delivery.side_effect=ConnectionError('broker offline')
        with self.assertLogs('apps.auth.repository_index',level='ERROR'):
            dispatch_due_index_jobs(['delivery'])
        job=RepositoryIndexDelivery.objects.get(pk='delivery')
        self.assertIn('broker offline',job.last_error)
        self.delivery.side_effect=None
        self.delivery.reset_mock()
        RepositoryIndexDelivery.objects.filter(pk='delivery').update(next_attempt=timezone.now())
        dispatch_due_index_jobs(['delivery']);dispatch_due_index_jobs(['delivery'])
        self.delivery.assert_called_once_with('delivery')
        with patch('apps.auth.repository_index._synchronize_index',return_value=None):
            synchronize_index.run('delivery')
        self.assertFalse(RepositoryIndexDelivery.objects.filter(pk='delivery').exists())

    def test_replacement_changes_exact_original_and_preserves_prior_content(self):
        self.folder()
        first=store_file('repository-stage',self.admin.pk+':old','original.txt','text/plain',io.BytesIO(b'First original'))
        second=store_file('repository-stage',self.admin.pk+':new','replacement.txt','text/plain',io.BytesIO(b'Exact replacement'))
        self.write('document','replace',self.doc('replace',fileRef=first.key,storageSha256=first.content_id))
        self.write('document','replace',self.doc('replace',fileRef=second.key,storageSha256=second.content_id))
        response=self.authenticated_client(self.local).get('/api/repository/files/replace/')
        self.assertEqual(b''.join(response.streaming_content),b'Exact replacement')
        self.assertEqual(response['ETag'],'"'+second.content_id+'"')
        self.assertTrue(PortalFileContent.objects.filter(pk=first.content_id).exists())

    def test_stale_indexer_cannot_mark_a_new_replacement_indexed(self):
        from apps.documents.models import EvidenceDocument
        self.folder()
        self.write('document','replacement-race',self.doc('replacement-race'))
        doc=EvidenceDocument.objects.create(id='replacement-race',title='Stale job',storage_path='uploads/old-hash.txt',status='Indexed',passages=['Stale original'])
        entry=RepositoryEntry.objects.get(record_id='replacement-race')
        self.assertEqual(entry.data['status'],'Processing')
        self.assertNotEqual(entry.data.get('passages'),['Stale original'])

    def test_reconcile_excludes_ambiguous_and_fileless_records(self):
        store_collection('workspace','config',{'source':'safe-browser-inventory'})
        store_collection('safe-browser-inventory','folders',[self.folder_data('safe-folder','cantilan')])
        store_collection('safe-browser-inventory','documents',[
            {'id':'ambiguous','title':'Ambiguous','frameworkId':'ia'},
            {'id':'fileless','title':'Fileless','frameworkId':'ia','campusId':'cantilan','folderId':'safe-folder'},
        ])
        with patch('apps.auth.workspace_storage.workspace_database',return_value='default'), patch('apps.auth.workspace_storage.workspace_source',return_value='safe-browser-inventory'), patch('apps.auth.repository.workspace_database',return_value='default'), patch('apps.auth.repository.workspace_source',return_value='safe-browser-inventory'):
            result = reconcile(False)
            self.assertIn('ambiguous', [row['id'] for row in result['conflicts']])
            self.assertIn('fileless', result['files_missing'])
            self.assertEqual(reconcile(True)['created'],1)
            self.assertEqual(reconcile(True)['created'],0)
        self.assertFalse(RepositoryEntry.objects.filter(record_id__in=['ambiguous','fileless']).exists())


class RepositoryConcurrentWritersTests(TransactionTestCase):
    def test_simultaneous_index_dispatchers_publish_a_due_job_once(self):
        from concurrent.futures import ThreadPoolExecutor
        from threading import Barrier
        from django.db import close_old_connections
        from django.utils import timezone
        from .models import RepositoryIndexDelivery
        from .repository_index import dispatch_due_index_jobs
        RepositoryClock.objects.create(pk=1)
        RepositoryIndexDelivery.objects.create(record_id='concurrent-delivery',target_version=1,next_attempt=timezone.now())
        barrier=Barrier(3)
        def dispatch(_):
            close_old_connections()
            barrier.wait(timeout=10)
            try: dispatch_due_index_jobs()
            finally: close_old_connections()
        with patch('apps.auth.repository_index.synchronize_index.delay') as publish, ThreadPoolExecutor(max_workers=3) as pool:
            list(pool.map(dispatch,range(3)))
        publish.assert_called_once_with('concurrent-delivery')

    def test_two_simultaneous_writers_cannot_overwrite_each_other(self):
        from concurrent.futures import ThreadPoolExecutor
        from threading import Barrier
        from django.db import close_old_connections, connection
        if not connection.features.has_select_for_update:
            self.skipTest('Requires a database with row locking.')
        account=PortalAccount.objects.create(id='concurrent-admin',email='concurrent@repo.test',role='Superadmin',portal_status='Active',approval_status='approved')
        RepositoryClock.objects.create(pk=1)
        RepositoryEntry.objects.create(kind='folder',record_id='concurrent',origin='accreditation',framework='ia',campus='tandag',data={'id':'concurrent','frameworkId':'ia','campusId':'tandag','name':'Original'})
        barrier=Barrier(2)
        def writer(label):
            close_old_connections()
            barrier.wait(timeout=10)
            try:
                mutate(account,'concurrent-operation-'+label,[{'kind':'folder','id':'concurrent','expectedVersion':1,'data':{'id':'concurrent','frameworkId':'ia','campusId':'tandag','name':label}}],'accreditation')
                return 'saved'
            except VersionConflict:
                return 'conflict'
            finally:
                close_old_connections()
        with patch('apps.auth.repository.notify_revision'),ThreadPoolExecutor(max_workers=2) as pool:
            results=list(pool.map(writer,['A','B']))
        self.assertEqual(sorted(results),['conflict','saved'])
        self.assertEqual(RepositoryEntry.objects.get(record_id='concurrent').version,2)
