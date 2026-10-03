import React, { useEffect, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { Indicator } from '../../types/evidence';
import { Modal } from '../ui/Modal';

export function LinkDocumentsModal({ indicator, onClose }: {indicator: Indicator | null;onClose: () => void;}) {
  const { documents, updateDocument } = usePortal();
  const lookup = useLookup();
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!indicator) return;
    setText('');
    setSelected([]);
  }, [indicator]);

  const candidates = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return documents.
    filter((d) => d.status !== 'Archived' && d.indicatorId !== indicator?.id).
    filter((d) => !needle || `${d.title} ${d.keywords.join(' ')}`.toLowerCase().includes(needle));
  }, [documents, indicator, text]);

  const save = () => {
    if (!indicator) return;
    const criterion = lookup.criterion(indicator.criterionId);
    if (!criterion) return;
    selected.forEach((id) =>
    updateDocument(id, {
      frameworkId: criterion.frameworkId,
      areaId: criterion.areaId,
      criterionId: criterion.id,
      indicatorId: indicator.id,
      requirementId: indicator.requirements[0]?.id
    })
    );
    toast.success(`${selected.length} document${selected.length === 1 ? '' : 's'} linked to Indicator ${indicator.code}`);
    onClose();
  };

  const toggle = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  return (
    <Modal
      open={!!indicator}
      onClose={onClose}
      size="lg"
      title={indicator ? `Link documents to Indicator ${indicator.code}` : ''}
      description={indicator?.name}
      footer={
      <>
          <span className="mr-auto self-center text-[13px] text-ink-muted">{selected.length} selected</span>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={!selected.length} onClick={save}>Link documents</button>
        </>
      }>
      
      <div className="relative mb-3">
        <label htmlFor="link-search" className="sr-only">Filter documents</label>
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
        <input id="link-search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Filter documents by title or keyword" className="input pl-9" />
      </div>
      <p className="mb-2 text-xs text-ink-muted">Linking reclassifies the document under this indicator.</p>
      <ul className="max-h-[50vh] divide-y divide-line overflow-y-auto rounded-md border border-line">
        {candidates.map((d) =>
        <li key={d.id}>
            <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-canvas">
              <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggle(d.id)} className="mt-0.5 h-4 w-4 rounded border-line-strong accent-brand-600" />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-ink">{d.title}</span>
                <span className="block text-xs text-ink-muted">
                  Currently: {lookup.framework(d.frameworkId)?.shortName} · {lookup.criterion(d.criterionId)?.code} · Indicator {lookup.indicator(d.indicatorId)?.code} · {d.docType}
                </span>
              </span>
            </label>
          </li>
        )}
        {candidates.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-ink-muted">No documents match.</li>}
      </ul>
    </Modal>);

}