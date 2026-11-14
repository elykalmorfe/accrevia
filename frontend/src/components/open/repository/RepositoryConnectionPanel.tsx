import { useCallback, useEffect, useState } from 'react';
import { ExternalLinkIcon, Loader2Icon, RefreshCwIcon } from 'lucide-react';
import { getRepositoryStatus } from '../../../services/repository/repositoryService';
import type { RepositoryStatusSnapshot } from '../../../types/accreditationRepository';

export function RepositoryConnectionPanel() {
  const [status, setStatus] = useState<RepositoryStatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await getRepositoryStatus());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">Catalog source</p>
          {loading || !status ? (
            <p className="mt-2 inline-flex items-center gap-2 text-[13px] font-medium text-ink-muted">
              <Loader2Icon className="h-4 w-4 animate-spin" /> Loading catalog status…
            </p>
          ) : (
            <div className="mt-2 space-y-1 text-[13px] font-medium text-ink-muted">
              <p>
                Mode:{' '}
                <span className="font-semibold text-ink">{status.label}</span>
                <span className="ml-2 rounded-full border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-800">
                  {status.mode}
                </span>
              </p>
              <p className="text-[12px] text-ink-subtle">{status.description}</p>
              <p>
                Verified certificates:{' '}
                <span className="tabular-nums text-ink">
                  {status.stats.certificates.verifiedDocuments ?? status.stats.certificates.documents} files /{' '}
                  {status.stats.certificates.folders} folders
                </span>
              </p>
              <p>
                Verified COPC rows:{' '}
                <span className="tabular-nums text-ink">
                  {status.stats.copc.verifiedRecords ?? status.stats.copc.records}
                </span>
                {typeof status.stats.copc.demonstrationRecords === 'number' ? (
                  <span className="text-ink-subtle">
                    {' '}
                    · {status.stats.copc.demonstrationRecords} demonstration fixtures retained
                  </span>
                ) : null}
              </p>
              <p className="text-[12px] text-ink-subtle">
                Technical review demo states: {status.stats.technicalReviews.demoRequests} (no restricted filenames shown)
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={status.sampleCertificatesFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:underline"
                >
                  Sample certificates folder
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
                <a
                  href={status.sampleCopcSpreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:underline"
                >
                  Sample COPC spreadsheet
                  <ExternalLinkIcon className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm shrink-0"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Refresh catalog status"
          aria-busy={loading}
        >
          <RefreshCwIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Refresh
        </button>
      </div>
    </div>
  );
}
