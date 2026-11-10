import { useEffect, useMemo, useState } from 'react';
import { CheckIcon, LibraryIcon, SearchIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { EvidenceDocument } from '../../types/evidence';
import { RequestAttachment } from '../../types/request';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';

interface AttachDocumentsModalProps {
  open: boolean;
  onClose: () => void;
  onAttach: (attachments: RequestAttachment[]) => void;
  /** Repository documents already attached to the draft. */
  excludeIds?: string[];
}

const MAX_RESULTS = 100;

function toAttachment(doc: EvidenceDocument): RequestAttachment {
  return {
    id: `ratt-doc-${doc.id}-${Date.now()}`,
    kind: 'document',
    name: doc.title,
    fileType: doc.fileType,
    sizeMb: doc.sizeMb,
    documentId: doc.id
  };
}

export function AttachDocumentsModal({ open, onClose, onAttach, excludeIds = [] }: AttachDocumentsModalProps) {
  const { documents } = usePortal();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected([]);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents
      .filter((d) => d.status !== 'Archived' && !excludeIds.includes(d.id))
      .filter(
        (d) =>
          !q ||
          [d.title, d.program, d.campus, d.docType, d.commonDocType ?? '', ...d.keywords].some((v) => v?.toLowerCase().includes(q))
      )
      .slice(0, MAX_RESULTS);
  }, [documents, query, excludeIds]);

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const attach = () => {
    onAttach(documents.filter((d) => selected.includes(d.id)).map(toAttachment));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Attach from repository"
      description="Selected documents are shared with the requester (view and download) when you send the reply."
      size="lg"
      zIndex="z-[60]"
      footer={
        <>
          <span className="mr-auto self-center text-xs text-ink-muted">{selected.length} selected</span>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={attach} disabled={selected.length === 0} className="btn btn-primary disabled:opacity-50">
            Attach {selected.length > 0 ? `(${selected.length})` : ''}
          </button>
        </>
      }
    >
      <div className="relative mb-3">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, program, campus or keyword"
          className="input pl-9"
          autoFocus
        />
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={LibraryIcon}
          title={documents.length === 0 ? 'No documents in the repository yet' : 'No matching documents'}
          description={documents.length === 0 ? 'Upload documents first, or attach files from your computer instead.' : 'Try a different search term.'}
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {results.map((doc) => {
            const checked = selected.includes(doc.id);
            return (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => toggle(doc.id)}
                  aria-pressed={checked}
                  className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors ${
                    checked ? 'bg-brand-50/70' : 'hover:bg-canvas'
                  }`}
                >
                  <span
                    className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded border ${
                      checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-line-strong bg-white'
                    }`}
                  >
                    {checked && <CheckIcon className="h-3 w-3" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{doc.title}</p>
                    <p className="truncate text-[11px] text-ink-subtle">
                      {[doc.commonDocType || doc.docType, doc.program, doc.campus].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium text-ink-subtle">
                    {doc.fileType} · {doc.sizeMb} MB
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
