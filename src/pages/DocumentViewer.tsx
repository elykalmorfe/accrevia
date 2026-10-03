import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BookmarkCheckIcon,
  BookmarkIcon,
  DownloadIcon,
  FileQuestionIcon,
  PencilIcon,
  Share2Icon,
  ShieldCheckIcon,
  ZoomInIcon,
  ZoomOutIcon } from
'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../contexts/PortalContext';
import { useSharingDialogs } from '../contexts/SharingDialogsContext';
import { useLookup } from '../hooks/useLookup';
import { useAccess } from '../hooks/useAccess';
import { searchEvidence } from '../utils/search';
import { formatDate } from '../utils/format';
import { expiryLabel, shareStatus, summarizeShares } from '../utils/sharing';
import { DocumentPage } from '../components/documents/DocumentPage';
import { EditMetadataModal } from '../components/documents/EditMetadataModal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { FrameworkTag } from '../components/ui/FrameworkTag';
import { Highlight } from '../components/ui/Highlight';
import { EmptyState } from '../components/ui/EmptyState';
import { AccessRestricted } from '../components/sharing/AccessRestricted';
import { PermissionIndicator } from '../components/sharing/PermissionIndicator';
import { EvidenceDocument } from '../types/evidence';

export function DocumentViewer() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const navigate = useNavigate();
  const { documents, criteria, savedIds, toggleSaved, isAdmin, shares, logAccess } = usePortal();
  const { openShare, openManageAccess } = useSharingDialogs();
  const { rightsFor, accessibleDocuments } = useAccess();
  const lookup = useLookup();
  const [zoom, setZoom] = useState(100);
  const [activePassage, setActivePassage] = useState<number | null>(null);
  const [editing, setEditing] = useState<EvidenceDocument | null>(null);
  const loggedFor = useRef<string | null>(null);

  const doc = documents.find((d) => d.id === id);
  const rights = doc ? rightsFor(doc.id) : { canView: false, canDownload: false, shares: [] };

  useEffect(() => {
    if (!doc || loggedFor.current === doc.id) return;
    loggedFor.current = doc.id;
    if (rights.canView) logAccess('Viewed', doc.id);else
    logAccess('Access denied', doc.id, 'Attempted to open without permission');
  }, [doc, rights.canView, logAccess]);

  const terms = useMemo(() => {
    if (!doc || !query || !rights.canView) return [];
    return searchEvidence(query, [{ ...doc, status: 'Indexed' }], lookup)[0]?.terms ?? [];
  }, [doc, query, lookup, rights.canView]);

  if (!doc && isAdmin) {
    return (
      <div className="panel">
        <EmptyState icon={FileQuestionIcon} title="Document not found" description="This evidence document may have been removed or the link is incorrect." action={<Link to="/evidence" className="btn btn-primary">Go to All Evidence</Link>} />
      </div>);

  }

  // Never render content, metadata, or a download path without view permission.
  if (!doc || !rights.canView) return <AccessRestricted />;

  const framework = lookup.framework(doc.frameworkId);
  const area = lookup.area(doc.areaId);
  const criterion = lookup.criterion(doc.criterionId);
  const indicator = lookup.indicator(doc.indicatorId);
  const saved = savedIds.includes(doc.id);
  const docShares = shares.filter((s) => s.documentId === doc.id && shareStatus(s) === 'Active');
  const userCount = docShares.filter((s) => s.recipientType === 'user').length;
  const roleGroups = docShares.filter((s) => s.recipientType === 'role');
  const myAccess = !isAdmin ? summarizeShares(rights.shares) : null;

  const matches = doc.passages.map((text, index) => ({ text, index })).filter(({ text }) => terms.some((t) => text.toLowerCase().includes(t)));

  const pool = isAdmin ? documents : accessibleDocuments;
  const related = pool.
  filter((d) => d.id !== doc.id && d.status !== 'Archived' && (d.indicatorId === doc.indicatorId || d.criterionId === doc.criterionId)).
  sort((a, b) => Number(b.indicatorId === doc.indicatorId) - Number(a.indicatorId === doc.indicatorId)).
  slice(0, 5);

  const crossFramework = criteria.filter((c) => c.areaId === doc.areaId && c.id !== doc.criterionId);

  const info: [string, React.ReactNode][] = [
  ['Framework', framework?.name],
  ['Area', area?.name],
  ['Criterion', criterion ? `${criterion.code} – ${criterion.name}` : '—'],
  ['Indicator', indicator ? `${indicator.code} – ${indicator.name}` : '—'],
  ['Document type', doc.docType],
  ['Program', doc.program],
  ['Office', doc.office],
  ['Academic year', doc.academicYear],
  ['Accreditation cycle', doc.cycle],
  ['Upload date', formatDate(doc.dateAdded)],
  ['Processing status', <StatusBadge key="s" status={doc.status} />],
  ['Confidentiality', doc.confidentiality]];


  const download = () => {
    if (!rights.canDownload) return;
    logAccess('Downloaded', doc.id);
    toast.success(`Downloading ${doc.title}`, { description: 'Download recorded in the access log.' });
  };

  const jumpTo = (index: number) => {
    setActivePassage(index);
    document.getElementById(`passage-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      <div className="mb-5">
        <button
          type="button"
          onClick={() => query ? navigate(-1) : navigate(isAdmin ? '/evidence' : '/shared-with-me')}
          className="link inline-flex items-center gap-1.5 text-[13px]">
          
          <ArrowLeftIcon className="h-3.5 w-3.5" /> {query ? 'Back to search results' : isAdmin ? 'All Evidence' : 'Shared with Me'}
        </button>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <FrameworkTag frameworkId={doc.frameworkId} />
              {isAdmin ? <StatusBadge status={doc.status} /> : <PermissionIndicator canDownload={rights.canDownload} />}
              <span className="text-xs text-ink-muted">{doc.fileType} · {doc.pages} pages · {doc.sizeMb} MB</span>
            </div>
            <h1 className="mt-2 font-serif text-[26px] font-semibold leading-tight text-ink">{doc.title}</h1>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {isAdmin &&
            <>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(doc)}>
                  <PencilIcon className="h-4 w-4" /> Edit metadata
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => openShare(doc.id)}>
                  <Share2Icon className="h-4 w-4" /> Share
                </button>
              </>
            }
            <button type="button" className="btn btn-secondary" aria-pressed={saved} onClick={() => toast(toggleSaved(doc.id) ? 'Saved to your evidence list' : 'Removed from saved evidence')}>
              {saved ? <BookmarkCheckIcon className="h-4 w-4 text-brand-600" /> : <BookmarkIcon className="h-4 w-4" />}
              {saved ? 'Saved' : 'Save'}
            </button>
            {rights.canDownload &&
            <button type="button" className="btn btn-primary" onClick={download}>
                <DownloadIcon className="h-4 w-4" /> Download
              </button>
            }
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-label="Document preview" className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <span className="text-[13px] text-ink-muted">
              Page 1 of {doc.pages}
              {!rights.canDownload && <span className="ml-2 text-ink-subtle">· View only — download disabled</span>}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Zoom out" disabled={zoom <= 70} onClick={() => setZoom((z) => z - 10)}><ZoomOutIcon className="h-4 w-4" /></button>
              <span className="w-12 text-center text-[13px] tabular-nums text-ink-muted">{zoom}%</span>
              <button type="button" className="btn btn-ghost btn-icon" aria-label="Zoom in" disabled={zoom >= 130} onClick={() => setZoom((z) => z + 10)}><ZoomInIcon className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="max-h-[calc(100vh-14rem)] overflow-auto bg-canvas p-4 sm:p-8" onContextMenu={rights.canDownload ? undefined : (e) => e.preventDefault()}>
            <div style={{ width: `${zoom}%` }} className={`mx-auto min-w-[320px] ${rights.canDownload ? '' : 'select-none'}`}>
              <DocumentPage doc={doc} terms={terms} activePassage={activePassage} />
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          {query &&
          <section className="panel p-5" aria-labelledby="matches-heading">
              <h2 id="matches-heading" className="panel-title">Search Matches</h2>
              <p className="mt-0.5 text-xs text-ink-muted">{matches.length} passage{matches.length === 1 ? '' : 's'} matching “{query}”</p>
              {matches.length ?
            <ul className="mt-3 space-y-2">
                  {matches.map((m) =>
              <li key={m.index}>
                      <button
                  type="button"
                  onClick={() => jumpTo(m.index)}
                  className={`w-full rounded-md border px-3 py-2.5 text-left text-[13px] leading-relaxed transition-colors duration-150 ${activePassage === m.index ? 'border-brand-200 bg-brand-50' : 'border-line hover:bg-canvas'}`}>
                  
                        <Highlight text={m.text} terms={terms} />
                      </button>
                    </li>
              )}
                </ul> :

            <p className="mt-3 text-[13px] text-ink-muted">This document matched through its metadata rather than specific passages.</p>
            }
            </section>
          }

          {isAdmin ?
          <section className="panel p-5" aria-labelledby="access-heading">
              <div className="flex items-center justify-between gap-3">
                <h2 id="access-heading" className="panel-title">Access</h2>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => openManageAccess(doc.id)}>
                  <ShieldCheckIcon className="h-3.5 w-3.5" /> Manage Access
                </button>
              </div>
              {docShares.length ?
            <>
                  <p className="mt-2 text-[13px] text-ink">
                    Shared with <span className="font-semibold">{userCount} user{userCount === 1 ? '' : 's'}</span>
                    {roleGroups.length > 0 && <> and {roleGroups.map((r) => r.recipientName).join(', ')}</>}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {docShares.filter((s) => s.canDownload).length} can download · {docShares.filter((s) => !s.canDownload).length} view only
                  </p>
                </> :

            <p className="mt-2 text-[13px] text-ink-muted">Private — only administrators and QA personnel can open this document.</p>
            }
            </section> :

          myAccess &&
          <section className="panel p-5" aria-labelledby="my-access-heading">
                <h2 id="my-access-heading" className="panel-title">Your access</h2>
                <dl className="mt-3 grid grid-cols-[110px_minmax(0,1fr)] gap-y-2 text-[13px]">
                  <dt className="text-ink-muted">Permission</dt><dd><PermissionIndicator canDownload={rights.canDownload} /></dd>
                  <dt className="text-ink-muted">Shared by</dt><dd className="text-ink">{myAccess.sharedBy}</dd>
                  <dt className="text-ink-muted">Expires</dt><dd className="text-ink">{expiryLabel(myAccess.expiresAt)}</dd>
                </dl>
              </section>

          }

          <section className="panel p-5" aria-labelledby="info-heading">
            <h2 id="info-heading" className="panel-title">Evidence Information</h2>
            <dl className="mt-3 grid grid-cols-[minmax(0,130px)_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-[13px]">
              {info.map(([label, value]) =>
              <React.Fragment key={label}>
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="text-ink">{value}</dd>
                </React.Fragment>
              )}
            </dl>
          </section>

          <section className="panel p-5" aria-labelledby="criteria-heading">
            <h2 id="criteria-heading" className="panel-title">Related Criteria</h2>
            {criterion && (
            isAdmin ?
            <Link to={`/criteria/criteria?framework=${criterion.frameworkId}&criterion=${criterion.id}`} className="mt-3 block rounded-md border border-brand-100 bg-brand-50 px-3 py-2.5 text-[13px] hover:border-brand-200">
                  <span className="font-semibold text-brand-700">{criterion.code} – {criterion.name}</span>
                  <span className="block text-xs text-ink-muted">{framework?.name} · primary classification</span>
                </Link> :

            <div className="mt-3 rounded-md border border-brand-100 bg-brand-50 px-3 py-2.5 text-[13px]">
                  <span className="font-semibold text-brand-700">{criterion.code} – {criterion.name}</span>
                  <span className="block text-xs text-ink-muted">{framework?.name}</span>
                </div>)

            }
            {isAdmin && crossFramework.length > 0 &&
            <>
                <p className="mt-4 text-xs text-ink-muted">Same area in other frameworks</p>
                <ul className="mt-1.5 space-y-1">
                  {crossFramework.map((c) =>
                <li key={c.id}>
                      <Link to={`/criteria/criteria?framework=${c.frameworkId}&criterion=${c.id}`} className="flex items-center gap-2 rounded px-1 py-1 text-[13px] hover:bg-canvas">
                        <FrameworkTag frameworkId={c.frameworkId} />
                        <span className="truncate text-ink">{c.code} – {c.name}</span>
                      </Link>
                    </li>
                )}
                </ul>
              </>
            }
          </section>

          <section className="panel p-5" aria-labelledby="related-heading">
            <h2 id="related-heading" className="panel-title">Related Evidence</h2>
            {related.length ?
            <ul className="mt-2 divide-y divide-line">
                {related.map((r) =>
              <li key={r.id} className="py-2.5">
                    <Link to={`/documents/${r.id}${query ? `?q=${encodeURIComponent(query)}` : ''}`} className="text-[13px] font-medium text-ink hover:text-brand-700 hover:underline">{r.title}</Link>
                    <p className="text-xs text-ink-muted">{r.indicatorId === doc.indicatorId ? `Same indicator ${indicator?.code ?? ''}` : 'Same criterion'} · {r.docType}</p>
                  </li>
              )}
              </ul> :

            <p className="mt-2 text-[13px] text-ink-muted">{isAdmin ? 'No other documents are linked to this criterion yet.' : 'No other related evidence has been shared with you.'}</p>
            }
          </section>
        </aside>
      </div>

      {isAdmin && <EditMetadataModal doc={editing} onClose={() => setEditing(null)} />}
    </>);

}