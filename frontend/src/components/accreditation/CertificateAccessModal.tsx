import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { SearchIcon, AlertCircleIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { apiFetch } from '../../services/api/client';
import { usePortal } from '../../contexts/PortalContext';
import type { EvidenceDocument } from '../../types/evidence';

type Level = 'none' | 'viewer' | 'download' | 'reset';
type User = { id: string; name: string; role: string; campus: string; office: string; email: string; level: Level; allowCrossCampus: boolean };
type Plan = { version: string; certificates: number; campuses: number; features: number; eligibleUsers: number };
type DefaultRow = { id: number; level: Level; version: number; allow_cross_campus: boolean };

const FRAMEWORK_LABELS: Record<string, string> = {
  ia: 'Institutional Accreditation (IA)',
  pa: 'Program Accreditation (PA / AACCUP)',
  copc: 'Certificate of Program Compliance (COPC)',
  pqa: 'Philippine Quality Award (PQA)',
  iso: 'ISO 9001:2015 (ISO)'
};

async function call(path: string, body?: unknown) {
  const response = await apiFetch(
    '/api/repository/certificates/' + path,
    body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    60000
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || (Array.isArray(data) ? data.join(' ') : 'The operation could not be saved.'));
  return data;
}

export function CertificateAccessModal({
  document: doc,
  certificateIds,
  frameworkId,
  onClose
}: {
  document?: EvidenceDocument;
  certificateIds?: string[];
  frameworkId?: string;
  campusId?: string;
  onClose: () => void;
}) {
  const location = useLocation();
  const { documents, folders } = usePortal();

  // Detect the active accreditation feature (IA, PA, COPC, PQA, ISO)
  const activeFramework = (
    frameworkId ||
    doc?.frameworkId ||
    (['ia', 'pa', 'copc', 'pqa', 'iso'].find((f) => location.pathname.toLowerCase().includes(`/frameworks/${f}`)) || '')
  ).toLowerCase();

  // Scope certificates strictly to the active feature if one is active
  const featureCertificates = documents.filter(
    (d) => d.docType === 'Certificate' && (!activeFramework || (d.frameworkId || '').toLowerCase() === activeFramework)
  );

  const [tab, setTab] = useState<'access' | 'defaults'>('access');
  const [users, setUsers] = useState<User[]>([]);
  const [levels, setLevels] = useState<Record<string, Level>>({});
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [ids, setIds] = useState<string[]>(() => {
    if (doc) return [doc.id];
    if (certificateIds?.length) {
      return activeFramework
        ? certificateIds.filter((id) => {
            const found = documents.find((d) => d.id === id);
            return !found || (found.frameworkId || '').toLowerCase() === activeFramework;
          })
        : certificateIds;
    }
    return [];
  });
  const [selectionMode, setSelectionMode] = useState<'all' | 'selected'>(
    doc || certificateIds?.length ? 'selected' : 'all'
  );
  const [general, setGeneral] = useState<'viewer' | 'download' | 'none' | 'inherit' | ''>('');
  const [query, setQuery] = useState('');
  const [defaults, setDefaults] = useState<DefaultRow[]>([]);
  const [defaultLevel, setDefaultLevel] = useState<Level>('viewer');
  const [applyExisting, setApplyExisting] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [plan, setPlan] = useState<Plan>();

  const selection = doc
    ? { ids: [doc.id] }
    : selectionMode === 'selected'
    ? { ids: ids.length ? ids : featureCertificates.map((c) => c.id) }
    : activeFramework
    ? { framework: activeFramework, all: true }
    : { all: true };

  const load = async () => {
    setLoaded(false);
    setError('');
    try {
      const data = await call(doc ? 'access/?id=' + encodeURIComponent(doc.id) : 'defaults/');
      setUsers(data.users || []);
      const userLevels: Record<string, Level> = {};
      const customUsers = new Set<string>();
      (data.users || []).forEach((u: User) => {
        userLevels[u.id] = u.level;
        if (u.level && u.level !== 'reset') customUsers.add(u.id);
      });
      setLevels(userLevels);
      setSelectedUsers(customUsers);

      const config = await call('defaults/');
      setDefaults(config.defaults || []);
      const activeDefault = (config.defaults || []).find(
        (r: any) =>
          activeFramework
            ? r.framework === activeFramework
            : !r.campus && !r.framework && !r.area && !r.folder && !r.program
      );
      if (activeDefault) setDefaultLevel(activeDefault.level || 'viewer');

      if (doc) {
        setGeneral(data.general === 'download' ? 'download' : data.general === 'none' ? 'none' : 'viewer');
        setPlan(data.preview);
      }
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed.');
    }
  };

  useEffect(() => {
    void load();
  }, [doc?.id, activeFramework]);

  const preview = async () => {
    const p = await call('preview/', { selection });
    setPlan(p);
    return p as Plan;
  };

  const filteredUsers = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${u.name} ${u.email} ${u.role} ${u.campus || ''} ${u.office || ''}`.toLowerCase().includes(q);
  });

  // Sort users so that individuals with customized access appear first
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aCustom = levels[a.id] && levels[a.id] !== 'reset' ? 1 : 0;
    const bCustom = levels[b.id] && levels[b.id] !== 'reset' ? 1 : 0;
    if (aCustom !== bCustom) return bCustom - aCustom;
    return a.name.localeCompare(b.name);
  });

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      if (tab === 'defaults') {
        const defaultScope = activeFramework ? { framework: activeFramework } : {};
        const matchedDefault = defaults.find((r: any) => (activeFramework ? r.framework === activeFramework : !r.framework));
        const defaultSelection = activeFramework ? { framework: activeFramework, all: true } : { all: true };
        const p = applyExisting ? ((await call('preview/', { selection: defaultSelection })) as Plan) : undefined;
        await call('defaults/', {
          scope: defaultScope,
          level: defaultLevel,
          allowCrossCampus: true,
          version: matchedDefault?.version || 0,
          ...(p ? { applyExisting: { selection: defaultSelection, version: p.version, overwriteExceptions: false } } : {})
        });
        toast.success('Certificate default settings saved to the database.');
      } else {
        const p = await preview();
        if (!p.certificates) throw new Error('No certificates match this selection.');

        const updates = [...selectedUsers].map((id) => ({
          userId: id,
          level: levels[id] || 'reset',
          allowCrossCampus: true
        }));

        if (!general && updates.length === 0) {
          throw new Error('Please select General Access before saving.');
        }

        await call('access/', {
          selection,
          version: p.version,
          ...(general ? { general } : {}),
          allowCrossCampus: true,
          users: updates,
          overwriteExceptions: false
        });

        toast.success('Certificate permissions saved to the database.');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const title = doc
    ? `Certificate Access — ${doc.title}`
    : activeFramework
    ? `${FRAMEWORK_LABELS[activeFramework] || activeFramework.toUpperCase()} Certificate Access`
    : 'Certificate Access Management';

  const folderName = doc?.folderId ? folders.find((f) => f.id === doc.folderId)?.name : null;

  return (
    <Modal
      open
      onClose={busy ? () => { /* busy */ } : onClose}
      size="lg"
      zIndex="z-[85]"
      title={title}
      description={
        activeFramework
          ? `Configure viewing and download access for ${FRAMEWORK_LABELS[activeFramework] || activeFramework.toUpperCase()} certificates.`
          : 'Configure viewing and download access for Faculty and Staff.'
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs text-brand-600 hover:text-brand-800 underline"
              onClick={() => void preview().catch((e) => setError(e.message))}
            >
              Preview affected certificates
            </button>
            {plan && (
              <span role="status" className="text-xs text-brand-700 font-medium">
                {plan.certificates} certificates · {plan.campuses} campuses · {plan.features} features
              </span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={busy || !loaded} onClick={() => void save()}>
              {busy ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      }
    >
      {/* Mode / Tabs header */}
      <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
        <div className="flex gap-1.5">
          <button
            type="button"
            className={`btn btn-xs ${tab === 'access' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('access')}
          >
            Manage Access
          </button>
          <button
            type="button"
            className={`btn btn-xs ${tab === 'defaults' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('defaults')}
          >
            Default Settings
          </button>
        </div>
        {doc && (
          <span className="text-[11px] font-medium text-ink-muted">
            {doc.campus || doc.campusId} · {doc.frameworkId.toUpperCase()} {folderName ? `· ${folderName}` : ''}
          </span>
        )}
        {!doc && activeFramework && (
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 border border-brand-200">
            Feature: {activeFramework.toUpperCase()}
          </span>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-800">
          <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p>{error}</p>
            <button type="button" className="underline font-semibold mt-1" onClick={() => void load()}>
              Reload permissions
            </button>
          </div>
        </div>
      )}

      {!loaded && !error && (
        <div className="py-8 text-center text-xs text-ink-muted">Loading certificate access records…</div>
      )}

      {loaded && tab === 'defaults' && (
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
              Default Access for Newly Uploaded {activeFramework ? `${activeFramework.toUpperCase()} ` : ''}Certificates
            </label>
            <select
              aria-label="Default permission"
              className="input mt-1.5 w-full text-sm font-medium"
              value={defaultLevel}
              onChange={(e) => setDefaultLevel(e.target.value as Level)}
            >
              <option value="viewer">Viewer Only — All Faculty and Staff can view, but cannot download</option>
              <option value="download">View and Download — All Faculty and Staff can view and download</option>
              <option value="none">Restricted Access — Only Super Admin and explicitly authorized users</option>
            </select>
            <p className="mt-1 text-xs text-ink-muted">
              {activeFramework
                ? `New ${activeFramework.toUpperCase()} certificates automatically inherit this access setting upon upload.`
                : 'New certificates automatically inherit this access setting upon upload.'}
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs text-ink cursor-pointer pt-2">
            <input
              type="checkbox"
              className="rounded"
              checked={applyExisting}
              onChange={(e) => setApplyExisting(e.target.checked)}
            />
            <span>
              {activeFramework
                ? `Also apply this default to all existing ${activeFramework.toUpperCase()} certificates`
                : 'Also apply this default to all existing certificates across all campuses'}
            </span>
          </label>
        </div>
      )}

      {loaded && tab === 'access' && (
        <div className="space-y-5">
          {/* Target Certificate Selection (only shown when managing bulk / not on a single document) */}
          {!doc && (
            <div className="rounded-xl border border-line bg-canvas/40 p-3.5 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
                Certificates to Update
              </label>
              <select
                aria-label="Certificate selection"
                className="input w-full text-sm font-medium"
                value={selectionMode}
                onChange={(e) => {
                  setSelectionMode(e.target.value as 'all' | 'selected');
                  setPlan(undefined);
                }}
              >
                <option value="all">
                  {activeFramework
                    ? `All certificates in ${FRAMEWORK_LABELS[activeFramework] || activeFramework.toUpperCase()}`
                    : 'All certificates (all campuses and features from IA to ISO)'}
                </option>
                <option value="selected">
                  {activeFramework
                    ? `Selected ${activeFramework.toUpperCase()} certificates only (${ids.length} selected)`
                    : `Selected certificates only (${ids.length} selected)`}
                </option>
              </select>

              {selectionMode === 'selected' && (
                <div className="max-h-36 overflow-auto rounded-lg border border-line bg-white p-2 text-xs space-y-1 mt-2">
                  {featureCertificates.length === 0 ? (
                    <p className="p-3 text-center text-xs text-ink-muted">
                      No certificates found in {activeFramework ? activeFramework.toUpperCase() : 'the repository'}.
                    </p>
                  ) : (
                    featureCertificates.map((d) => (
                      <label
                        key={d.id}
                        className="flex items-center gap-2 p-1.5 hover:bg-brand-50 rounded cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={ids.includes(d.id)}
                          aria-label={`${d.title} · ${d.campusId} · ${d.frameworkId.toUpperCase()}`}
                          onChange={(e) => {
                            setIds((prev) => (e.target.checked ? [...prev, d.id] : prev.filter((id) => id !== d.id)));
                            setPlan(undefined);
                          }}
                        />
                        <span className="font-medium text-ink">{d.title}</span>
                        <span className="text-[11px] text-ink-muted">
                          · {d.campusId} · {d.frameworkId.toUpperCase()}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* 1. General Access for All Faculty & Staff */}
          <div className="rounded-xl border border-line bg-white p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-ink">General Access (All Faculty & Staff)</label>
                <p className="text-xs text-ink-muted">
                  {activeFramework
                    ? `Set baseline permissions for all eligible faculty and staff for ${activeFramework.toUpperCase()} certificates.`
                    : 'Set baseline permissions for all eligible faculty and staff across campuses.'}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  general === 'download'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : general === 'none'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : general === 'viewer'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {general === 'download'
                  ? 'View and Download'
                  : general === 'none'
                  ? 'Restricted'
                  : general === 'viewer'
                  ? 'Viewer Only'
                  : 'Select General Access'}
              </span>
            </div>

            <select
              aria-label="General access"
              className="input mt-2 w-full text-sm font-medium"
              value={general}
              onChange={(e) => setGeneral(e.target.value as any)}
            >
              <option value="">Select General Access</option>
              <option value="viewer">Viewer Only — All Faculty and Staff can view, but cannot download</option>
              <option value="download">View and Download — All Faculty and Staff can view and download</option>
              <option value="none">Restricted — Only specifically authorized Faculty and Staff below can access</option>
            </select>
          </div>

          {/* 2. Specific Faculty and Staff Access */}
          <div className="rounded-xl border border-line bg-white p-4 shadow-xs space-y-3">
            <div>
              <label className="block text-sm font-bold text-ink">Specific Faculty & Staff Permissions</label>
              <p className="text-xs text-ink-muted">
                Specify individual exceptions to override general access (e.g. grant download or revoke access).
              </p>
            </div>

            <div className="relative">
              <input
                aria-label="Search Faculty and Staff"
                type="text"
                className="input w-full pl-9 text-xs"
                placeholder="Search Faculty and Staff by name, email, campus, or department…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-ink-muted" />
            </div>

            <div className="max-h-64 divide-y divide-line overflow-auto rounded-lg border border-line bg-canvas/30">
              {sortedUsers.length === 0 ? (
                <p className="p-4 text-center text-xs text-ink-muted">No faculty or staff found matching "{query}"</p>
              ) : (
                sortedUsers.map((u) => {
                  const currentLevel = levels[u.id] || 'reset';
                  const isCustom = currentLevel !== 'reset';
                  return (
                    <div
                      key={u.id}
                      className={`flex flex-wrap items-center justify-between gap-3 p-2.5 text-xs transition ${
                        isCustom ? 'bg-brand-50/50' : 'hover:bg-brand-50/20'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-ink truncate">{u.name}</span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                              u.role === 'Faculty' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {u.role}
                          </span>
                          {isCustom && (
                            <span className="rounded-full bg-brand-200/80 px-1.5 py-0.2 text-[9px] font-bold text-brand-900">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-ink-muted truncate text-[11px] mt-0.5">
                          {u.email} {u.campus ? `· ${u.campus}` : ''} {u.office ? `· ${u.office}` : ''}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <select
                          aria-label={`Certificate access for ${u.name}`}
                          className={`input text-xs font-semibold py-1 px-2.5 ${
                            currentLevel === 'download'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                              : currentLevel === 'viewer'
                              ? 'text-blue-700 bg-blue-50 border-blue-300'
                              : currentLevel === 'none'
                              ? 'text-red-700 bg-red-50 border-red-300'
                              : 'text-ink-muted bg-white'
                          }`}
                          value={currentLevel}
                          onChange={(e) => {
                            const next = e.target.value as Level;
                            setLevels((prev) => ({ ...prev, [u.id]: next }));
                            setSelectedUsers((prev) => new Set([...prev, u.id]));
                          }}
                        >
                          <option value="reset">Follow General Access</option>
                          <option value="viewer">Viewer Only</option>
                          <option value="download">View and Download</option>
                          <option value="none">No Access</option>
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
