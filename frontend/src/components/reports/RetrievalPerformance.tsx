import React from 'react';
import { GaugeIcon, LockIcon } from 'lucide-react';

export function RetrievalPerformance() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-md border border-line bg-white px-4 py-3 text-[13px] text-ink-muted">
        <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
        <span>Visible to administrators and researchers only.</span>
      </div>

      <div className="panel flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <GaugeIcon className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm font-semibold text-ink">No retrieval evaluation has been run yet</p>
        <p className="mt-1 max-w-md text-[13px] text-ink-muted">
          Precision, recall, ranking quality, and response-time results will appear here after the search pipeline is evaluated against annotated accreditation queries.
        </p>
      </div>
    </div>
  );
}
