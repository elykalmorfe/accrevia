"""Index one unique temporary text original using the real models; remove only its index points."""
import io
import json
import os
import sys
import uuid
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
os.environ.setdefault('DJANGO_SETTINGS_MODULE','config.settings')
os.environ.setdefault('HF_HUB_OFFLINE','1')
os.environ.setdefault('HF_HUB_DISABLE_PROGRESS_BARS','1')
import django
django.setup()
from apps.auth.models import PortalAccount,RepositoryEntry,PortalFileContent
from apps.auth.portal_storage import store_file
from apps.auth.repository import mutate,changes
from apps.auth.repository_index import synchronize_index
from apps.documents.models import EvidenceDocument
from apps.ingestion.services.indexer import get_qdrant
from apps.ingestion.services.embedders import dense_backend_info
from apps.search.services.search_service import run_search
from django.conf import settings
from qdrant_client.http import models as qm

identity='repo-index-check-'+uuid.uuid4().hex[:12]
account=PortalAccount.objects.filter(role='Superadmin',portal_status='Active',approval_status='approved').first()
assert account
content=('Quality management accreditation evidence. The university conducts internal audits, reviews corrective actions, and evaluates its institutional quality management procedures. '+identity).encode()
file=store_file('repository-stage',account.pk+':'+identity,'quality-management.txt','text/plain',io.BytesIO(content))
report={'id':identity}
created=False
try:
    data={'id':identity,'title':'Temporary quality management index verification','frameworkId':'ia','campusId':'tandag',
          'docType':'Report','fileType':'TXT','fileRef':file.key,'storageSha256':file.content_id,'fileVersion':file.content_id,
          'uploadedBy':account.pk,'confidentiality':'Internal','status':'Processing','keywords':['quality','management']}
    result=mutate(account,str(uuid.uuid4()),[{'kind':'document','id':identity,'expectedVersion':0,'data':data}],'accreditation')
    created=True
    print('Indexing one test original using the real OCR/embedding pipeline...',flush=True)
    synchronize_index.run(identity)
    doc=EvidenceDocument.objects.get(pk=identity)
    assert doc.status=='Indexed',doc.error_message
    report['status']=doc.status
    report['chunks']=doc.chunk_count
    events=changes(account,result['revision'])['events']
    assert any(event.get('data',{}).get('status')=='Indexed' for event in events if event.get('data'))
    report['index_completion_live_event']=True
    results=run_search('internal audit quality management',filters={'documentIds':[identity]},limit=5)
    assert results and results[0]['doc']['id']==identity
    assert any('corrective actions' in passage for passage in results[0]['passages'])
    report['real_search_with_original_passage']=True
    report['embedding_backend']=dense_backend_info()['name']
    assert not dense_backend_info()['degraded']
finally:
    if created:
        entry=RepositoryEntry.objects.get(kind='document',record_id=identity)
        if not entry.deleted:
            mutate(account,str(uuid.uuid4()),[{'kind':'document','id':identity,'expectedVersion':entry.version,'data':None}],'accreditation')
        synchronize_index.run(identity)
        count=get_qdrant().count(settings.QDRANT_COLLECTION,count_filter=qm.Filter(must=[qm.FieldCondition(key='document_id',match=qm.MatchValue(value=identity))]),exact=True).count
        assert count==0
        report['test_index_points_removed']=True
        report['original_bytes_retained']=PortalFileContent.objects.filter(pk=file.content_id).exists()
    Path('exports/repository-index-verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report),flush=True)
