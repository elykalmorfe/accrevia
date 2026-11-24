import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVerticalIcon, UsersIcon, HistoryIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { apiFetch } from '../../services/api/client';
import { useAreaAccess, type AccessLevel, type AreaScope } from '../../services/api/repositoryAccess';

type Member = {id: string; name: string; role: string; email: string; campus: string; level: AccessLevel};
type Audit = {id: number; actor_id: string; actor_role: string; user_id: string; action: string; resource_id: string; level: string; previous_level: string; previous: unknown; updated: unknown; created_at: string};
type Props = {scope: AreaScope; label: string; campusName: string; programName?: string};
const MODULES: Record<string, string> = {ia: 'Institutional Accreditation (IA)', pa: 'Program Accreditation (AACCUP)', pqa: 'Philippine Quality Award (PQA)'};

export function AreaAssignmentMenu(props: Props) {
  const {isSuperadmin} = useAreaAccess();
  const [menu, setMenu] = useState<{top: number; left: number} | null>(null);
  const [open, setOpen] = useState(false);
  const [historyOnly, setHistoryOnly] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close); window.addEventListener('resize', close); window.addEventListener('scroll', close, true);
    const escape = (event: KeyboardEvent) => {if (event.key === 'Escape') {close(); button.current?.focus();}};
    window.addEventListener('keydown', escape);
    return () => {window.removeEventListener('click', close); window.removeEventListener('resize', close); window.removeEventListener('scroll', close, true); window.removeEventListener('keydown', escape);};
  }, [menu]);
  if (!isSuperadmin) return null;
  return <>
    <button ref={button} type="button" aria-label={`Manage access: ${props.label}`} aria-haspopup="menu" aria-expanded={!!menu}
      className="rounded-lg p-2 text-ink-muted hover:bg-brand-50 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-300"
      onClick={event => {event.stopPropagation(); const rect = event.currentTarget.getBoundingClientRect(); setMenu(menu ? null : {top: Math.min(rect.bottom + 4, window.innerHeight - 110), left: Math.max(8, Math.min(rect.right - 252, window.innerWidth - 260))});}}>
      <MoreVerticalIcon className="h-4 w-4" />
    </button>
    {menu && createPortal(<div role="menu" aria-label={props.label} className="fixed z-[90] w-[252px] rounded-xl border border-line bg-white p-1 shadow-xl" style={menu} onClick={e => e.stopPropagation()}>
      <button role="menuitem" className="flex w-full items-center gap-2 rounded-lg p-3 text-left text-xs font-semibold hover:bg-brand-50"
        onClick={() => {setHistoryOnly(false); setMenu(null); setOpen(true);}}><UsersIcon className="h-4 w-4" />Manage Assigned Faculty/Staff</button>
      <button role="menuitem" className="flex w-full items-center gap-2 rounded-lg p-3 text-left text-xs hover:bg-brand-50"
        onClick={() => {setHistoryOnly(true); setMenu(null); setOpen(true);}}><HistoryIcon className="h-4 w-4" />View Area Activity History</button>
    </div>, document.body)}
    {open && createPortal(<AssignmentDialog {...props} historyOnly={historyOnly} onClose={() => setOpen(false)} />, document.body)}
  </>;
}

