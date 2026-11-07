import React, { useMemo } from 'react';
import { useLookup } from '../../hooks/useLookup';
import { usePortal } from '../../contexts/PortalContext';
import { BarList, BarItem } from '../ui/BarList';
import { formatNumber } from '../../utils/format';

function countBy<T>(items: T[], key: (item: T) => string | undefined): Map<string, number> {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const k = key(item);
    if (k) counts.set(k, (counts.get(k) || 0) + 1);
  });
  return counts;
}

export function EvidenceStatistics() {
  const lookup = useLookup();
  const { filteredDocuments, selectedCampus, selectedCampusObj, frameworks, areas } = usePortal();

  const byFramework = useMemo<BarItem[]>(() => {
    const counts = countBy(filteredDocuments, (d) => d.frameworkId);
    return frameworks
      .map((f) => ({ label: f.name, value: counts.get(f.id) || 0 }))
      .filter((i) => i.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredDocuments, frameworks]);

  const byYear = useMemo<BarItem[]>(() => {
    const counts = countBy(filteredDocuments, (d) => d.academicYear);
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.label.localeCompare(a.label));
  }, [filteredDocuments]);

  const byArea = useMemo<BarItem[]>(() => {
    const counts = countBy(filteredDocuments, (d) => d.areaId);
    return areas
      .map((a) => ({ label: a.name, value: counts.get(a.id) || 0 }))
      .filter((a) => a.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredDocuments, areas]);

  const topCriteria = useMemo<BarItem[]>(() => {
    const counts = countBy(filteredDocuments, (d) => d.criterionId);
    return [...counts.entries()]
      .map(([critId, value]) => {
        const criterion = lookup.criterion(critId);
        const fw = criterion ? lookup.framework(criterion.frameworkId)?.shortName : '';
        return { label: `${fw} · ${criterion?.code || critId} – ${criterion?.name || ''}`, value };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredDocuments, lookup]);

  const emptyText = 'No documents uploaded yet.';

  return (
    <div className="space-y-4">
      {selectedCampus !== 'all' && (
        <div className="rounded-lg border border-brand-200 bg-brand-50/60 px-4 py-2.5 text-xs text-brand-900 flex items-center justify-between">
          <span>Evidence statistics filtered for <strong>{selectedCampusObj?.name}</strong></span>
          <span className="font-semibold text-brand-700">{filteredDocuments.length} files in campus repository</span>
        </div>
      )}
      <div className="panel flex flex-wrap items-end gap-x-10 gap-y-3 p-5">
        <div>
          <p className="text-[13px] text-ink-muted">
            {selectedCampus === 'all' ? 'Total institutional documents' : `Documents for ${selectedCampusObj?.shortName || 'Campus'}`}
          </p>
          <p className="font-serif text-4xl font-semibold text-ink">{formatNumber(filteredDocuments.length)}</p>
        </div>
        <p className="max-w-lg text-[13px] text-ink-muted">
          {filteredDocuments.length === 0
            ? 'Statistics will appear here once evidence documents are uploaded to the repository.'
            : `Counts reflect every evidence document uploaded${selectedCampus === 'all' ? ' across all campuses' : ` for ${selectedCampusObj?.name}`}.`}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Documents by framework</h2>
          <BarList items={byFramework} emptyText={emptyText} />
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Documents by academic year</h2>
          <BarList items={byYear} tone="gold" emptyText={emptyText} />
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Documents by area</h2>
          <BarList items={byArea} emptyText={emptyText} />
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Top criteria by document count</h2>
          <BarList items={topCriteria} emptyText={emptyText} />
        </section>
      </div>
    </div>
  );
}
