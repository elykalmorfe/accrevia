import React, { useState } from 'react';
import { LockIcon } from 'lucide-react';
import { SearchAnalytics } from './SearchAnalytics';
import { SharingStatistics } from './SharingStatistics';
import { RetrievalPerformance } from './RetrievalPerformance';

type UsageView = 'search' | 'sharing' | 'performance';

const views: { id: UsageView; label: string; restricted?: boolean }[] = [
  { id: 'search', label: 'Search activity' },
  { id: 'sharing', label: 'Sharing' },
  { id: 'performance', label: 'Search quality', restricted: true }
];

export function UsageReports({ initialView = 'search' }: { initialView?: UsageView }) {
  const [view, setView] = useState<UsageView>(initialView);

  return (
    <div className="space-y-4">
      <div className="inline-flex flex-wrap items-center rounded-lg border border-line bg-canvas p-0.5 text-xs font-medium" role="group" aria-label="Usage report">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            aria-pressed={view === v.id}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors ${
              view === v.id ? 'bg-surface font-semibold text-ink shadow-2xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {v.label}
            {v.restricted && <LockIcon className="h-3 w-3 text-ink-subtle" aria-label="Restricted" />}
          </button>
        ))}
      </div>

      {view === 'search' && <SearchAnalytics />}
      {view === 'sharing' && <SharingStatistics />}
      {view === 'performance' && <RetrievalPerformance />}
    </div>
  );
}

export type { UsageView };
