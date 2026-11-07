import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, FileStackIcon, RotateCcwIcon, TriangleAlertIcon } from 'lucide-react';
import { toast } from 'sonner';
import { processingStages } from '../../data/processing';
import { usePortal } from '../../contexts/PortalContext';
import { DocumentStatus } from '../../types/evidence';
import { JobStatus, ProcessingJob } from '../../types/processing';
import { formatNumber, formatTime } from '../../utils/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge, BadgeTone } from '../../components/ui/Badge';
import { StageTrack } from '../../components/processing/StageTrack';
import { ProcessingPipeline } from '../../components/processing/ProcessingPipeline';

const LAST = processingStages.length - 1;
const statusTone: Record<JobStatus, BadgeTone> = { Running: 'brand', Queued: 'neutral', Failed: 'danger', Completed: 'success' };

const jobFromStatus: Partial<Record<DocumentStatus, { status: JobStatus; stage: number }>> = {
  Indexed: { status: 'Completed', stage: LAST },
  Processing: { status: 'Running', stage: 3 },
  'Pending Classification': { status: 'Queued', stage: 0 },
  Failed: { status: 'Failed', stage: 1 }
};

export function DocumentProcessing() {
  const { documents, updateDocument } = usePortal();
  const jobs = useMemo<ProcessingJob[]>(
    () =>
      documents
        .flatMap((d) => {
          const job = jobFromStatus[d.status];
          if (!job) return [];
          return [{ id: d.id, fileName: d.title, stage: job.stage, status: job.status, startedAt: d.dateAdded, ocr: false, pages: d.pages }];
        })
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [documents]
  );
  const passageCount = useMemo(() => documents.reduce((sum, d) => sum + (d.passages?.length ?? 0), 0), [documents]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = jobs.find((j) => j.id === selectedId) ?? jobs[0];

  const count = (s: JobStatus) => jobs.filter((j) => j.status === s).length;

  const retry = (job: ProcessingJob) => {
    updateDocument(job.id, { status: 'Indexed' });
    toast(`Reprocessed ${job.fileName}`);
  };

  return (
    <>
      <div className="mb-3">
        <Link to="/evidence" className="btn btn-secondary btn-sm inline-flex items-center gap-1.5">
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to All Documents</span>
        </Link>
      </div>

      <PageHeader
        eyebrow="Document Management"
        title="Document Processing"
        description="Track how uploaded documents move through text extraction, chunking, and indexing before they become searchable." />
      

      <div className="panel mb-5 flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
        {(['Running', 'Queued', 'Failed', 'Completed'] as JobStatus[]).map((s) =>
        <div key={s} className="flex items-baseline gap-2">
            <span className={`text-xl font-semibold tabular-nums ${s === 'Failed' && count(s) ? 'text-danger-700' : 'text-ink'}`}>{count(s)}</span>
            <span className="text-[13px] text-ink-muted">{s}</span>
          </div>
        )}
        <div className="text-[13px] text-ink-muted sm:ml-auto">
          Search index: <span className="font-medium text-ink">{formatNumber(passageCount)}</span> passages
        </div>
      </div>

      {!selected ?
      <div className="panel flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
            <FileStackIcon className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm font-semibold text-ink">No documents have been processed yet</p>
          <p className="mt-1 max-w-sm text-[13px] text-ink-muted">Uploaded documents will appear here as they are extracted, chunked, and indexed.</p>
          <Link to="/evidence/upload" className="btn btn-primary btn-sm mt-5">Upload documents</Link>
        </div> :

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="panel overflow-hidden" aria-label="Processing jobs">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px]">
              <thead className="bg-canvas">
                <tr>
                  <th className="th">File</th>
                  <th className="th">Current stage</th>
                  <th className="th">Status</th>
                  <th className="th">Started</th>
                  <th className="th text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {jobs.map((job) =>
                <tr
                  key={job.id}
                  onClick={() => setSelectedId(job.id)}
                  className={`cursor-pointer ${job.id === selected.id ? 'bg-brand-50/60' : 'hover:bg-canvas/60'}`}>
                  
                    <td className="td">
                      <button type="button" className="text-left font-medium text-ink hover:text-brand-700" onClick={() => setSelectedId(job.id)}>
                        {job.fileName}
                      </button>
                      <p className="text-xs text-ink-subtle">
                        {job.pages} pages{job.ocr ? ' · OCR' : ''}
                      </p>
                    </td>
                    <td className="td">
                      <StageTrack stage={job.stage} failed={job.status === 'Failed'} queued={job.status === 'Queued'} />
                    </td>
                    <td className="td">
                      <Badge tone={statusTone[job.status]} dot>{job.status}</Badge>
                    </td>
                    <td className="td whitespace-nowrap text-ink-muted">{formatTime(job.startedAt)}</td>
                    <td className="td text-right">
                      {job.status === 'Failed' &&
                    <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => {e.stopPropagation();retry(job);}}>
                          <RotateCcwIcon className="h-3.5 w-3.5" /> Retry
                        </button>
                    }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-line md:hidden">
            {jobs.map((job) =>
            <li key={job.id}>
                <button type="button" onClick={() => setSelectedId(job.id)} className="w-full px-4 py-3 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[13px] font-medium text-ink">{job.fileName}</span>
                    <Badge tone={statusTone[job.status]} dot>{job.status}</Badge>
                  </div>
                  <div className="mt-2">
                    <StageTrack stage={job.stage} failed={job.status === 'Failed'} queued={job.status === 'Queued'} />
                  </div>
                </button>
              </li>
            )}
          </ul>
        </section>

        <aside className="panel self-start p-5 xl:sticky xl:top-24">
          <h2 className="panel-title">Pipeline status</h2>
          <p className="mt-0.5 truncate text-[13px] text-ink-muted" title={selected.fileName}>{selected.fileName}</p>
          {selected.note &&
          <div role="alert" className="mt-4 flex gap-2.5 rounded-md border border-danger-100 bg-danger-50 p-3 text-[13px] text-danger-700">
              <TriangleAlertIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{selected.note}</span>
            </div>
          }
          <div className="mt-5">
            <ProcessingPipeline stage={selected.stage} ocr={selected.ocr} failed={selected.status === 'Failed'} queued={selected.status === 'Queued'} />
          </div>
          {selected.status === 'Failed' &&
          <button type="button" className="btn btn-primary mt-5 w-full" onClick={() => retry(selected)}>
              <RotateCcwIcon className="h-4 w-4" /> Retry processing
            </button>
          }
        </aside>
      </div>
      }
    </>);

}
