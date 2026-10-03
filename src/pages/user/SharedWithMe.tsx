import React, { useState } from 'react';
import { FolderOpenIcon, SearchIcon } from 'lucide-react';
import { useAccess } from '../../hooks/useAccess';
import { summarizeShares } from '../../utils/sharing';
import { PageHeader } from '../../components/ui/PageHeader';
import { SelectField } from '../../components/ui/SelectField';
import { EmptyState } from '../../components/ui/EmptyState';
import { SharedDocumentRow } from '../../components/sharing/SharedDocumentRow';

export function SharedWithMe() {
  const { accessibleDocuments, rightsFor } = useAccess();
  const [text, setText] = useState('');
  const [permission, setPermission] = useState('');

  const items = accessibleDocuments.
  map((doc) => ({ doc, shares: rightsFor(doc.id).shares })).
  filter((i) => {
    const canDownload = summarizeShares(i.shares).canDownload;
    if (permission === 'view' && canDownload) return false;
    if (permission === 'download' && !canDownload) return false;
    return !text.trim() || i.doc.title.toLowerCase().includes(text.trim().toLowerCase());
  }).
  sort((a, b) => summarizeShares(b.shares).sharedAt.localeCompare(summarizeShares(a.shares).sharedAt));

  return (
    <>
      <PageHeader title="Shared with Me" description="Only documents you are authorized to access appear here. Expired or revoked access is removed automatically." />
      <section className="panel">
        <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row">
          <div className="relative sm:w-72">
            <label htmlFor="swm-filter" className="sr-only">Filter documents</label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
            <input id="swm-filter" value={text} onChange={(e) => setText(e.target.value)} placeholder="Filter by title" className="input h-8 pl-9 text-[13px]" />
          </div>
          <SelectField compact hideLabel label="Permission" value={permission} onChange={setPermission} placeholder="All permissions" options={[{ value: 'view', label: 'View only' }, { value: 'download', label: 'Download allowed' }]} className="sm:w-48" />
        </div>
        {items.length ?
        <ul className="divide-y divide-line">
            {items.map((i) => <SharedDocumentRow key={i.doc.id} doc={i.doc} shares={i.shares} />)}
          </ul> :

        <EmptyState icon={FolderOpenIcon} title="No shared documents" description="Nothing matches, or no evidence has been shared with you yet." />
        }
      </section>
    </>);

}