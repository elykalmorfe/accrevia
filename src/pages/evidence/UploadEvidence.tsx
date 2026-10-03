import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheckIcon, CloudUploadIcon, FileTextIcon, XIcon } from 'lucide-react';
import { useUploadQueue } from '../../hooks/useUploadQueue';
import { processingStages } from '../../data/processing';
import { PageHeader } from '../../components/ui/PageHeader';
import { Switch } from '../../components/ui/Switch';
import { Badge } from '../../components/ui/Badge';
import { ProcessingPipeline } from '../../components/processing/ProcessingPipeline';

export function UploadEvidence() {
  const { items, selected, setSelectedId, addFiles, removeItem, forceOcr, setForceOcr, lastStage } = useUploadQueue();
  const [dragging, setDragging] = useState(false);
  const inProgress = items.filter((i) => i.stage < lastStage).length;

  return (
    <>
      <PageHeader
        title="Upload Evidence"
        description="Add accreditation evidence documents. Each file is processed automatically and becomes searchable once indexed. New uploads are private — only administrators and QA personnel can open them until you share them." />
      

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <label
            htmlFor="evidence-files"
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(Array.from(e.dataTransfer.files));
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white px-6 py-12 text-center transition-colors duration-150 focus-within:ring-2 focus-within:ring-brand-500 ${
            dragging ? 'border-brand-500 bg-brand-50' : 'border-line-strong hover:border-brand-500/60'}`
            }>
            
            <CloudUploadIcon className="h-9 w-9 text-brand-600" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-ink">Drag and drop evidence files here</p>
            <p className="mt-1 text-[13px] text-ink-muted">
              or <span className="link">browse files</span> from your computer
            </p>
            <p className="mt-3 text-xs text-ink-subtle">PDF, DOCX, XLSX, PPTX, JPG, PNG, TIFF · up to 50 MB each</p>
            <input
              id="evidence-files"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.pptx,.jpg,.jpeg,.png,.tif,.tiff"
              className="sr-only"
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []));
                e.target.value = '';
              }} />
            
          </label>

          <div className="panel flex items-start justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium text-ink">Run OCR on every file in this batch</p>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                Scanned PDFs and images are detected automatically. Turn this on for photocopied documents with a poor text layer.
              </p>
            </div>
            <Switch checked={forceOcr} onChange={setForceOcr} label="Run OCR on every file" />
          </div>

          <section className="panel" aria-labelledby="queue-heading">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 id="queue-heading" className="panel-title">Upload queue</h2>
              <span className="text-xs text-ink-muted">{inProgress ? `${inProgress} processing` : 'All files processed'}</span>
            </div>
            {items.length === 0 ?
            <p className="px-4 py-8 text-center text-[13px] text-ink-muted">No files in the queue.</p> :

            <ul className="divide-y divide-line">
                {items.map((item) => {
                const done = item.stage === lastStage;
                const isSelected = selected?.id === item.id;
                return (
                  <li key={item.id} className={`flex items-center gap-3 px-4 py-3 ${isSelected ? 'bg-brand-50/60' : ''}`}>
                      <button type="button" onClick={() => setSelectedId(item.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-pressed={isSelected}>
                        <FileTextIcon className="h-5 w-5 shrink-0 text-ink-subtle" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-medium text-ink">{item.name}</span>
                            {item.ocr && <Badge tone="gold">OCR</Badge>}
                          </span>
                          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-canvas">
                            <span
                            className={`block h-full rounded-full transition-[width] duration-300 ease-out ${done ? 'bg-success-600' : 'bg-brand-600'}`}
                            style={{ width: `${(item.stage + (done ? 0 : 0.5)) / lastStage * 100}%` }} />
                          
                          </span>
                          <span className="mt-1 block text-xs text-ink-muted">
                            {item.fileType} · {item.sizeMb} MB ·{' '}
                            {done ? <span className="text-success-700">Ready for Retrieval</span> : processingStages[item.stage].label}
                          </span>
                        </span>
                      </button>
                      {done &&
                    <button type="button" onClick={() => removeItem(item.id)} className="btn btn-ghost btn-icon" aria-label={`Remove ${item.name} from queue`}>
                          <XIcon className="h-4 w-4" />
                        </button>
                    }
                    </li>);

              })}
              </ul>
            }
          </section>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <section className="panel p-5" aria-labelledby="pipeline-heading">
            <h2 id="pipeline-heading" className="panel-title">Document Processing</h2>
            {selected ?
            <>
                <p className="mt-0.5 truncate text-[13px] text-ink-muted" title={selected.name}>
                  {selected.name}
                </p>
                <div className="mt-5">
                  <ProcessingPipeline stage={selected.stage} ocr={selected.ocr} />
                </div>
                {selected.stage === lastStage &&
              <div className="mt-5 rounded-md border border-success-100 bg-success-50 p-3">
                    <p className="flex items-center gap-2 text-[13px] font-medium text-success-700">
                      <CircleCheckIcon className="h-4 w-4" aria-hidden="true" /> Ready for Retrieval
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">Confirm its framework, criterion, and indicator so it ranks correctly in search.</p>
                    <Link to="/evidence/pending" className="btn btn-secondary btn-sm mt-3">
                      Classify in Pending Classification
                    </Link>
                  </div>
              }
              </> :

            <p className="mt-2 text-[13px] text-ink-muted">Upload a file to see its processing status.</p>
            }
          </section>
        </aside>
      </div>
    </>);

}