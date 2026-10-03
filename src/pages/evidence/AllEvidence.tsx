import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileSearchIcon, SearchIcon, SlidersHorizontalIcon, UploadIcon, XIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { useLookup } from '../../hooks/useLookup';
import { EvidenceDocument } from '../../types/evidence';
import { documentTypes } from '../../data/options';
import { uniqueValues } from '../../utils/format';
import { PageHeader } from '../../components/ui/PageHeader';
import { SelectField } from '../../components/ui/SelectField';
import { EmptyState } from '../../components/ui/EmptyState';
import { EvidenceTable } from '../../components/evidence/EvidenceTable';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { EditMetadataModal } from '../../components/documents/EditMetadataModal';

type FilterKey =
'frameworkId' | 'areaId' | 'docType' | 'status' | 'criterionId' |
'indicatorId' | 'program' | 'office' | 'academicYear' | 'cycle';

const emptyFilters: Record<FilterKey, string> = {
  frameworkId: '', areaId: '', docType: '', status: '', criterionId: '',
  indicatorId: '', program: '', office: '', academicYear: '', cycle: ''
};

const labels: Record<FilterKey, string> = {
  frameworkId: 'Framework', areaId: 'Accreditation Area', docType: 'Document Type', status: 'Status',
  criterionId: 'Criterion', indicatorId: 'Indicator', program: 'Program', office: 'Office / Unit',
  academicYear: 'Academic Year', cycle: 'Accreditation Cycle'
};

const placeholders: Record<FilterKey, string> = {
  frameworkId: 'All frameworks', areaId: 'All areas', docType: 'All document types', status: 'All statuses',
  criterionId: 'All criteria', indicatorId: 'All indicators', program: 'All programs', office: 'All offices / units',
  academicYear: 'All academic years', cycle: 'All accreditation cycles'
};

const primaryKeys: FilterKey[] = ['frameworkId', 'areaId', 'docType', 'status'];
const secondaryKeys: FilterKey[] = ['criterionId', 'indicatorId', 'program', 'office', 'academicYear', 'cycle'];

