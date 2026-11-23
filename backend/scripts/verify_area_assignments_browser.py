"""Real Chrome sessions exercise assignment menus and live Editor/Viewer revocation.

Only uniquely named validation users/resources are created; existing accounts and files are preserved.
"""
import io
import json
import os
import re
import sys
import uuid
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from django.contrib.sessions.backends.db import SessionStore
from django.contrib.sessions.models import Session
from apps.auth.models import PortalAccount, RepositoryEntry, RepositoryAccessAssignment
from apps.auth.repository import mutate
from apps.auth.session_auth import SESSION_ACCOUNT_KEY, password_stamp
from playwright.sync_api import sync_playwright

API = 'http://127.0.0.1:8000'
WEB = 'http://127.0.0.1:5173'
prefix = 'area-browser-' + uuid.uuid4().hex[:10]
admin = PortalAccount.objects.filter(role='Superadmin', approval_status='approved', portal_status='Active').first()
assert admin
members = [PortalAccount.objects.create(id=prefix + suffix, email=prefix + suffix + '@validation.invalid', name=prefix + suffix,
    role=role, campus_id='tandag', approval_status='approved', portal_status='Active') for suffix, role in [('-editor','Faculty'),('-viewer','Staff')]]
sessions = []
report = {'prefix': prefix, 'checks': {}}
scope = {'campus':'tandag','framework':'ia','area':'area-i','program':''}


def request(page, path, method='GET', body=None):
    return page.evaluate('''async ({path, method, body}) => {
      const session = await fetch('http://127.0.0.1:8000/api/accounts/session/', {credentials:'include'}).then(r=>r.json());
      const response = await fetch('http://127.0.0.1:8000'+path, {method, credentials:'include', headers:{'Content-Type':'application/json','X-CSRFToken':session.csrfToken}, ...(body ? {body:JSON.stringify(body)} : {})});
      return {status:response.status,body:await response.json()};
    }''', {'path':path,'method':method,'body':body})


def wait_folder(page, name):
    for _ in range(30):
        found = next((f for f in request(page,'/api/repository/')['body']['folders'] if f.get('name') == name), None)
        if found: return found
        page.wait_for_timeout(500)
    raise AssertionError('Folder was not committed: '+name)


