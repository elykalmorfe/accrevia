import io
import uuid
from unittest.mock import patch
from django.test import TestCase, Client
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import (PortalAccount, RepositoryEntry, RepositoryClock, CertificatePolicy, CertificateGrant,
                     CertificateDefault, RepositoryAccessAudit, RepositoryIndexDelivery)
from .repository import mutate, snapshot, changes, record, may_read, VersionConflict
from .repository_access import save_assignments, scope_token
from .certificate_access import rights, ensure_policy, update_access, update_default, preview
from .portal_storage import store_file
from .session_auth import SESSION_ACCOUNT_KEY, password_stamp


class CertificateAccessTests(TestCase):
    def setUp(self):
        self.admin=PortalAccount.objects.create(id='cert-super',email='super@cert.test',role='Superadmin',approval_status='approved',portal_status='Active')
        self.faculty=PortalAccount.objects.create(id='cert-faculty',email='faculty@cert.test',name='Database Faculty',role='Faculty',campus_id='tandag',office='Academic Unit',approval_status='approved',portal_status='Active')
        self.staff=PortalAccount.objects.create(id='cert-staff',email='staff@cert.test',role='Staff',campus_id='tandag',approval_status='approved',portal_status='Active')
        self.foreign=PortalAccount.objects.create(id='cert-foreign',email='foreign@cert.test',role='Faculty',campus_id='bislig',approval_status='approved',portal_status='Active')
        self.manager=PortalAccount.objects.create(id='cert-manager',email='manager@cert.test',role='Administrator',campus_id='tandag',approval_status='approved',portal_status='Active')
        RepositoryClock.objects.create(pk=1)
        self.delay=patch('apps.auth.repository_index.synchronize_index.delay').start(); self.addCleanup(patch.stopall)
        self.file=store_file('repository-stage',self.admin.pk+':exact-original','certificate.txt','text/plain',io.BytesIO(b'Actual exact certificate original'))
        self.folder=self.write('folder','cert-folder',{'name':'Certificate folder','frameworkId':'ia','campusId':'tandag','areaId':'area-i'})
        self.entry=self.certificate()

    def write(self,kind,identity,data,account=None,context='accreditation'):
        old=RepositoryEntry.objects.filter(kind=kind,record_id=identity).first()
        mutate(account or self.admin,str(uuid.uuid4()),[{'kind':kind,'id':identity,'expectedVersion':old.version if old else 0,'data':data}],context)
        return RepositoryEntry.objects.get(kind=kind,record_id=identity)

    def certificate(self,identity='certificate',framework='ia',campus='tandag',parent='cert-folder',area='area-i',**extra):
        return self.write('document',identity,{'id':identity,'title':identity,'docType':'Certificate','frameworkId':framework,'campusId':campus,'folderId':parent,'areaId':area,'fileRef':self.file.key,'uploadedBy':self.admin.pk,**extra})

    def fresh_rights(self,account,entry=None):
        row=entry or self.entry
        return rights(PortalAccount.objects.get(pk=account.pk),record(row),row)

    def policy(self,ids=None,**body):
        selection={'ids':ids or [self.entry.record_id]}
        plan=preview(selection)
        return update_access(self.admin,{'selection':selection,'version':plan['version'],**body})

    def client_for(self,account):
        client=Client(enforce_csrf_checks=True);session=client.session
        session[SESSION_ACCOUNT_KEY]=account.pk;session['portal_password_stamp']=password_stamp(account);session.save()
        return client

    def test_initial_default_viewer_only_same_campus_across_all_five_frameworks(self):
        for framework in ['ia','pa','copc','pqa','iso']:
            parent=self.write('folder',framework+'-folder',{'name':framework,'frameworkId':framework,'campusId':'tandag'})
            row=self.certificate('cert-'+framework,framework,parent=parent.record_id,area='cert-'+framework)
            access=self.fresh_rights(self.faculty,row)
            self.assertTrue(access['canView']);self.assertFalse(access['canDownload']);self.assertFalse(access['canManage'])
        self.assertFalse(self.fresh_rights(self.foreign)['canView'])

    def test_mixed_individual_permissions_override_general_and_none_wins(self):
        self.policy(general='viewer',users=[{'userId':self.faculty.pk,'level':'download'},{'userId':self.staff.pk,'level':'none'}])
        self.assertTrue(self.fresh_rights(self.faculty)['canDownload'])
        self.assertFalse(self.fresh_rights(self.staff)['canView'])
        self.policy(general='download')
        self.assertFalse(self.fresh_rights(self.staff)['canView'])
        self.assertEqual(CertificateGrant.objects.filter(policy__certificate=self.entry,user=self.staff).count(),1)

    def test_restricted_specific_users_and_cross_campus_explicit_authorization(self):
        self.policy(general='none',users=[{'userId':self.faculty.pk,'level':'viewer'},{'userId':self.foreign.pk,'level':'download'}])
        self.assertTrue(self.fresh_rights(self.faculty)['canView']);self.assertFalse(self.fresh_rights(self.staff)['canView'])
        self.assertFalse(self.fresh_rights(self.foreign)['canView'])
        self.policy(users=[{'userId':self.foreign.pk,'level':'download','allowCrossCampus':True}])
        self.assertTrue(self.fresh_rights(self.foreign)['canDownload'])
        self.assertIn('certificate',[d['id'] for d in snapshot(self.foreign)['documents']])

    def test_general_all_campus_requires_explicit_cross_campus_flag(self):
        self.policy(general='download',allowCrossCampus=True)
        self.assertTrue(self.fresh_rights(self.foreign)['canDownload'])
        self.policy(users=[{'userId':self.foreign.pk,'level':'none','allowCrossCampus':True}])
        self.assertFalse(self.fresh_rights(self.foreign)['canView'])

    def test_viewer_preview_allowed_download_endpoint_rejected_and_audited(self):
        client=self.client_for(self.faculty)
        response=client.get('/api/repository/files/certificate/')
        self.assertEqual(response.status_code,200);self.assertEqual(b''.join(response.streaming_content),b'Actual exact certificate original')
        self.assertEqual(client.get('/api/repository/files/certificate/?download=1').status_code,403)
        self.assertTrue(RepositoryAccessAudit.objects.filter(resource_id='certificate',action='certificate_download_denied',status='denied').exists())
        self.policy(users=[{'userId':self.faculty.pk,'level':'download'}])
        response=client.get('/api/repository/files/certificate/?download=1')
        self.assertEqual(response.status_code,200);self.assertIn('attachment',response['Content-Disposition'])
        response.close()

    def test_no_access_hides_lists_and_rejects_direct_original_after_revocation(self):
        self.policy(users=[{'userId':self.faculty.pk,'level':'none'}])
        self.assertEqual(snapshot(self.faculty)['documents'],[])
        self.assertEqual(self.client_for(self.faculty).get('/api/repository/files/certificate/').status_code,404)
        self.assertTrue(RepositoryAccessAudit.objects.filter(action='certificate_view_denied').exists())

    def test_area_editor_cannot_manage_certificate_or_rename_move_delete_ancestors(self):
        save_assignments(self.admin,{'campus':'tandag','framework':'ia','area':'area-i','program':''},[{'userId':self.faculty.pk,'level':'editor'}],scope_token([]))
        for account in [self.faculty,self.manager]:
            with self.assertRaises(PermissionDenied): self.write('document','certificate',{**record(self.entry),'title':'Forbidden'},account)
            for change in [{'name':'Renamed'},{'parentId':'different'},{'areaId':'area-ii'}]:
                with self.assertRaises(PermissionDenied): self.write('folder','cert-folder',{**record(self.folder),**change},account)
            with self.assertRaises(PermissionDenied): self.write('document','certificate',None,account)
            with self.assertRaises(PermissionDenied): self.write('folder','cert-folder',None,account)
        self.assertTrue(snapshot(self.faculty)['folders'][0]['certificateLocked'])

    def test_regular_document_permissions_are_unchanged(self):
        self.policy(general='none')
        save_assignments(self.admin,{'campus':'tandag','framework':'ia','area':'area-i','program':''},[{'userId':self.faculty.pk,'level':'editor'}],scope_token([]))
        own=store_file('repository-stage',self.faculty.pk+':regular','regular.txt','text/plain',io.BytesIO(b'Regular evidence'))
        row=self.write('document','regular',{'title':'Regular','docType':'Report','frameworkId':'ia','campusId':'tandag','areaId':'area-i','folderId':'cert-folder','fileRef':own.key},self.faculty)
        self.write('document','regular',{**record(row),'title':'Edited regular document'},self.faculty)
        self.assertTrue(may_read(PortalAccount.objects.get(pk=self.faculty.pk),record(row)))

    def test_global_and_nearest_folder_defaults_capture_at_upload_and_preserve_existing(self):
        initial=CertificateDefault.objects.get(campus='',framework='',area='',program='',folder='')
        update_default(self.admin,{'scope':{},'version':initial.version,'level':'none'})
        self.assertTrue(self.fresh_rights(self.faculty)['canView'])
        later=self.certificate('later')
        self.assertFalse(self.fresh_rights(self.faculty,later)['canView'])
        update_default(self.admin,{'scope':{'campus':'tandag','framework':'ia','folder':'cert-folder'},'version':0,'level':'download'})
        nearest=self.certificate('nearest')
        self.assertTrue(self.fresh_rights(self.faculty,nearest)['canDownload'])
        self.policy(ids=['certificate'],general='none')
        p=preview({'ids':['certificate']})
        update_access(self.admin,{'selection':{'ids':['certificate']},'version':p['version'],'applyDefault':True})
        self.assertTrue(self.fresh_rights(self.faculty)['canDownload'])

    def test_campus_feature_area_default_specificity(self):
        update_default(self.admin,{'scope':{'campus':'tandag'},'version':0,'level':'none'})
        update_default(self.admin,{'scope':{'campus':'tandag','framework':'ia'},'version':0,'level':'viewer'})
        update_default(self.admin,{'scope':{'campus':'tandag','framework':'ia','area':'area-i'},'version':0,'level':'download'})
        row=self.certificate('specific')
        self.assertTrue(self.fresh_rights(self.faculty,row)['canDownload'])

    def test_bulk_preserves_or_overwrites_exceptions_without_touching_regular_documents(self):
        other=self.certificate('second')
        regular=self.write('document','regular',{'title':'Regular','docType':'Report','frameworkId':'ia','campusId':'tandag','fileRef':self.file.key})
        self.policy(users=[{'userId':self.staff.pk,'level':'none'}])
        plan=preview({'all':True,'campus':'tandag','framework':'ia','folder':'cert-folder'})
        self.assertEqual(plan['certificates'],2);self.assertEqual(plan['campuses'],1)
        self.policy(ids=['certificate','second'],general='download')
        self.assertFalse(self.fresh_rights(self.staff)['canView']);self.assertTrue(self.fresh_rights(self.staff,other)['canDownload'])
        self.policy(ids=['certificate','second'],general='viewer',overwriteExceptions=True)
        self.assertTrue(self.fresh_rights(self.staff)['canView']);self.assertFalse(CertificateGrant.objects.exists())
        self.assertEqual(RepositoryEntry.objects.get(pk=regular.pk).version,regular.version)
        with self.assertRaises(ValidationError): preview({'ids':['regular']})

    def test_bulk_scope_and_invalid_user_roll_back_all_changes(self):
        self.certificate('second')
        before=CertificatePolicy.objects.get(certificate=self.entry).version
        with self.assertRaises(ValidationError): self.policy(ids=['certificate','second'],general='none',users=[{'userId':'nonexistent','level':'viewer'}])
        self.assertEqual(CertificatePolicy.objects.get(certificate=self.entry).version,before)
        self.assertTrue(self.fresh_rights(self.faculty)['canView'])

    def test_policy_and_default_concurrency_tokens_reject_stale_saves(self):
        plan=preview({'ids':['certificate']});self.policy(general='none')
        with self.assertRaises(VersionConflict): update_access(self.admin,{'selection':{'ids':['certificate']},'version':plan['version'],'general':'download'})
        initial=CertificateDefault.objects.get(campus='',framework='',area='',program='',folder='')
        update_default(self.admin,{'scope':{},'version':initial.version,'level':'none'})
        with self.assertRaises(VersionConflict): update_default(self.admin,{'scope':{},'version':initial.version,'level':'download'})

    def test_permissions_emit_reconnectable_events_without_reembedding(self):
        cursor=RepositoryClock.objects.get(pk=1).revision
        jobs=list(RepositoryIndexDelivery.objects.values())
        self.delay.reset_mock();self.policy(general='none')
        self.delay.assert_not_called();self.assertEqual(list(RepositoryIndexDelivery.objects.values()),jobs)
        events=changes(PortalAccount.objects.get(pk=self.faculty.pk),cursor)['events']
        self.assertTrue(any(e['kind']=='access' for e in events));self.assertTrue(all(e['data'] is None for e in events))

    def test_shared_identifier_has_identical_rights_in_upload_projection(self):
        doc=snapshot(self.faculty)['documents'][0]
        self.assertEqual(doc['id'],'certificate');self.assertEqual(doc['certificateAccess']['level'],'viewer')
        self.assertEqual(doc['sourceModule'],'accreditation')
        self.assertEqual(RepositoryEntry.objects.filter(kind='document').count(),1)

    def test_only_superadmin_can_use_access_apis_or_modify_defaults(self):
        client=self.client_for(self.faculty)
        self.assertEqual(client.get('/api/repository/certificates/access/?id=certificate').status_code,403)
        self.assertEqual(client.get('/api/repository/certificates/defaults/').status_code,403)
        with self.assertRaises(PermissionDenied):update_access(self.manager,{'selection':{'ids':['certificate']}})
        with self.assertRaises(PermissionDenied):update_default(self.faculty,{'scope':{},'level':'download'})

    def test_manage_access_lists_real_database_accounts_and_location(self):
        response=self.client_for(self.admin).get('/api/repository/certificates/access/?id=certificate')
        self.assertEqual(response.status_code,200)
        data=response.json();user=next(u for u in data['users'] if u['id']==self.faculty.pk)
        self.assertEqual(user['name'],'Database Faculty');self.assertEqual(user['office'],'Academic Unit')
        self.assertEqual(data['certificate']['folderId'],'cert-folder');self.assertTrue(data['lastModifiedAt'])

    def test_final_search_authorization_excludes_permission_revoked_during_retrieval(self):
        self.entry.data['status']='Indexed';self.entry.save()
        client=self.client_for(self.faculty);csrf=client.get('/api/accounts/session/').json()['csrfToken']
        def search(*args,**kwargs):
            self.policy(general='none')
            return [{'doc':{'id':'certificate','title':'Forbidden content'},'passages':['Protected passage']}]
        with patch('apps.search.views.run_search',side_effect=search),patch('apps.search.views.dense_backend_info',return_value={'name':'test','degraded':False}):
            response=client.post('/api/search/',data={'q':'certificate'},content_type='application/json',HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(response.status_code,200);self.assertEqual(response.json()['results'],[])

    def test_certificate_audits_cover_upload_rename_replace_move_and_permissions(self):
        self.write('document','certificate',{**record(self.entry),'title':'Renamed'})
        replacement=store_file('repository-stage',self.admin.pk+':replacement','replacement.txt','text/plain',io.BytesIO(b'New exact original'))
        self.entry=RepositoryEntry.objects.get(pk=self.entry.pk)
        self.write('document','certificate',{**record(self.entry),'fileRef':replacement.key})
        self.policy(general='download')
        actions=set(RepositoryAccessAudit.objects.filter(resource_id='certificate').values_list('action',flat=True))
        self.assertTrue({'certificate_uploaded','certificate_renamed','certificate_replaced','certificate_access'}.issubset(actions))

    def test_all_scope_selector_is_explicit_and_regular_document_never_selected(self):
        with self.assertRaises(ValidationError):preview({})
        self.assertEqual(preview({'all':True})['certificates'],1)

    def test_individual_reset_restores_general_without_duplicate_grants(self):
        self.policy(general='viewer',users=[{'userId':self.faculty.pk,'level':'none'}])
        self.policy(users=[{'userId':self.faculty.pk,'level':'download'}])
        self.assertEqual(CertificateGrant.objects.filter(user=self.faculty).count(),1)
        self.policy(users=[{'userId':self.faculty.pk,'level':'reset'}])
        self.assertTrue(self.fresh_rights(self.faculty)['canView']);self.assertFalse(self.fresh_rights(self.faculty)['canDownload'])

    def test_other_recipient_roles_do_not_receive_unrestricted_certificate_access(self):
        recipient=PortalAccount.objects.create(id='cert-recipient',email='recipient@cert.test',role='User',approval_status='approved',portal_status='Active')
        self.assertFalse(self.fresh_rights(recipient)['canView'])
        self.assertFalse(may_read(recipient,record(self.entry)))
