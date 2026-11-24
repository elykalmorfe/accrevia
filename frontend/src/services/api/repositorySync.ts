import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { apiFetch, getApiBaseUrl, isApiConfigured } from './client';
import { getLocalStoredFile } from '../../utils/fileStore';
import type { EvidenceDocument, EvidenceFolder } from '../../types/evidence';
import { setRepositoryAccess, setCertificateVisibility } from './repositoryAccess';

type Row = (EvidenceDocument | EvidenceFolder) & {syncVersion?: number; sourceModule?: string; fileLocalStamp?: string; fileRef?: string; storageSha256?: string; fileVersion?: string};
type Event = {revision: number; kind: 'folder' | 'document'; id: string; data: Row | null};
type Operation = {kind: 'folder' | 'document'; id: string; expectedVersion: number; data: Row | null};
type Pending = {operationId: string; context: string; operations: Operation[]; blocked?: boolean};
const digest = (value: unknown): string => JSON.stringify(value, (_, item) => item && !Array.isArray(item) && typeof item === 'object'
  ? Object.fromEntries(Object.keys(item).filter(key => key !== 'syncVersion').sort().map(key => [key, item[key]])) : item);

export function useRepositorySync(accountId: string | undefined, folders: EvidenceFolder[], documents: EvidenceDocument[],
  setFolders: Dispatch<SetStateAction<EvidenceFolder[]>>, setDocuments: Dispatch<SetStateAction<EvidenceDocument[]>>, authorizationKey = '') {
  const [connected, setConnected] = useState(false);
  const observer = useRef<((folders: EvidenceFolder[], documents: EvidenceDocument[]) => void)>();
  const current = useRef({folders, documents}); current.current = {folders, documents};
  useEffect(() => {
    if (!accountId || !isApiConfigured()) return;
    const key = `accrevia-repository-outbox-${accountId}`;
    let pending: Pending[];
    try { pending = JSON.parse(localStorage.getItem(key) || '[]'); } catch { pending = []; }
    let stopped = false, ready = false, flushing = false, cursor = 0;
    let inFlightId = '';
    let stream: EventSource | undefined;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    const known = new Map<string, Row>();
    const revisions = new Map<string, number>();
    let rendered = new Map<string, Row>();
    const idFor = (kind: string, id: string) => `${kind}:${id}`;
    const persist = () => {
      try {localStorage.setItem(key, JSON.stringify(pending));}
      catch {toast.error('Pending changes could not be saved locally. Keep this tab open until the server saves them.');}
    };
    const publish = () => {
      const view = new Map(known);
      for (const batch of pending.filter(item => !item.blocked)) for (const op of batch.operations) {
        if (op.data) view.set(idFor(op.kind, op.id), op.data); else view.delete(idFor(op.kind, op.id));
      }
      rendered = view;
      setFolders([...view].filter(([id]) => id.startsWith('folder:')).map(([, data]) => data as EvidenceFolder));
      setDocuments([...view].filter(([id]) => id.startsWith('document:')).map(([, data]) => data as EvidenceDocument));
    };
    const apply = (events: Event[]) => {
      for (const event of events) {
        const key = idFor(event.kind, event.id);
        if (event.revision <= (revisions.get(key) || 0)) continue;
        revisions.set(key, event.revision);
        if (event.data) {
          if ((known.get(key)?.syncVersion || 0) <= (event.data.syncVersion || 0)) known.set(key, event.data);
        } else known.delete(key);
      }
    };
    async function snapshot(revalidatePending = false) {
      const response = await apiFetch('/api/repository/');
      if (!response.ok) throw new Error('The shared repository could not be loaded.');
      const data = await response.json();
      if (stopped) return;
      if (revalidatePending && /^(Faculty|Staff):/.test(authorizationKey)) {
        const available = new Map<string, Row>(known);
        for (const row of data.folders) available.set(idFor('folder', row.id), row);
        const grants = data.access?.assignments || [];
        const mayEdit = (op: Operation): boolean => {
          const row = op.data || available.get(idFor(op.kind, op.id));
          if (!row || row.libraryOnly || row.sourceModule === 'upload-documents') return false;
          let area = row.areaId;
          let parentId = (row as EvidenceFolder).parentId || (row as EvidenceDocument).folderId;
          const seen = new Set<string>();
          while (!area && parentId && !seen.has(parentId)) {
            seen.add(parentId);
            const parent = available.get(idFor('folder', parentId)) as EvidenceFolder | undefined;
            area = parent?.areaId; parentId = parent?.parentId;
          }
          return grants.some((grant: {campus: string; framework: string; area: string; level: string}) =>
            grant.level === 'editor' && grant.campus === row.campusId && grant.framework === row.frameworkId && grant.area === area?.toLowerCase());
        };
        for (const batch of pending) if (batch.operations.some(op => !mayEdit(op))) batch.blocked = true;
        persist();
      }
      setCertificateVisibility(accountId!,data.documents.filter((row:EvidenceDocument)=>row.docType==='Certificate').map((row:EvidenceDocument)=>row.id),[...known.values()].filter(row=>'docType' in row&&row.docType==='Certificate').map(row=>row.id));
      known.clear();
      for (const row of data.folders) known.set(idFor('folder', row.id), row);
      for (const row of data.documents) known.set(idFor('document', row.id), row);
      setRepositoryAccess(data.access);
      cursor = data.revision;
      for (const key of known.keys()) revisions.set(key, cursor);
      setConnected(true);
      ready = true; publish();
    }
    async function flush() {
      if (!ready || flushing || stopped) return;
      const batch = pending.find(item => !item.blocked);
      if (!batch) return;
      flushing = true;
      inFlightId = batch.operationId;
      try {
        // Publish metadata only after the original has been stored successfully.
        for (const op of batch.operations.filter(item => item.kind === 'document' && item.data)) {
          const local = await getLocalStoredFile(op.id).catch(() => undefined);
          if (local && op.data && op.data.fileLocalStamp !== local.storedAt && (!local.sha256 || local.sha256 !== (op.data as EvidenceDocument).storageSha256)) {
            const form = new FormData(); form.set('file', local.blob, local.name);
            form.set('campusId', op.data.campusId || ''); form.set('context', batch.context);
            form.set('frameworkId', op.data.frameworkId || ''); form.set('areaId', op.data.areaId || '');
            form.set('folderId', (op.data as EvidenceDocument).folderId || '');
            form.set('stageId', `${batch.operationId}:${op.id}`);
            const uploaded = await apiFetch('/api/repository/files/', {method: 'POST', body: form}, 120000);
            if (!uploaded.ok) throw new Error('The original file could not be stored. The change remains queued.');
            Object.assign(op.data, await uploaded.json(), {fileLocalStamp: local.storedAt});
            persist();
          }
        }
        const response = await apiFetch('/api/repository/mutate/', {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(batch)}, 60000);
        const result = await response.json();
        if (!response.ok) {
          if ([400, 403, 409].includes(response.status)) {
            batch.blocked = true; persist();
            toast.error(result.detail || (Array.isArray(result) ? result.join(' ') : 'Repository change rejected. Your attempted change is retained in the local outbox.'));
            console.error('Repository operation rejected', batch.operationId, result);
            await snapshot();
            return;
          }
          throw new Error(result.detail || 'Repository save failed; retrying.');
        }
        pending = pending.filter(item => item.operationId !== batch.operationId);
        apply(result.events);
        // Only our own acknowledged edits may advance the base version of queued follow-up edits.
        for (const event of result.events as Event[]) for (const later of pending) for (const op of later.operations) {
          if (op.kind === event.kind && op.id === event.id && event.data) {
            op.expectedVersion = event.data.syncVersion || 1;
            if (op.data) for (const field of ['fileRef','storageSha256','fileVersion','fileLocalStamp'] as const) {
              if (event.data[field] !== undefined) Object.assign(op.data,{[field]:event.data[field]});
            }
          }
        }
        persist(); publish();
      } catch (error) {
        console.error('Repository connection interrupted; queued operations will retry.', error);
      } finally {flushing = false;inFlightId = '';}
    }
    const depth = (op: Operation, ops: Operation[], visited = new Set<string>()): number => {
      const parent = (op.data as EvidenceFolder | null)?.parentId;
      if (!parent || visited.has(parent)) return 0;
      visited.add(parent);
      const item = ops.find(other => other.kind === 'folder' && other.id === parent);
      return item ? 1 + depth(item, ops, visited) : 0;
    };
    observer.current = (nextFolders, nextDocuments) => {
      if (!ready || stopped) return;
      const next = new Map<string, Row>();
      nextFolders.forEach(row => next.set(idFor('folder', row.id), row));
      nextDocuments.forEach(row => next.set(idFor('document', row.id), row));
      const ops: Operation[] = [];
      for (const [key, row] of next) if (!rendered.has(key) || digest(rendered.get(key)) !== digest(row)) {
        const kind = key.startsWith('folder:') ? 'folder' : 'document';
        ops.push({kind, id: row.id, expectedVersion: known.get(key)?.syncVersion || 0, data: row});
      }
      for (const [key, row] of rendered) if (!next.has(key)) ops.push({kind: key.startsWith('folder:') ? 'folder' : 'document', id: row.id, expectedVersion: known.get(key)?.syncVersion || 0, data:null});
      rendered = next;
      if (!ops.length) return;
      const context = window.location.pathname.startsWith('/evidence/upload') ? 'upload-documents' : 'accreditation';
      const creates = ops.filter(op => !!op.data);
      creates.sort((a,b) => a.kind === b.kind ? depth(a, creates) - depth(b, creates) : a.kind === 'folder' ? -1 : 1);
      const deletes = ops.filter(op => !op.data);
      const deletedRows = deletes.map(op => ({...op, data: known.get(idFor(op.kind,op.id)) || null}));
      deletes.sort((a,b) => a.kind === b.kind ? depth({...b,data:known.get(idFor(b.kind,b.id)) || null},deletedRows) - depth({...a,data:known.get(idFor(a.kind,a.id)) || null},deletedRows) : a.kind === 'document' ? -1 : 1);
      const ordered = [...creates,...deletes];
      for (let offset = 0; offset < ordered.length; offset += 400) pending.push({operationId: crypto.randomUUID(), context, operations:ordered.slice(offset,offset+400)});
      persist(); void flush();
    };
    const originalStored = (event: globalThis.Event) => {
      if (!ready || stopped) return;
      const {id,context} = (event as CustomEvent<{id:string;context:string}>).detail;
      const data = rendered.get(idFor('document',id));
      if (!data) return;
      if (pending.some(batch => !batch.blocked && batch.operationId !== inFlightId && batch.operations.some(op => op.kind === 'document' && op.id === id))) return;
      pending.push({operationId:crypto.randomUUID(),context,operations:[{kind:'document',id,expectedVersion:known.get(idFor('document',id))?.syncVersion || 0,data:{...data}}]});
      persist();void flush();
    };
    window.addEventListener('accrevia-original-stored',originalStored);
    async function recover() {
      if (stopped || !ready) return;
      try {
        const response = await apiFetch(`/api/repository/events/?poll=1&since=${cursor}`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.events.some((event: {kind: string}) => event.kind === 'access')) {
          await snapshot(true);
          window.dispatchEvent(new Event('accrevia-area-access-changed'));
        } else if (data.revision > cursor) {apply(data.events); cursor = data.revision; publish();}
      } catch { /* SSE reconnect and subsequent fallback retain the same cursor. */ }
      void flush();
    }
    function connect() {
      if (stopped || !ready) return;
      stream = new EventSource(`${getApiBaseUrl()}/api/repository/events/?since=${cursor}`, {withCredentials:true});
      stream.onmessage = async event => {
        const batch = JSON.parse(event.data);
        if (batch.events.some((event: {kind: string}) => event.kind === 'access')) {
          await snapshot(true);
          window.dispatchEvent(new Event('accrevia-area-access-changed'));
        } else if (batch.revision > cursor) {apply(batch.events); cursor = batch.revision; publish();}
      };
      stream.onerror = () => {stream?.close(); if (!stopped) reconnect = setTimeout(() => {void recover();connect();}, 2000);};
    }
    void (async () => {
      while (!stopped && !ready) {
        try {await snapshot();connect();void flush();} catch (error) {console.error(error); await new Promise(resolve => setTimeout(resolve, 2000));}
      }
    })();
    // Poll only as missed-event/reconnection fallback; ordinary delivery uses SSE.
    const fallback = setInterval(() => {void recover();}, 5000);
    return () => {stopped = true;setConnected(false);setRepositoryAccess();observer.current = undefined;stream?.close();clearTimeout(reconnect);clearInterval(fallback);window.removeEventListener('accrevia-original-stored',originalStored);};
  }, [accountId, authorizationKey, setFolders, setDocuments]);
  useEffect(() => {observer.current?.(folders, documents);}, [folders, documents]);
  return connected;
}