function AssignmentDialog({scope, label, campusName, programName, historyOnly, onClose}: Props & {historyOnly: boolean; onClose: () => void}) {
  const [users, setUsers] = useState<Member[]>([]);
  const [history, setHistory] = useState<Audit[]>([]);
  const [levels, setLevels] = useState<Record<string, AccessLevel>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [version, setVersion] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [stale, setStale] = useState(false);
  const load = async () => {
    setError(''); setLoaded(false);
    try {
      const res = await apiFetch('/api/repository/assignments/?' + new URLSearchParams({...scope, program: scope.program || ''}));
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not load faculty/staff.');
      setUsers(data.users); setLevels(Object.fromEntries(data.users.map((u: Member) => [u.id, u.level])));
      setSelected(new Set(data.users.filter((u: Member) => u.level !== 'none').map((u: Member) => u.id)));
      setVersion(data.version); setHistory(data.history); setLoaded(true); setStale(false);
    } catch (e) {setError(e instanceof Error ? e.message : 'Could not load assignments.');}
  };
  useEffect(() => {void load();}, [scope.campus, scope.framework, scope.area, scope.program]);
  useEffect(() => {const changed = () => setStale(true); window.addEventListener('accrevia-area-access-changed', changed); return () => window.removeEventListener('accrevia-area-access-changed', changed);}, []);
  const filtered = users.filter(u => (role === 'all' || u.role === role) && `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()));
  const save = async (revoke = false) => {
    const changes = users.map(u => ({userId: u.id, level: revoke ? (selected.has(u.id) ? 'none' : u.level) : levels[u.id]}))
      .filter(change => users.find(u => u.id === change.userId)?.level !== change.level);
    if (!changes.length) {toast.info('No assignment changes to save.'); return;}
    if ((revoke || changes.length >= 5 || changes.filter(c => c.level === 'none').length > 1) &&
      !window.confirm(`${revoke ? 'Revoke access for' : 'Change permissions for'} ${changes.length} faculty/staff member(s) in ${label}?`)) return;
    setBusy(true); setError('');
    try {
      const res = await apiFetch('/api/repository/assignments/', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({scope, version, assignments: changes})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Assignments could not be saved.');
      toast.success('Assignments saved to the database.'); await load();
    } catch (e) {setError(e instanceof Error ? e.message : 'Save failed.');} finally {setBusy(false);}
  };
  return <Modal open onClose={busy ? () => { /* busy */ } : onClose} zIndex="z-[80]" size="xl" title={historyOnly ? 'Area Activity History' : 'Manage Assigned Faculty & Staff'}
    description={`Campus: ${campusName} · Module: ${MODULES[scope.framework]}${programName ? ` · Program: ${programName}` : ''} · ${label}`}
    footer={<div className="flex w-full flex-wrap justify-end gap-2">
      {!historyOnly && <button className="btn btn-secondary" disabled={busy || !loaded || !selected.size} onClick={() => void save(true)}>Revoke Access</button>}
      <button className="btn btn-secondary" disabled={busy} onClick={onClose}>Cancel</button>
      {!historyOnly && <button className="btn btn-primary" disabled={busy || !loaded || stale} onClick={() => void save()}>{busy ? 'Saving…' : 'Save Assignments'}</button>}
    </div>}>
    {error && <div role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error} <button className="underline" onClick={() => void load()}>Reload assignments</button></div>}
    {stale && <div role="status" className="mb-3 rounded-lg bg-brand-50 p-3 text-sm">Permissions changed in another session. <button className="underline" onClick={() => void load()}>Reload assignments</button></div>}
    {!loaded && !error && <p>Loading database records…</p>}
    {loaded && !historyOnly && <>
      <div className="mb-3 flex flex-wrap gap-2">
        <input aria-label="Search faculty/staff" className="input min-w-48 flex-1" placeholder="Search by name or email…" value={query} onChange={e => setQuery(e.target.value)} />
        <select aria-label="Filter faculty/staff role" className="input" value={role} onChange={e => setRole(e.target.value)}><option value="all">All faculty/staff</option><option>Faculty</option><option>Staff</option></select>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <button className="btn btn-secondary btn-sm" onClick={() => setSelected(new Set(filtered.map(u => u.id)))}>Select All</button>
        <button className="btn btn-secondary btn-sm" onClick={() => setSelected(new Set())}>Clear Selection</button>
        <span>{selected.size} selected</span>
        <label>Set selected to <select aria-label="Permission for selected members" className="input ml-1" defaultValue="" onChange={e => {if (e.target.value) setLevels(prev => ({...prev, ...Object.fromEntries([...selected].map(id => [id, e.target.value as AccessLevel]))})); e.target.value = '';}}><option value="" disabled>Choose permission</option><option value="editor">Editor</option><option value="viewer">Viewer</option><option value="none">No Access</option></select></label>
      </div>
      <div className="divide-y divide-line rounded-xl border border-line">
        {filtered.map(u => <div key={u.id} className="flex flex-wrap items-center gap-3 p-3">
          <input type="checkbox" aria-label={`Select ${u.name}`} checked={selected.has(u.id)} onChange={e => setSelected(prev => {const next = new Set(prev); e.target.checked ? next.add(u.id) : next.delete(u.id); return next;})} />
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{u.name}</p><p className="break-all text-xs text-ink-muted">{u.role} · {u.email}</p></div>
          <select aria-label={`Access for ${u.name}`} className="input text-sm" value={levels[u.id]} onChange={e => {setLevels(prev => ({...prev, [u.id]: e.target.value as AccessLevel})); setSelected(prev => new Set([...prev, u.id]));}}><option value="none">No Access</option><option value="viewer">Viewer</option><option value="editor">Editor</option></select>
        </div>)}
        {!filtered.length && <p className="p-4 text-sm text-ink-muted">No eligible faculty/staff found.</p>}
      </div>
      <p className="mt-3 text-xs text-ink-muted">Editor: manage this area's folders and files. Viewer: browse and preview. No Access: area and protected resources are unavailable.</p>
    </>}
    {loaded && historyOnly && <ul className="divide-y divide-line text-sm">{history.map(a => <li key={a.id} className="py-3"><p className="font-semibold">{a.action.replace(/_/g, ' ')} {a.level ? `· ${a.previous_level || 'none'} → ${a.level}` : ''}</p><p className="break-all text-xs text-ink-muted">Actor: {a.actor_id} ({a.actor_role}) · {a.user_id || a.resource_id} · {new Date(a.created_at).toLocaleString()}</p>{Boolean(a.previous || a.updated) && <details className="mt-2 text-xs"><summary className="cursor-pointer text-brand-700">View changes</summary><pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded bg-canvas p-3">{JSON.stringify({before: a.previous, after: a.updated}, null, 2)}</pre></details>}</li>)}{!history.length && <li>No activity recorded for this area yet.</li>}</ul>}
  </Modal>;
}
