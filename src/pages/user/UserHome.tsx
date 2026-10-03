import React from 'react';
import { Link } from 'react-router-dom';
import { FolderOpenIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { useAccess } from '../../hooks/useAccess';
import { summarizeShares, TODAY } from '../../utils/sharing';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { SharedDocumentRow } from '../../components/sharing/SharedDocumentRow';

function daysUntil(date: string) {
  return Math.round((new Date(date).getTime() - new Date(TODAY).getTime()) / 86400000);
}

export function UserHome() {
  const { currentUser } = usePortal();
  const { accessibleDocuments, rightsFor } = useAccess();
  const items = accessibleDocuments.
  map((doc) => ({ doc, shares: rightsFor(doc.id).shares })).
  sort((a, b) => summarizeShares(b.shares).sharedAt.localeCompare(summarizeShares(a.shares).sharedAt));
  const downloadable = items.filter((i) => summarizeShares(i.shares).canDownload).length;
  const expiring = items.filter((i) => {
    const e = summarizeShares(i.shares).expiresAt;
    return e && daysUntil(e) <= 60;
  }).length;
  const firstName = currentUser.name.replace(/^(Dr\.|Prof\.|Engr\.)\s+/, '').split(' ')[0];

  return (
    <>
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Accreditation evidence the Quality Assurance Office has shared with you. Search only returns documents you have access to." />
      
      <dl className="panel mb-5 grid grid-cols-1 gap-px overflow-hidden bg-line sm:grid-cols-3">
        <div className="bg-white p-5"><dt className="text-[13px] text-ink-muted">Shared with you</dt><dd className="mt-1 text-3xl font-semibold tabular-nums text-ink">{items.length}</dd></div>
        <div className="bg-white p-5"><dt className="text-[13px] text-ink-muted">Download allowed</dt><dd className="mt-1 text-3xl font-semibold tabular-nums text-ink">{downloadable}</dd></div>
        <div className="bg-white p-5"><dt className="text-[13px] text-ink-muted">Access expiring within 60 days</dt><dd className={`mt-1 text-3xl font-semibold tabular-nums ${expiring ? 'text-warning-700' : 'text-ink'}`}>{expiring}</dd></div>
      </dl>
      <section className="panel" aria-labelledby="recent-shared">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="recent-shared" className="panel-title">Recently shared with you</h2>
          <Link to="/shared-with-me" className="link text-xs">View all</Link>
        </div>
        {items.length ?
        <ul className="divide-y divide-line">
            {items.slice(0, 5).map((i) => <SharedDocumentRow key={i.doc.id} doc={i.doc} shares={i.shares} />)}
          </ul> :

        <EmptyState icon={FolderOpenIcon} title="Nothing has been shared with you yet" description="When the Quality Assurance Office shares evidence with you, it will appear here." />
        }
      </section>
    </>);

}