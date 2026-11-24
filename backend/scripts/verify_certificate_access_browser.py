"""Chrome checks against running services; only uniquely named validation records are changed."""
import io
import json
import os
import sys
import uuid
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
import django
django.setup()
from django.contrib.sessions.backends.db import SessionStore
from django.contrib.sessions.models import Session
from apps.auth.models import PortalAccount,RepositoryEntry,CertificateDefault
from apps.auth.repository import mutate
from apps.auth.portal_storage import store_file
from apps.auth.session_auth import SESSION_ACCOUNT_KEY,password_stamp
from playwright.sync_api import sync_playwright

API='http://127.0.0.1:8000';WEB='http://127.0.0.1:5173'
prefix='cert-browser-'+uuid.uuid4().hex[:10]
admin=PortalAccount.objects.filter(role='Superadmin',approval_status='approved',portal_status='Active').first()
assert admin
members=[PortalAccount.objects.create(id=prefix+suffix,email=prefix+suffix+'@validation.invalid',name=prefix+suffix,role=role,campus_id='tandag',office='Validation Office',approval_status='approved',portal_status='Active') for suffix,role in [('-faculty','Faculty'),('-staff','Staff')]]
sessions=[];report={'prefix':prefix,'checks':{}}
folder_id=prefix+'-folder';doc_id=prefix+'-certificate'
original=prefix+' EXACT ORIGINAL CERTIFICATE'


def commit(identity,data,kind='document'):
    row=RepositoryEntry.objects.filter(kind=kind,record_id=identity).first()
    return mutate(admin,str(uuid.uuid4()),[{'kind':kind,'id':identity,'expectedVersion':row.version if row else 0,'data':data}],'accreditation')


def request(page,path,method='GET',body=None):
    return page.evaluate('''async ({path,method,body})=>{
      const s=await fetch('http://127.0.0.1:8000/api/accounts/session/',{credentials:'include'}).then(r=>r.json());
      const response=await fetch('http://127.0.0.1:8000'+path,{method,credentials:'include',headers:{'Content-Type':'application/json','X-CSRFToken':s.csrfToken},...(body?{body:JSON.stringify(body)}:{})});
      return {status:response.status,body:await response.json()};
    }''',{'path':path,'method':method,'body':body})