export function AllEvidence() {
  const { documents, frameworks, areas, criteria, indicators } = usePortal();
  const lookup = useLookup();
  const [text, setText] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [showMore, setShowMore] = useState(false);
  const [preview, setPreview] = useState<EvidenceDocument | null>(null);
  const [editing, setEditing] = useState<EvidenceDocument | null>(null);

  const activeDocs = useMemo(() => documents.filter((d) => d.status !== 'Archived'), [documents]);

  const options = useMemo<Record<FilterKey, {value: string;label: string;}[]>>(() => {
    const plain = (values: string[]) => values.map((v) => ({ value: v, label: v }));
    return {
      frameworkId: frameworks.map((f) => ({ value: f.id, label: f.name })),
      areaId: areas.map((a) => ({ value: a.id, label: a.name })),
      docType: plain(documentTypes),
      status: plain(['Indexed', 'Processing', 'Pending Classification', 'Failed']),
      criterionId: criteria.
      filter((c) => (!filters.frameworkId || c.frameworkId === filters.frameworkId) && (!filters.areaId || c.areaId === filters.areaId)).
      map((c) => ({ value: c.id, label: `${c.code} – ${c.name}` })),
      indicatorId: indicators.
      filter((i) => {
        const c = lookup.criterion(i.criterionId);
        if (filters.criterionId) return i.criterionId === filters.criterionId;
        return (!filters.frameworkId || c?.frameworkId === filters.frameworkId) && (!filters.areaId || c?.areaId === filters.areaId);
      }).
      map((i) => ({ value: i.id, label: `${i.code} – ${i.name}` })),
      program: plain(uniqueValues(activeDocs, (d) => d.program)),
      office: plain(uniqueValues(activeDocs, (d) => d.office)),
      academicYear: plain(uniqueValues(activeDocs, (d) => d.academicYear).reverse()),
      cycle: plain(uniqueValues(activeDocs, (d) => d.cycle))
    };
  }, [frameworks, areas, criteria, indicators, filters.frameworkId, filters.areaId, filters.criterionId, activeDocs, lookup]);

  const setFilter = (key: FilterKey, value: string) =>
  setFilters((f) => {
    const next = { ...f, [key]: value };
    if (key === 'frameworkId' || key === 'areaId') {
      next.criterionId = '';
      next.indicatorId = '';
    }
    if (key === 'criterionId') next.indicatorId = '';
    return next;
  });

  const filtered = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return activeDocs.
    filter((d) => (Object.keys(filters) as FilterKey[]).every((k) => !filters[k] || String(d[k]) === filters[k])).
    filter((d) => !needle || `${d.title} ${d.keywords.join(' ')} ${d.office}`.toLowerCase().includes(needle)).
    sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  }, [activeDocs, filters, text]);

  const activeKeys = (Object.keys(filters) as FilterKey[]).filter((k) => filters[k]);
  const secondaryActive = secondaryKeys.filter((k) => filters[k]).length;
  const displayValue = (key: FilterKey) => options[key].find((o) => o.value === filters[key])?.label ?? filters[key];

  const renderSelect = (key: FilterKey) =>
  <SelectField
    key={key}
    label={labels[key]}
    hideLabel
    compact
    value={filters[key]}
    onChange={(v) => setFilter(key, v)}
    placeholder={placeholders[key]}
    options={options[key]}
    disabled={key === 'indicatorId' && options.indicatorId.length === 0} />;



  return (
    <>
      <PageHeader
        title="All Evidence"
        description="Every accreditation evidence document in the repository, with the metadata that links it to frameworks, criteria, and indicators."
        actions={
        <Link to="/evidence/upload" className="btn btn-primary">
            <UploadIcon className="h-4 w-4" /> Upload Evidence
          </Link>
        } />
      

      <section className="panel" aria-label="Evidence documents">
        <div className="space-y-3 border-b border-line p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative xl:w-72 xl:shrink-0">
              <label htmlFor="evidence-filter" className="sr-only">
                Filter this list by title, keyword, or office
              </label>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
              <input
                id="evidence-filter"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Filter by title or keyword"
                className="input h-8 pl-9 text-[13px]" />
              
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2 md:grid-cols-4">{primaryKeys.map(renderSelect)}</div>
            <button
              type="button"
              onClick={() => setShowMore((s) => !s)}
              aria-expanded={showMore}
              className={`btn btn-sm shrink-0 ${showMore || secondaryActive ? 'border border-brand-200 bg-brand-50 text-brand-700' : 'btn-secondary'}`}>
              
              <SlidersHorizontalIcon className="h-3.5 w-3.5" /> More filters{secondaryActive ? ` (${secondaryActive})` : ''}
            </button>
          </div>
          {showMore && <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{secondaryKeys.map(renderSelect)}</div>}
          {activeKeys.length > 0 &&
          <div className="flex flex-wrap items-center gap-2">
              {activeKeys.map((k) =>
            <span key={k} className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-white py-0.5 pl-2.5 pr-1 text-xs text-ink">
                  <span className="text-ink-muted">{labels[k]}:</span> {displayValue(k)}
                  <button type="button" onClick={() => setFilter(k, '')} className="grid h-5 w-5 place-items-center rounded-full hover:bg-canvas" aria-label={`Remove ${labels[k]} filter`}>
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
            )}
              <button type="button" onClick={() => setFilters(emptyFilters)} className="link text-xs">
                Clear all
              </button>
            </div>
          }
        </div>

        {filtered.length ?
        <EvidenceTable docs={filtered} onPreview={setPreview} onEdit={setEditing} /> :

        <EmptyState
          icon={FileSearchIcon}
          title="No evidence matches these filters"
          description="Adjust or clear the filters. To find evidence by meaning, use the search bar at the top."
          action={
          <button type="button" className="btn btn-secondary" onClick={() => {setFilters(emptyFilters);setText('');}}>
                Clear filters
              </button>
          } />

        }

        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-ink-muted">
          <span>
            Showing <span className="font-medium text-ink">{filtered.length}</span> of {activeDocs.length} documents in this view
          </span>
          <span className="hidden sm:inline">Sorted by date added</span>
        </div>
      </section>

      <DocumentPreviewModal doc={preview} onClose={() => setPreview(null)} />
      <EditMetadataModal doc={editing} onClose={() => setEditing(null)} />
    </>);

}