import React, { useMemo } from 'react';
import { useLookup } from '../../hooks/useLookup';
import { usePortal } from '../../contexts/PortalContext';
import { BarList } from '../ui/BarList';
import {
  evidenceByArea,
  evidenceByCriterion,
  evidenceByFramework,
  evidenceByYear,
  repositoryStats
} from '../../data/analytics';
import { formatNumber } from '../../utils/format';

export function EvidenceStatistics() {
  const lookup = useLookup();
  const { filteredDocuments, documents, selectedCampus, selectedCampusObj, frameworks, areas } = usePortal();

  const totalDocCount = useMemo(() => {
    if (selectedCampus === 'all') return repositoryStats.total;
    return filteredDocuments.length * Math.round(1248 / documents.length);
  }, [selectedCampus, filteredDocuments.length, documents.length]);

  const byFramework = useMemo(() => {
    if (selectedCampus === 'all') return evidenceByFramework;
    const counts: Record<string, number> = {};
    filteredDocuments.forEach((d) => {
      counts[d.frameworkId] = (counts[d.frameworkId] || 0) + 1;
    });
    const campusFactor = Math.round(1248 / documents.length);
    return frameworks
      .map((f) => ({
        id: f.id,
        label: f.name,
        value: (counts[f.id] || 0) * campusFactor
      }))
      .filter((i) => i.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredDocuments, frameworks, selectedCampus, documents.length]);

  const byYear = useMemo(() => {
    if (selectedCampus === 'all') return evidenceByYear;
    const counts: Record<string, number> = {};
    filteredDocuments.forEach((d) => {
      counts[d.academicYear] = (counts[d.academicYear] || 0) + 1;
    });
    const campusFactor = Math.round(1248 / documents.length);
    return Object.entries(counts)
      .map(([year, count]) => ({
        label: year,
        value: count * campusFactor
      }))
      .sort((a, b) => b.label.localeCompare(a.label));
  }, [filteredDocuments, selectedCampus, documents.length]);

  const byArea = useMemo(() => {
    if (selectedCampus === 'all') return evidenceByArea;
    const counts: Record<string, number> = {};
    filteredDocuments.forEach((d) => {
      counts[d.areaId] = (counts[d.areaId] || 0) + 1;
    });
    const campusFactor = Math.round(1248 / documents.length);
    return areas
      .map((a) => ({
        label: a.name,
        value: (counts[a.id] || 0) * campusFactor
      }))
      .filter((a) => a.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredDocuments, areas, selectedCampus, documents.length]);

  const topCriteria = useMemo(() => {
    if (selectedCampus === 'all') {
      return evidenceByCriterion.map((c) => {
        const criterion = lookup.criterion(c.criterionId);
        const fw = criterion ? lookup.framework(criterion.frameworkId)?.shortName : '';
        return { label: `${fw} · ${criterion?.code} – ${criterion?.name}`, value: c.value };
      });
    }
    const counts: Record<string, number> = {};
    filteredDocuments.forEach((d) => {
      counts[d.criterionId] = (counts[d.criterionId] || 0) + 1;
    });
    const campusFactor = Math.round(1248 / documents.length);
    return Object.entries(counts)
      .map(([critId, count]) => {
        const criterion = lookup.criterion(critId);
        const fw = criterion ? lookup.framework(criterion.frameworkId)?.shortName : '';
        return {
          label: `${fw} · ${criterion?.code || critId} – ${criterion?.name || ''}`,
          value: count * campusFactor
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredDocuments, lookup, selectedCampus, documents.length]);

  return (
    <div className="space-y-4">
      {selectedCampus !== 'all' && (
        <div className="rounded-lg border border-brand-200 bg-brand-50/60 px-4 py-2.5 text-xs text-brand-900 flex items-center justify-between">
          <span>Evidence statistics filtered for <strong>{selectedCampusObj?.name}</strong></span>
          <span className="font-semibold text-brand-700">{filteredDocuments.length} indexed files in campus repository</span>
        </div>
      )}
      <div className="panel flex flex-wrap items-end gap-x-10 gap-y-3 p-5">
        <div>
          <p className="text-[13px] text-ink-muted">
            {selectedCampus === 'all' ? 'Total institutional documents' : `Documents for ${selectedCampusObj?.shortName || 'Campus'}`}
          </p>
          <p className="font-serif text-4xl font-semibold text-ink">{formatNumber(totalDocCount)}</p>
        </div>
        <p className="max-w-lg text-[13px] text-ink-muted">
          {selectedCampus === 'all'
            ? 'Faculty and curriculum evidence make up 30% of the repository. Institutional Planning and Library are the thinnest areas going into the 2025 institutional accreditation cycle.'
            : `Evidence distribution specifically verified for ${selectedCampusObj?.name}, including campus-specific dossiers and central university-wide policies.`}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Documents by framework</h2>
          <BarList items={byFramework} />
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Documents by academic year</h2>
          <BarList items={byYear} tone="gold" />
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Documents by area</h2>
          <BarList items={byArea} />
        </section>
        <section className="panel p-5">
          <h2 className="panel-title mb-4">Top criteria by document count</h2>
          <BarList items={topCriteria} />
        </section>
      </div>
    </div>
  );
}