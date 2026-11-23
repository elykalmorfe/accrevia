"""Two real Chrome contexts against running local services; only unique test IDs are changed."""
import hashlib
import json
import os
import re
import sys
import time
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
import django
django.setup()
from django.contrib.sessions.backends.db import SessionStore
from django.contrib.sessions.models import Session
from apps.auth.models import PortalAccount
from apps.auth.session_auth import SESSION_ACCOUNT_KEY, password_stamp
from playwright.sync_api import sync_playwright

prefix = 'repo-browser-' + uuid.uuid4().hex[:12]
account = PortalAccount.objects.filter(role='Superadmin', approval_status='approved',portal_status='Active').first()
assert account, 'An active Superadmin is required.'
sessions=[]
for _ in range(2):
    session=SessionStore()
    session[SESSION_ACCOUNT_KEY]=account.pk
    session['portal_password_stamp']=password_stamp(account)
    session.save()
    sessions.append(session.session_key)

report={'prefix':prefix,'checks':{}}
created=[]
API='http://127.0.0.1:8000'
WEB='http://127.0.0.1:5173'

def request(page,path,method='GET',body=None):
    return page.evaluate('''async ({path,method,body}) => {
      const session=await fetch('http://127.0.0.1:8000/api/accounts/session/',{credentials:'include'}).then(r=>r.json());
      const r=await fetch('http://127.0.0.1:8000'+path,{method,credentials:'include',headers:{'Content-Type':'application/json','X-CSRFToken':session.csrfToken},...(body?{body:JSON.stringify(body)}:{})});
      return {status:r.status,body:await r.json()};
    }''',{'path':path,'method':method,'body':body})

def mutate(page,kind,identity,data,context='accreditation',version=None,retries=3):
    state=request(page,'/api/repository/')['body']
    rows=state['folders' if kind=='folder' else 'documents']
    existing=next((row for row in rows if row['id']==identity),None)
    expected=version if version is not None else existing.get('syncVersion',0) if existing else 0
    result=request(page,'/api/repository/mutate/','POST',{'operationId':str(uuid.uuid4()),'context':context,'operations':[{'kind':kind,'id':identity,'expectedVersion':expected,'data':data}]})
    if result['status']==409 and version is None and retries>0:
      return mutate(page,kind,identity,data,context,retries=retries-1)
    return result

