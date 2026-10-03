import React from 'react';
import { BookmarkIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { useAccess } from '../../hooks/useAccess';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { SharedDocumentRow } from '../../components/sharing/SharedDocumentRow';

export function SavedEvidence() {
  const { savedIds } = usePortal();
  const { accessibleDocuments, rightsFor } = useAccess();
  const items = accessibleDocuments.filter((d) => savedIds.includes(d.id));

  return (
    <>
      <PageHeader title="Saved Evidence" description="Documents you saved for quick reference. Saved items disappear if your access ends." />
      <section className="panel">
        {items.length ?
        <ul className="divide-y divide-line">
            {items.map((doc) => <SharedDocumentRow key={doc.id} doc={doc} shares={rightsFor(doc.id).shares} />)}
          </ul> :

        <EmptyState icon={BookmarkIcon} title="No saved evidence" description="Use Save on a document or search result to keep it here." />
        }
      </section>
    </>);

}