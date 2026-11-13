import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../contexts/PortalContext';
import { CampusId } from '../types/accreditation';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { ReportsSummary } from '../components/reports/ReportsSummary';
import { ProgramReadinessReport } from '../components/reports/ProgramReadinessReport';
import { AccreditationMasterReport } from '../components/reports/AccreditationMasterReport';
import { CoverageReport } from '../components/reports/CoverageReport';
import { EvidenceStatistics } from '../components/reports/EvidenceStatistics';
import { UsageReports, UsageView } from '../components/reports/UsageReports';
import { downloadCsv } from '../utils/csv';
import { ReportTab, buildReportExport } from '../utils/reportExport';

const TABS: { id: ReportTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'readiness', label: 'Survey Readiness' },
  { id: 'accreditation', label: 'Accreditation Status' },
  { id: 'coverage', label: 'Evidence Coverage' },
  { id: 'documents', label: 'Documents' },
  { id: 'usage', label: 'Usage' }
];

/** Tab ids from before the reports were regrouped, so old links and bookmarks still open the right view. */
const LEGACY_TABS: Record<string, { tab: ReportTab; usage?: UsageView }> = {
  statistics: { tab: 'documents' },
  search: { tab: 'usage', usage: 'search' },
  sharing: { tab: 'usage', usage: 'sharing' },
  performance: { tab: 'usage', usage: 'performance' }
};

function resolveTab(raw: string | null): { tab: ReportTab; usage?: UsageView } {
  if (raw && TABS.some((t) => t.id === raw)) return { tab: raw as ReportTab };
  if (raw && LEGACY_TABS[raw]) return LEGACY_TABS[raw];
  return { tab: 'summary' };
}

export function ReportsAnalytics() {
  const [params, setParams] = useSearchParams();
  const { tab, usage } = resolveTab(params.get('tab'));
  const portal = usePortal();
  const { campuses, selectedCampus, setSelectedCampus, selectedCampusObj } = portal;

  const handleExport = () => {
    const report = buildReportExport(tab, {
      campuses,
      programs: portal.filteredPrograms,
      documents: portal.filteredDocuments,
      iaRecords: selectedCampus === 'all' ? portal.iaRecords : portal.iaRecords.filter((r) => r.campusId === selectedCampus),
      isoRecords: portal.filteredIsoRecords,
      frameworks: portal.frameworks,
      criteria: portal.criteria,
      indicators: portal.indicators,
      accessLog: portal.accessLog,
      allDocuments: portal.documents
    });
    if (report.rows.length === 0) {
      toast.info('There is nothing to export on this tab yet.');
      return;
    }
    const scope = selectedCampusObj ? `-${selectedCampusObj.shortName}` : '';
    const date = new Date().toISOString().slice(0, 10);
    const slug = `${report.title}${scope}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    downloadCsv(`${slug}-${date}.csv`, report.headers, report.rows);
    toast.success(`Downloaded "${report.title}" (${report.rows.length} rows)`);
  };

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description="See where accreditation stands, what needs attention, and what to do next."
        actions={
          <>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value as CampusId | 'all')}
              aria-label="Show results for"
              className="input select select-sm h-9 w-auto text-xs font-semibold hover:border-brand-300"
            >
              <option value="all">All campuses</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExport}
              title="Download this tab as a spreadsheet you can open in Excel"
            >
              <DownloadIcon className="h-4 w-4" /> Download Excel (CSV)
            </button>
          </>
        }
      />

      <Tabs<ReportTab>
        label="Report"
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
        className="mb-5"
        tabs={TABS}
      />

      {tab === 'summary' && <ReportsSummary />}
      {tab === 'readiness' && <ProgramReadinessReport />}
      {tab === 'accreditation' && <AccreditationMasterReport />}
      {tab === 'coverage' && <CoverageReport />}
      {tab === 'documents' && <EvidenceStatistics />}
      {tab === 'usage' && <UsageReports key={usage ?? 'search'} initialView={usage} />}
    </>
  );
}