try:
  with sync_playwright() as playwright:
    browser=playwright.chromium.launch(executable_path=r'C:\Program Files\Google\Chrome\Application\chrome.exe',headless=True,args=['--disable-gpu'])
    contexts=[]
    for key in sessions:
      context=browser.new_context()
      context.add_cookies([{'name':'sessionid','value':key,'domain':'127.0.0.1','path':'/','httpOnly':True,'sameSite':'Lax'}])
      context.add_init_script('''window.__repositoryEvents=[];window.__repositoryStreamsOpened=0;const Original=window.EventSource;window.EventSource=function(...args){const stream=new Original(...args);if(String(args[0]).includes('/api/repository/events/')){stream.addEventListener('open',()=>window.__repositoryStreamsOpened++);stream.addEventListener('message',event=>window.__repositoryEvents.push(JSON.parse(event.data)));}return stream;};window.EventSource.prototype=Original.prototype;''')
      contexts.append(context)
    a,b=[context.new_page() for context in contexts]
    a.goto(WEB+'/frameworks/ia',wait_until='domcontentloaded')
    b.goto(WEB+'/evidence/upload?folder=folder-ia',wait_until='domcontentloaded')
    b.get_by_text('Connecting to the shared document repository…',exact=True).wait_for(state='hidden',timeout=30000)
    try:
      a.get_by_role('button',name=re.compile('Custom Folders')).first.click(timeout=30000)
    except Exception:
      print('Source page URL:',a.url)
      print('Source page text:',a.locator('body').inner_text()[:1600])
      a.screenshot(path='exports/repository-source-debug.png')
      raise
    folder={'id':prefix+'-folder','name':prefix+' source','code':'TEST','frameworkId':'ia','campusId':'tandag','campus':'Tandag','category':'Accreditation','description':'Temporary synchronization validation','color':'blue','createdAt':'2026-11-23'}
    b.wait_for_function('window.__repositoryStreamsOpened > 0',timeout=20000)
    started=time.monotonic()
    assert mutate(a,'folder',folder['id'],folder)['status']==200
    created.append(('folder',folder['id'],'accreditation'))
    b.get_by_role('heading',name=folder['name'],exact=True).first.wait_for(state='visible',timeout=10000)
    b.wait_for_function('(id)=>window.__repositoryEvents.some(batch=>batch.events.some(event=>event.id===id))',arg=folder['id'],timeout=10000)
    report['checks']['source_create_to_other_session_seconds']=round(time.monotonic()-started,2)
    renamed={**folder,'name':prefix+' renamed'}
    assert mutate(a,'folder',folder['id'],renamed)['status']==200
    b.get_by_role('heading',name=renamed['name'],exact=True).first.wait_for(state='visible',timeout=10000)
    report['checks']['rename_without_refresh']=True
    forbidden=mutate(b,'folder',folder['id'],{**renamed,'name':'Reverse write rejected'},'upload-documents')
    assert forbidden['status']==403, forbidden
    report['checks']['reverse_write_denied']=True
    private={**folder,'id':prefix+'-private','name':prefix+' independent','libraryOnly':True}
    assert mutate(b,'folder',private['id'],private,'upload-documents')['status']==200
    created.append(('folder',private['id'],'upload-documents'))
    b.get_by_text(private['name'],exact=True).first.wait_for(state='visible',timeout=10000)
    a.wait_for_timeout(2000)
    assert a.get_by_text(private['name'],exact=True).count()==0
    report['checks']['upload_origin_excluded_from_source_ui']=True
    nested={**folder,'id':prefix+'-nested','name':prefix+' nested','parentId':folder['id']}
    assert mutate(a,'folder',nested['id'],nested)['status']==200
    created.append(('folder',nested['id'],'accreditation'))
    b.get_by_role('heading',name=renamed['name'],exact=True).first.click()
    b.get_by_role('heading',name=nested['name'],exact=True).first.wait_for(state='visible',timeout=10000)
    report['checks']['nested_hierarchy_preserved']=True
    text='Original quality management accreditation evidence '+prefix
    staged=a.evaluate('''async (text)=>{const s=await fetch('http://127.0.0.1:8000/api/accounts/session/',{credentials:'include'}).then(r=>r.json());const form=new FormData();form.set('file',new Blob([text],{type:'text/plain'}),'quality-evidence.txt');form.set('campusId','tandag');form.set('context','accreditation');const r=await fetch('http://127.0.0.1:8000/api/repository/files/',{method:'POST',credentials:'include',headers:{'X-CSRFToken':s.csrfToken},body:form});return {status:r.status,body:await r.json()};}''',text)
    assert staged['status']==200, staged
    doc={'id':prefix+'-document','title':prefix+' original file','frameworkId':'ia','campusId':'tandag','folderId':nested['id'],'fileType':'TXT','docType':'Report','confidentiality':'Internal','status':'Processing','keywords':[], 'passages':[], 'dateAdded':'2026-11-23', 'sizeMb':0.001, 'uploadedBy':account.pk,**staged['body']}
    assert mutate(a,'document',doc['id'],doc)['status']==200
    created.append(('document',doc['id'],'accreditation'))
    b.get_by_role('heading',name=nested['name'],exact=True).first.click()
    b.get_by_text(doc['title'],exact=True).first.wait_for(state='visible',timeout=10000)
    content=b.evaluate('''async(id)=>{const r=await fetch('http://127.0.0.1:8000/api/repository/files/'+id+'/',{credentials:'include'});return {status:r.status,text:await r.text()};}''',doc['id'])
    assert content=={'status':200,'text':text},content
    report['checks']['exact_original_accessible_in_other_session']=True
    b.get_by_role('button',name='View Document',exact=True).first.click()
    b.get_by_text(text,exact=True).first.wait_for(state='visible',timeout=10000)
    replacement=text+' REPLACED ORIGINAL VERSION'
    next_file=a.evaluate("""async(text)=>{const s=await fetch('http://127.0.0.1:8000/api/accounts/session/',{credentials:'include'}).then(r=>r.json());const form=new FormData();form.set('file',new Blob([text],{type:'text/plain'}),'quality-evidence.txt');form.set('campusId','tandag');form.set('context','accreditation');const r=await fetch('http://127.0.0.1:8000/api/repository/files/',{method:'POST',credentials:'include',headers:{'X-CSRFToken':s.csrfToken},body:form});return {status:r.status,body:await r.json()};}""",replacement)
    assert next_file['status']==200
    assert mutate(a,'document',doc['id'],{**doc,**next_file['body']})['status']==200
    b.get_by_text(replacement,exact=True).first.wait_for(state='visible',timeout=15000)
    report['checks']['open_preview_updates_to_replacement_without_reload']=True
    b.get_by_role('button',name='Close dialog',exact=True).first.click()

    b.get_by_role('button',name=re.compile('Back to IA Folders')).first.click()
    b.get_by_label('Filter by campus',exact=True).select_option('tandag')
    contexts[1].set_offline(True)
    offline={**renamed,'name':prefix+' recovered'}
    assert mutate(a,'folder',folder['id'],offline)['status']==200
    contexts[1].set_offline(False)
    b.get_by_role('heading',name=offline['name'],exact=True).first.wait_for(state='visible',timeout=15000)
    report['checks']['reconnection_restores_current_state_without_reload']=True
    queued_name=prefix+' queued independent folder'
    contexts[1].set_offline(True)
    b.get_by_role('button',name='+ Add Subfolder',exact=True).click()
    b.get_by_label('Folder Name').fill(queued_name)
    b.get_by_role('button',name='Create Folder',exact=True).click()
    b.get_by_role('heading',name=queued_name,exact=True).wait_for(state='visible',timeout=10000)
    contexts[1].set_offline(False)
    queued=None
    for attempt in range(30):
      data=request(a,'/api/repository/')['body']
      matches=[item for item in data['folders'] if item.get('name')==queued_name]
      if matches:
        assert len(matches)==1
        queued=matches[0]
        break
      a.wait_for_timeout(1000)
    assert queued is not None,'Offline creation was not committed after reconnection.'
    assert queued['sourceModule']=='upload-documents'
    created.append(('folder',queued['id'],'upload-documents'))
    report['checks']['offline_user_operation_retried_once_without_duplicates']=True

    # Delete in dependency order; immutable original bytes remain available for retention.
    for kind,identity,context in reversed(created):
      result=mutate(a,kind,identity,None,context)
      assert result['status']==200,result
    created=[]
    b.get_by_role('heading',name=offline['name'],exact=True).wait_for(state='hidden',timeout=10000)
    report['checks']['source_delete_reflected']=True
    browser.close()
finally:
  from apps.auth.models import RepositoryEntry
  from apps.auth.repository import mutate as commit_cleanup
  for _ in range(20):
    from django.db.models import Q
    rows=list(RepositoryEntry.objects.filter(Q(record_id__startswith=prefix)|Q(data__name__startswith=prefix),deleted=False).order_by('kind'))
    if not rows: break
    for row in rows:
      try:
        commit_cleanup(account,str(uuid.uuid4()),[{'kind':row.kind,'id':row.record_id,'expectedVersion':row.version,'data':None}],row.origin)
      except Exception: pass
  Session.objects.filter(session_key__in=sessions).delete()
  Path('exports/repository-browser-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
  print(json.dumps(report))
  if created:
    print('Temporary validation records still require soft-delete cleanup:', [item[1] for item in created])
