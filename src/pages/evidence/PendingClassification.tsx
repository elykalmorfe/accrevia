import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { InboxIcon, ScanTextIcon, TriangleAlertIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { DocumentMetadata, PendingDocument } from '../../types/evidence';
import { emptyMetadata, missingRequiredFields } from '../../utils/metadata';
import { formatDateTime } from '../../utils/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { MetadataForm } from '../../components/documents/MetadataForm';

function fromPending(p: PendingDocument): DocumentMetadata {
  return {
    ...emptyMetadata(),
    title: p.extractedTitle,
    frameworkId: p.suggestion.frameworkId,
    areaId: p.suggestion.areaId,
    docType: p.suggestion.docType
  };
}

export function PendingClassification() {
  const { pending, classifyPending } = usePortal();
  const lookup = useLookup();
  const [selectedId, setSelectedId] = useState<string | null>(pending[0]?.id ?? null);
  const selected = pending.find((p) => p.id === selectedId) ?? pending[0] ?? null;
  const [meta, setMeta] = useState<DocumentMetadata>(() => selected ? fromPending(selected) : emptyMetadata());
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    if (selected) {
      setMeta(fromPending(selected));
      setMissing([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const goNext = () => {
    if (!selected) return;
    const idx = pending.findIndex((p) => p.id === selected.id);
    const next = pending[idx + 1] ?? pending[idx - 1];
    setSelectedId(next && next.id !== selected.id ? next.id : null);
  };

  const save = () => {
    if (!selected) return;
    const gaps = missingRequiredFields(meta);
    setMissing(gaps);
    if (gaps.length) return;
    classifyPending(selected.id, meta);
    toast.success('Classification saved', { description: `${meta.title} is now indexed and searchable.` });
    goNext();
  };

  return (
    <>
      <PageHeader
        title="Pending Classification"
        description="Uploaded documents that need administrator review. Assign metadata so each document is linked to the requirement it supports and appears in search." />
      

      {pending.length === 0 || !selected ?
      <div className="panel">
          <EmptyState
          icon={InboxIcon}
          title="All documents are classified"
          description="New uploads that need metadata will appear here."
          action={<Link to="/evidence/upload" className="btn btn-primary">Upload Evidence</Link>} />
        
        </div> :

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <section className="panel self-start lg:sticky lg:top-24" aria-labelledby="queue-title">
            <div className="border-b border-line px-4 py-3">
              <h2 id="queue-title" className="panel-title">Documents requiring review</h2>
              <p className="text-xs text-ink-muted">{pending.length} in queue · oldest first is last</p>
            </div>
            <ul className="max-h-[calc(100vh-14rem)] divide-y divide-line overflow-y-auto">
              {pending.map((p) => {
              const active = p.id === selected.id;
              return (
                <li key={p.id}>
                    <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    aria-current={active ? 'true' : undefined}
                    className={`w-full border-l-2 px-4 py-3 text-left transition-colors duration-150 ${
                    active ? 'border-brand-600 bg-brand-50' : 'border-transparent hover:bg-canvas'}`
                    }>
                    
                      <span className="block truncate text-[13px] font-medium text-ink">{p.extractedTitle}</span>
                      <span className="mt-0.5 block truncate text-xs text-ink-muted">{p.fileName}</span>
                      <span className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-subtle">
                        {p.ocr && <Badge tone="gold">OCR</Badge>}
                        <span className="truncate">{p.uploadedBy}</span>
                      </span>
                    </button>
                  </li>);

            })}
            </ul>
          </section>

          <section className="panel" aria-labelledby="classify-title">
            <div className="border-b border-line p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="warning" dot>
                  Pending classification
                </Badge>
                {selected.ocr &&
              <Badge tone="gold">
                    <ScanTextIcon className="h-3 w-3" aria-hidden="true" /> Text read with OCR
                  </Badge>
              }
              </div>
              <h2 id="classify-title" className="mt-2 text-lg font-semibold text-ink">
                {selected.extractedTitle}
              </h2>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                {selected.fileName} · {selected.fileType} · {selected.pages} page{selected.pages === 1 ? '' : 's'} · {selected.sizeMb} MB · uploaded by{' '}
                {selected.uploadedBy}, {formatDateTime(selected.uploadedAt)}
              </p>

              <div className="mt-4 rounded-md bg-canvas p-3">
                <p className="text-xs font-medium text-ink-muted">Extracted text</p>
                <p className="mt-1 font-serif text-[14px] leading-relaxed text-ink">“{selected.excerpt}”</p>
              </div>

              <p className="mt-4 text-[13px] text-ink">
                <span className="font-medium">Suggested classification:</span>{' '}
                {[
              lookup.framework(selected.suggestion.frameworkId)?.name,
              lookup.area(selected.suggestion.areaId)?.name,
              selected.suggestion.docType].

              filter(Boolean).
              join(' · ')}{' '}
                <span className="text-ink-muted">({Math.round(selected.suggestion.confidence * 100)}% confidence) — prefilled below, review before saving.</span>
              </p>
            </div>

            <div className="p-5">
              {missing.length > 0 &&
            <div role="alert" className="mb-5 flex gap-2.5 rounded-md border border-danger-100 bg-danger-50 px-3 py-2.5 text-[13px] text-danger-700">
                  <TriangleAlertIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Complete the required fields: {missing.join(', ')}.</span>
                </div>
            }
              <MetadataForm value={meta} onChange={(patch) => setMeta((m) => ({ ...m, ...patch }))} />
            </div>

            <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 rounded-b-lg border-t border-line bg-white px-5 py-4">
              <button type="button" className="btn btn-ghost" onClick={goNext} disabled={pending.length < 2}>
                Skip for now
              </button>
              <button type="button" className="btn btn-primary" onClick={save}>
                Save classification
              </button>
            </div>
          </section>
        </div>
      }
    </>);

}