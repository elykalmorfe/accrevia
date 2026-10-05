import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { DownloadIcon, LockIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { EvidenceStatistics } from '../components/reports/EvidenceStatistics';
import { CoverageReport } from '../components/reports/CoverageReport';
import { SharingStatistics } from '../components/reports/SharingStatistics';
import { SearchAnalytics } from '../components/reports/SearchAnalytics';
import { RetrievalPerformance } from '../components/reports/RetrievalPerformance';
import { AccreditationMasterReport } from '../components/reports/AccreditationMasterReport';

type ReportTab = 'statistics' | 'accreditation' | 'coverage' | 'sharing' | 'search' | 'performance';

export function ReportsAnalytics() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') as ReportTab || 'statistics';

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description="Repository statistics, accreditation coverage, evidence sharing, search behaviour, and retrieval quality."
        actions={
        <button type="button" className="btn btn-secondary" onClick={() => toast.success('Report exported as PDF')}>
            <DownloadIcon className="h-4 w-4" /> Export report
          </button>
        } />
      
      <Tabs<ReportTab>
        label="Report type"
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
        className="mb-5"
        tabs={[
        { id: 'statistics', label: 'Evidence Statistics' },
        { id: 'accreditation', label: 'AACCUP & COPC Master Report' },
        { id: 'coverage', label: 'Accreditation Coverage' },
        { id: 'sharing', label: 'Sharing Statistics' },
        { id: 'search', label: 'Search Analytics' },
        { id: 'performance', label: 'Retrieval Performance', adornment: <LockIcon className="h-3.5 w-3.5 text-ink-subtle" aria-label="Restricted" /> }]
        } />
      
      {tab === 'statistics' && <EvidenceStatistics />}
      {tab === 'accreditation' && <AccreditationMasterReport />}
      {tab === 'coverage' && <CoverageReport />}
      {tab === 'sharing' && <SharingStatistics />}
      {tab === 'search' && <SearchAnalytics />}
      {tab === 'performance' && <RetrievalPerformance />}
    </>);

}