try:
  for account in [admin,*members]:
    store=SessionStore(); store[SESSION_ACCOUNT_KEY]=account.pk; store['portal_password_stamp']=password_stamp(account); store.save(); sessions.append(store.session_key)
  with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--disable-gpu', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'])
    pages = []
    for account, session_key in zip([admin,*members], sessions):
        context=browser.new_context(viewport={'width':1365,'height':900})
        context.add_cookies([{'name':'sessionid','value':session_key,'domain':'127.0.0.1','path':'/','httpOnly':True,'sameSite':'Lax'}])
        page=context.new_page(); pages.append(page)
        page.on('pageerror', lambda error: print('Browser error:', str(error)))
        page.on('console', lambda msg: print('Browser console:', msg.text[:500]) if msg.type == 'error' and '403' not in msg.text else None)
        page.goto(WEB+('/frameworks/ia' if account==admin else '/open/frameworks/ia'),wait_until='domcontentloaded')
    a,e,v=pages
    a.get_by_role('button',name=re.compile('^Manage access: Area 1:')).wait_for(timeout=30000)
    assert a.get_by_role('button',name=re.compile('^Manage access:')).count()==9
    report['checks']['nine_ia_menus']=True
    try:
        e.get_by_text('Your assigned accreditation areas',exact=True).wait_for(timeout=15000)
    except Exception:
        print('Faculty screen:', e.url, e.locator('body').inner_text()[:1800])
        e.screenshot(path='exports/area-faculty-debug.png')
        raise
    assert e.get_by_role('heading',name='Governance and Management',exact=True).count()==0
    report['checks']['unassigned_area_hidden']=True
    a.get_by_role('button',name=re.compile('^Manage access: Area 1:')).click()
    a.get_by_role('menuitem',name='Manage Assigned Faculty/Staff',exact=True).click()
    dialog=a.get_by_role('dialog',name='Manage Assigned Faculty & Staff',exact=True)
    dialog.get_by_label('Search faculty/staff').fill(prefix)
    dialog.get_by_label('Access for '+members[0].name,exact=True).select_option('editor')
    dialog.get_by_label('Access for '+members[1].name,exact=True).select_option('viewer')
    dialog.get_by_role('button',name='Save Assignments',exact=True).click()
    a.get_by_text('Assignments saved to the database.',exact=True).wait_for(timeout=15000)
    dialog.get_by_role('button',name='Cancel',exact=True).click()
    e.get_by_role('heading',name='Governance and Management',exact=True).wait_for(timeout=15000)
    v.get_by_role('heading',name='Governance and Management',exact=True).wait_for(timeout=15000)
    assert e.get_by_role('heading',name='Teaching, Learning, and Evaluation',exact=True).count()==0
    report['checks']['multiple_assignments_apply_live_without_reload']=True
    e.get_by_role('heading',name='Governance and Management',exact=True).click()
    # Opening an empty area offers the first evidence folder; populated areas use New Folder.
    try:
        e.get_by_label('Folder Name').wait_for(timeout=3000)
    except Exception:
        e.get_by_role('button',name=re.compile(r'New.*Folder|Create.*Folder')).first.click()
    name=prefix+' shared evidence'
    e.get_by_label('Folder Name').fill(name)
    e.get_by_role('dialog',name='Create Evidence Folder',exact=True).get_by_role('button',name='Create Folder',exact=True).click()
    folder=wait_folder(a,name)
    report['checks']['faculty_editor_folder_saved_to_mysql']=True
    v.get_by_role('heading',name='Governance and Management',exact=True).click()
    v.get_by_role('heading',name=name,exact=True).wait_for(timeout=15000)
    assert v.get_by_role('button',name='Upload Files / Folder',exact=True).count()==0
    assert v.get_by_role('button',name='New Folder',exact=True).count()==0
    report['checks']['viewer_sees_shared_record_without_edit_controls']=True
    staged=e.evaluate('''async ({text,folder})=>{
      const session=await fetch('http://127.0.0.1:8000/api/accounts/session/',{credentials:'include'}).then(r=>r.json());
      const form=new FormData();form.set('file',new Blob([text],{type:'text/plain'}),'real-original.txt');
      for(const [key,value] of Object.entries({campusId:'tandag',context:'accreditation',frameworkId:'ia',areaId:'area-i',folderId:folder})) form.set(key,value);
      const response=await fetch('http://127.0.0.1:8000/api/repository/files/',{method:'POST',credentials:'include',headers:{'X-CSRFToken':session.csrfToken},body:form});
      return {status:response.status,body:await response.json()};
    }''',{'text':prefix+' exact original','folder':folder['id']})
    assert staged['status']==200,staged
    doc={'id':prefix+'-file','title':prefix+' document','frameworkId':'ia','campusId':'tandag','areaId':'area-i','folderId':folder['id'],'fileType':'TXT','docType':'Report','status':'Processing','confidentiality':'Internal','uploadedBy':members[0].pk,'keywords':[],'passages':[],'sizeMb':0.001,'dateAdded':'2026-11-24',**staged['body']}
    saved=request(e,'/api/repository/mutate/','POST',{'operationId':str(uuid.uuid4()),'context':'accreditation','operations':[{'kind':'document','id':doc['id'],'expectedVersion':0,'data':doc}]})
    assert saved['status']==200,saved
    v.get_by_role('heading',name=name,exact=True).click()
    v.get_by_text(doc['title'],exact=True).first.wait_for(timeout=15000)
    v.get_by_role('button',name='Preview '+doc['title'],exact=True).click()
    v.get_by_text(prefix+' exact original',exact=True).wait_for(timeout=15000)
    report['checks']['staff_viewer_previews_exact_original_uploaded_by_editor']=True
    # Downgrade while the editor remains in an active area.
    state=request(a,'/api/repository/assignments/?campus=tandag&framework=ia&area=area-i&program=')['body']
    downgraded=request(a,'/api/repository/assignments/','POST',{'scope':scope,'version':state['version'],'assignments':[{'userId':members[0].pk,'level':'viewer'}]})
    assert downgraded['status']==200,downgraded
    e.bring_to_front()
    e.get_by_role('button',name='Upload Files / Folder',exact=True).wait_for(state='hidden',timeout=15000)
    forbidden=request(e,'/api/repository/mutate/','POST',{'operationId':str(uuid.uuid4()),'context':'accreditation','operations':[{'kind':'folder','id':prefix+'-denied','expectedVersion':0,'data':{'name':'Denied','frameworkId':'ia','campusId':'tandag','areaId':'area-i'}}]})
    assert forbidden['status']==403,forbidden
    report['checks']['live_downgrade_removes_controls_and_rejects_stale_write']=True
    state=request(a,'/api/repository/assignments/?campus=tandag&framework=ia&area=area-i&program=')['body']
    revoked=request(a,'/api/repository/assignments/','POST',{'scope':scope,'version':state['version'],'assignments':[{'userId':members[0].pk,'level':'none'},{'userId':members[1].pk,'level':'none'}]})
    assert revoked['status']==200,revoked
    v.bring_to_front()
    v.get_by_role('dialog',name=doc['title'],exact=True).wait_for(state='hidden',timeout=15000)
    assert doc['id'] not in [d['id'] for d in request(v,'/api/repository/')['body']['documents']]
    response=v.request.get(API+'/api/repository/files/'+doc['id']+'/')
    assert response.status==404,response.status
    report['checks']['live_revocation_closes_preview_and_blocks_original_url']=True
    a.goto(WEB+'/frameworks/pqa',wait_until='domcontentloaded')
    a.get_by_role('button',name=re.compile('^Manage access: Category 1:')).wait_for(timeout=30000)
    assert a.get_by_role('button',name=re.compile('^Manage access:')).count()==7
    report['checks']['seven_pqa_menus']=True
    a.goto(WEB+'/frameworks/pa',wait_until='domcontentloaded')
    a.get_by_role('button',name=re.compile(r'^Areas \(')).first.click(timeout=30000)
    a.get_by_role('button',name=re.compile('^Manage access: Area I:')).wait_for(timeout=15000)
    assert a.get_by_role('button',name=re.compile('^Manage access:')).count()==10
    report['checks']['ten_aaccup_menus_in_program_scope']=True
    a.screenshot(path='exports/area-assignment-verification.png',full_page=True)
    # Mobile entry point stays reachable without opening the area itself.
    a.set_viewport_size({'width':390,'height':844})
    a.get_by_role('button',name=re.compile('^Manage access: Area I:')).click()
    a.get_by_role('menuitem',name='Manage Assigned Faculty/Staff',exact=True).click()
    a.get_by_role('dialog',name='Manage Assigned Faculty & Staff',exact=True).wait_for()
    report['checks']['mobile_program_assignment_dialog']=True
    browser.close()
finally:
    # Clean up only records made by this validation, children before parents.
    for _ in range(10):
        rows=list(RepositoryEntry.objects.filter(deleted=False).filter(data__name__startswith=prefix)) + list(RepositoryEntry.objects.filter(deleted=False,record_id__startswith=prefix))
        if not rows: break
        for row in sorted({(r.kind,r.record_id):r for r in rows}.values(),key=lambda r:0 if r.kind=='document' else 1):
            try: mutate(admin,str(uuid.uuid4()),[{'kind':row.kind,'id':row.record_id,'expectedVersion':row.version,'data':None}],row.origin)
            except Exception: pass
    PortalAccount.objects.filter(pk__in=[m.pk for m in members]).delete()
    Session.objects.filter(session_key__in=sessions).delete()
    Path('exports/area-assignment-browser-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report))
