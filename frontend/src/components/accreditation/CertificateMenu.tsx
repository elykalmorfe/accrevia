import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { MoreVerticalIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { useAreaAccess } from '../../services/api/repositoryAccess';
import { apiFetch } from '../../services/api/client';
import { Modal } from '../ui/Modal';
import { DocumentPreviewModal } from '../documents/DocumentPreviewModal';
import { downloadStoredFile } from '../../utils/fileStore';
import { CertificateAccessModal } from './CertificateAccessModal';
import type { EvidenceDocument } from '../../types/evidence';

export function CertificateMenu({doc}:{doc:EvidenceDocument}) {
  const {isSuperadmin}=useAreaAccess();
  const {folders,documents}=usePortal();
  const latest=documents.find(d=>d.id===doc.id) || doc;
  const [position,setPosition]=useState<{top:number;left:number}|null>(null);
  const [action,setAction]=useState('');
  const [name,setName]=useState(doc.title);
  const [folder,setFolder]=useState(doc.folderId || '');
  const [file,setFile]=useState<File>();
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const button=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!position)return;
    const close=()=>setPosition(null);
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){close();button.current?.focus();}};
    window.addEventListener('click',close);window.addEventListener('scroll',close,true);window.addEventListener('resize',close);window.addEventListener('keydown',key);
    return()=>{window.removeEventListener('click',close);window.removeEventListener('scroll',close,true);window.removeEventListener('resize',close);window.removeEventListener('keydown',key);};
  },[position]);
  if(doc.docType!=='Certificate')return null;
  const permissions=latest.certificateAccess;
  if(!isSuperadmin)return <span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700">{permissions?.canDownload?'View and Download':'Viewer Only'}</span>;
  const save=async(deleting=false)=>{
    if(deleting&&!window.confirm(`Delete certificate "${latest.title}"?`))return;
    setBusy(true);setError('');
    try{
      let data:EvidenceDocument={...latest};
      if(action==='Rename Certificate')data.title=name.trim();
      if(!data.title)throw new Error('Enter a certificate name.');
      if(action==='Move Certificate'){
        const target=folders.find(f=>f.id===folder);
        if(!target)throw new Error('Choose a destination folder.');
        if(target.sourceModule==='upload-documents' &&latest.sourceModule!=='upload-documents')throw new Error('Move source certificates within their originating accreditation repository.');
        data={...data,folderId:target.id,frameworkId:target.frameworkId,campusId:target.campusId==='*'?latest.campusId:target.campusId,campus:target.campus||latest.campus,areaId:target.areaId||(target.frameworkId===latest.frameworkId?latest.areaId:'')};
      }
      if(action==='Replace Certificate'){
        if(!file)throw new Error('Choose the exact replacement file.');
        const form=new FormData();form.set('file',file);form.set('campusId',latest.campusId || '');form.set('frameworkId',latest.frameworkId);form.set('areaId',latest.areaId);form.set('folderId',latest.folderId || '');form.set('context',latest.sourceModule || 'accreditation');
        const response=await apiFetch('/api/repository/files/',{method:'POST',body:form},120000);const staged=await response.json();
        if(!response.ok)throw new Error(staged.detail || 'Original could not be stored.');
        data={...data,...staged};
      }
      const response=await apiFetch('/api/repository/mutate/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operationId:crypto.randomUUID(),context:latest.sourceModule || 'accreditation',operations:[{kind:'document',id:latest.id,expectedVersion:latest.syncVersion || 0,data:deleting?null:data}]})},60000);
      const result=await response.json();if(!response.ok)throw new Error(result.detail || 'The certificate change was rejected.');
      toast.success(deleting?'Certificate deleted.':'Certificate saved.');setAction('');
    }catch(e){setError(e instanceof Error?e.message:'Save failed.');}finally{setBusy(false);}
  };
  return <>
    <button type="button" ref={button} aria-haspopup="menu" aria-expanded={!!position} aria-label={`Certificate actions: ${latest.title}`} className="rounded-lg p-2 text-ink-muted hover:bg-brand-50" onClick={e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();setPosition(position?null:{top:Math.max(8,Math.min(r.bottom+4,window.innerHeight-310)),left:Math.max(8,Math.min(r.right-220,window.innerWidth-228))});}}><MoreVerticalIcon className="h-4 w-4"/></button>
    {position&&createPortal(<div role="menu" aria-label={`Certificate: ${latest.title}`} className="fixed z-[95] w-[220px] rounded-xl border border-line bg-white p-1 shadow-xl" style={position} onClick={e=>e.stopPropagation()}>{['View Certificate','Download Certificate','Manage Access','Rename Certificate','Replace Certificate','Move Certificate','Delete Certificate'].map(label=><button key={label} role="menuitem" className={`block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-brand-50 ${label==='Delete Certificate'?'text-red-700':''}`} onClick={()=>{setPosition(null);setError('');setName(latest.title);setFolder(latest.folderId || '');setFile(undefined);if(label==='Download Certificate')void downloadStoredFile(latest.id,latest.title).then(ok=>{if(!ok)toast.error('The original certificate is unavailable.');});else setAction(label);}}>{label}</button>)}</div>,document.body)}
    {action==='View Certificate'&&createPortal(<DocumentPreviewModal doc={latest} onClose={()=>setAction('')} grantAccess/>,document.body)}
    {action==='Manage Access'&&createPortal(<CertificateAccessModal document={latest} onClose={()=>setAction('')}/>,document.body)}
    {['Rename Certificate','Replace Certificate','Move Certificate','Delete Certificate'].includes(action)&&createPortal(<Modal open onClose={busy?()=>{ /* busy */ }:()=>setAction('')} title={action} description={latest.title} zIndex="z-[85]" footer={<div className="flex gap-2"><button className="btn btn-secondary" onClick={()=>setAction('')} disabled={busy}>Cancel</button><button className="btn btn-primary" disabled={busy} onClick={()=>void save(action==='Delete Certificate')}>{busy?'Saving…':action==='Delete Certificate'?'Delete Certificate':'Save Changes'}</button></div>}>
      {error&&<p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
      {action==='Rename Certificate'&&<label className="text-sm">Certificate name<input className="input mt-2 w-full" value={name} onChange={e=>setName(e.target.value)}/></label>}
      {action==='Replace Certificate'&&<label className="text-sm">Replacement original<input type="file" className="mt-2 w-full" onChange={e=>setFile(e.target.files?.[0])}/></label>}
      {action==='Move Certificate'&&<label className="text-sm">Destination folder<select className="input mt-2 w-full" value={folder} onChange={e=>setFolder(e.target.value)}><option value="">Select folder</option>{folders.filter(f=>!f.syncViewOnly&&(f.sourceModule || 'accreditation')===(latest.sourceModule || 'accreditation')).map(f=><option value={f.id} key={f.id}>{f.name} · {f.campusId} · {f.frameworkId.toUpperCase()}</option>)}</select></label>}
      {action==='Delete Certificate'&&<p className="text-sm">Remove this certificate from the repository? The confirmation appears before deletion.</p>}
    </Modal>,document.body)}
  </>;
}

export function CertificateManagementButton({
  certificateIds,
  frameworkId,
  campusId
}: {
  certificateIds?: string[];
  frameworkId?: string;
  campusId?: string;
} = {}) {
  const { isSuperadmin } = useAreaAccess();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const currentFramework = (
    frameworkId ||
    ['ia', 'pa', 'copc', 'pqa', 'iso'].find((f) => location.pathname.toLowerCase().includes(`/frameworks/${f}`)) ||
    ''
  ).toLowerCase();

  if (!isSuperadmin) return null;
  return (
    <>
      <button className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>
        {certificateIds?.length
          ? `Certificate Access (${certificateIds.length})`
          : currentFramework
          ? `${currentFramework.toUpperCase()} Certificate Access`
          : 'Certificate Access & Defaults'}
      </button>
      {open &&
        createPortal(
          <CertificateAccessModal
            certificateIds={certificateIds}
            frameworkId={currentFramework}
            campusId={campusId}
            onClose={() => setOpen(false)}
          />,
          document.body
        )}
    </>
  );
}
