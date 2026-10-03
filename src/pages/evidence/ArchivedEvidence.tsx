import React from 'react';
import { Link } from 'react-router-dom';
import { ArchiveIcon, ArchiveRestoreIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { formatDate } from '../../utils/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { FrameworkTag } from '../../components/ui/FrameworkTag';
import { EmptyState } from '../../components/ui/EmptyState';

export function ArchivedEvidence() {
  const { documents, updateDocument } = usePortal();
  const lookup = useLookup();
  const archived = documents.filter((d) => d.status === 'Archived');

  const restore = (id: string, title: string) => {
    updateDocument(id, { status: 'Indexed' });
    toast.success('Restored to All Evidence', { description: title });
  };

  return (
    <>
      <PageHeader
        title="Archived Evidence"
        description="Superseded or past-cycle documents. Archived evidence is kept for records but excluded from search results." />
      
      <section className="panel" aria-label="Archived documents">
        {archived.length === 0 ?
        <EmptyState icon={ArchiveIcon} title="No archived evidence" description="Documents you archive from All Evidence will appear here." /> :

        <ul className="divide-y divide-line">
            {archived.map((d) =>
          <li key={d.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link to={`/documents/${d.id}`} className="text-[13px] font-medium text-ink hover:text-brand-700 hover:underline">
                    {d.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <FrameworkTag frameworkId={d.frameworkId} />
                    <span>{lookup.criterion(d.criterionId)?.code}</span>
                    <span>·</span>
                    <span>AY {d.academicYear}</span>
                    <span>·</span>
                    <span>{d.cycle}</span>
                    <span>·</span>
                    <span>Added {formatDate(d.dateAdded)}</span>
                  </div>
                </div>
                <button type="button" className="btn btn-secondary btn-sm shrink-0 self-start sm:self-center" onClick={() => restore(d.id, d.title)}>
                  <ArchiveRestoreIcon className="h-3.5 w-3.5" /> Restore
                </button>
              </li>
          )}
          </ul>
        }
      </section>
    </>);

}