try:
  commit(folder_id,{'id':folder_id,'name':prefix+' folder','frameworkId':'ia','areaId':'area-i','campusId':'tandag'},'folder')
  file=store_file('repository-stage',admin.pk+':'+prefix,'original.txt','text/plain',io.BytesIO(original.encode()))
  commit(doc_id,{'id':doc_id,'title':prefix+' Certificate','docType':'Certificate','frameworkId':'ia','areaId':'area-i','campusId':'tandag','campus':'Tandag','folderId':folder_id,'fileRef':file.key,'uploadedBy':admin.pk,'dateAdded':'2026-11-24','fileType':'TXT','keywords':[],'passages':[],'status':'Processing','sizeMb':0.001})
  for account in [admin,*members]:
    store=SessionStore();store[SESSION_ACCOUNT_KEY]=account.pk;store['portal_password_stamp']=password_stamp(account);store.save();sessions.append(store.session_key)
  with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--disable-gpu'])
    pages=[]
    for account,key in zip([admin,*members],sessions):
      context=browser.new_context(viewport={'width':1365,'height':900});context.add_cookies([{'name':'sessionid','value':key,'domain':'127.0.0.1','path':'/','httpOnly':True,'sameSite':'Lax'}])
      page=context.new_page();pages.append(page)
      page.on('pageerror',lambda error:print('Browser error:',str(error)))
      page.on('dialog',lambda dialog:dialog.accept())
      page.goto(WEB+('/documents/' if account==admin else '/open/documents/')+doc_id,wait_until='domcontentloaded')
    a,f,s=pages
    for page in pages:page.get_by_text(original,exact=True).wait_for(timeout=45000)
    assert f.get_by_role('button',name='Download',exact=True).count()==0
    assert f.get_by_role('button',name='Certificate actions: '+prefix+' Certificate',exact=True).count()==0
    assert s.request.get(API+'/api/repository/files/'+doc_id+'/?download=1').status==403
    report['checks']['default_viewer_previews_exact_original_and_download_is_denied']=True

    def menu(action):
      a.get_by_role('button',name='Certificate actions: '+a.get_by_role('heading',level=1).inner_text(),exact=True).click()
      a.get_by_role('menuitem',name=action,exact=True).click()

    menu('Manage Access')
    dialog=a.get_by_role('dialog',name='Certificate Access — '+prefix+' Certificate',exact=True)
    dialog.get_by_label('Search Faculty and Staff',exact=True).fill(prefix)
    dialog.get_by_label('General access',exact=True).select_option('none')
    dialog.get_by_label('Certificate access for '+members[0].name,exact=True).select_option('download')
    dialog.get_by_label('Certificate access for '+members[1].name,exact=True).select_option('none')
    dialog.get_by_role('button',name='Save Changes',exact=True).click()
    a.get_by_text('Certificate permissions saved to the database.',exact=True).wait_for(timeout=20000)
    dialog.get_by_role('button',name='Cancel',exact=True).click()
    f.get_by_role('button',name='Download',exact=True).wait_for(timeout=20000)
    s.get_by_text(original,exact=True).wait_for(state='hidden',timeout=20000)
    assert f.request.get(API+'/api/repository/files/'+doc_id+'/?download=1').status==200
    assert s.request.get(API+'/api/repository/files/'+doc_id+'/').status==404
    report['checks']['mixed_individual_download_and_no_access_apply_live']=True

    menu('Rename Certificate')
    rename=a.get_by_role('dialog',name='Rename Certificate',exact=True)
    renamed=prefix+' Renamed Certificate'
    rename.get_by_label('Certificate name',exact=True).fill(renamed)
    rename.get_by_role('button',name='Save Changes',exact=True).click()
    f.get_by_role('heading',name=renamed,exact=True).wait_for(timeout=20000)
    report['checks']['rename_propagates_to_other_session_without_refresh']=True

    menu('Replace Certificate')
    replace=a.get_by_role('dialog',name='Replace Certificate',exact=True)
    replacement=prefix+' EXACT REPLACEMENT CERTIFICATE'
    replace.get_by_label('Replacement original',exact=True).set_input_files({'name':'replacement.txt','mimeType':'text/plain','buffer':replacement.encode()})
    replace.get_by_role('button',name='Save Changes',exact=True).click()
    f.get_by_text(replacement,exact=True).wait_for(timeout=25000)
    report['checks']['exact_replacement_updates_active_preview']=True

    # Revoke while Faculty remains in the full document viewer.
    plan=request(a,'/api/repository/certificates/preview/','POST',{'selection':{'ids':[doc_id]}})['body']
    result=request(a,'/api/repository/certificates/access/','POST',{'selection':{'ids':[doc_id]},'version':plan['version'],'users':[{'userId':members[0].pk,'level':'viewer'}]})
    assert result['status']==200,result
    f.get_by_role('button',name='Download',exact=True).wait_for(state='hidden',timeout=15000)
    assert f.request.get(API+'/api/repository/files/'+doc_id+'/?download=1').status==403
    report['checks']['live_download_downgrade_hides_control_and_server_rejects_download']=True
    plan=request(a,'/api/repository/certificates/preview/','POST',{'selection':{'ids':[doc_id]}})['body']
    result=request(a,'/api/repository/certificates/access/','POST',{'selection':{'ids':[doc_id]},'version':plan['version'],'users':[{'userId':members[0].pk,'level':'none'}]})
    assert result['status']==200,result
    f.get_by_text(replacement,exact=True).wait_for(state='hidden',timeout=20000)
    assert f.request.get(API+'/api/repository/files/'+doc_id+'/').status==404
    report['checks']['revocation_invalidates_active_view_and_direct_url']=True

    # Bulk configuration is available through the existing Upload Documents interface.
    a.goto(WEB+'/evidence/upload',wait_until='domcontentloaded')
    a.get_by_role('button',name='Certificate Access & Defaults',exact=True).click(timeout=30000)
    bulk=a.get_by_role('dialog',name='Certificate Access Management',exact=True)
    bulk.get_by_label('Certificate selection',exact=True).select_option('selected')
    bulk.get_by_label(renamed+' · tandag · IA',exact=True).check()
    bulk.get_by_role('button',name='Preview affected certificates',exact=True).click()
    bulk.get_by_text('1 certificates · 1 campuses · 1 features',exact=False).wait_for(timeout=15000)
    report['checks']['bulk_selection_counts_come_from_database']=True
    bulk.get_by_role('button',name='Default Settings',exact=True).click()
    bulk.get_by_label('Default permission',exact=True).wait_for()
    report['checks']['default_configuration_dialog_available']=True
    a.screenshot(path='exports/certificate-access-verification.png',full_page=True)
    browser.close()
finally:
    for _ in range(5):
        rows=list(RepositoryEntry.objects.filter(record_id__startswith=prefix,deleted=False).order_by('kind'))
        if not rows:break
        for row in sorted(rows,key=lambda r:0 if r.kind=='document' else 1):
            try:commit(row.record_id,None,row.kind)
            except Exception:pass
    CertificateDefault.objects.filter(folder__startswith=prefix).delete()
    PortalAccount.objects.filter(pk__in=[m.pk for m in members]).delete()
    Session.objects.filter(session_key__in=sessions).delete()
    Path('exports/certificate-browser-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report))
