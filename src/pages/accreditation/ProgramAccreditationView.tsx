import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { ProgramAccreditation, ProgramRequirementItem, RequirementVerificationStatus } from '../../types/accreditation';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { ProgramFormModal } from '../../components/accreditation/ProgramFormModal';
import { AccreditationDocModal } from '../../components/accreditation/AccreditationDocModal';
import { Modal } from '../../components/ui/Modal';
import {
  SearchIcon,
  PlusIcon,
  ExternalLinkIcon,
  FileCheckIcon,
  FolderOpenIcon,
  CalendarIcon,
  AlertCircleIcon,
  PencilIcon,
  Trash2Icon,
  CheckCircle2Icon,
  FileTextIcon
} from 'lucide-react';

export function ProgramAccreditationView() {
  const {
    campuses,
    programAccreditations,
    deleteProgramAccreditation,
    updateProgramRequirement,
    isAdmin
  } = usePortal();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDegree, setSelectedDegree] = useState<string>('all');
  const [validityFilter, setValidityFilter] = useState<'all' | 'expiring' | 'active'>('all');

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramAccreditation | null>(null);

  // Requirements / Detail Modal State
  const [detailsModalProgram, setDetailsModalProgram] = useState<ProgramAccreditation | null>(null);
  const [activeReqProgram, setActiveReqProgram] = useState<{
    program: ProgramAccreditation;
    req: ProgramRequirementItem;
  } | null>(null);

  // Filtered Programs
  const filtered = useMemo(() => {
    return programAccreditations.filter((prog) => {
      // Campus Filter
      if (selectedCampus !== 'all' && prog.campusId !== selectedCampus) return false;

      // Status Filter
      if (selectedStatus !== 'all' && prog.status !== selectedStatus) return false;

      // Degree Filter
      if (selectedDegree !== 'all' && prog.degreeLevel !== selectedDegree) return false;

      // Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = prog.programName.toLowerCase().includes(q);
        const matchCampus = prog.campusName.toLowerCase().includes(q);
        const matchRemarks = (prog.remarks || '').toLowerCase().includes(q);
        const matchCert = (prog.certificationFile || '').toLowerCase().includes(q);
        if (!matchName && !matchCampus && !matchRemarks && !matchCert) return false;
      }

      // Validity Filter
      if (validityFilter === 'expiring') {
        const end = prog.validityEnd ? new Date(prog.validityEnd) : null;
        if (!end || isNaN(end.getTime())) return false;
        const now = new Date();
        const diffDays = (end.getTime() - now.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 365;
      }

      return true;
    });
  }, [programAccreditations, selectedCampus, selectedStatus, selectedDegree, search, validityFilter]);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from accreditation tracking?`)) {
      deleteProgramAccreditation(id);
      toast.success('Program removed from accreditation registry');
    }
  };

  const handleSaveProgramRequirement = (data: {
    documentName: string;
    documentUrl: string;
    status: RequirementVerificationStatus;
    reviewerNotes: string;
  }) => {
    if (!activeReqProgram) return;
    const hasEvidence = Boolean(data.documentName || data.documentUrl);
    updateProgramRequirement(activeReqProgram.program.id, activeReqProgram.req.id, {
      documentName: data.documentName,
      documentUrl: data.documentUrl,
      verified: data.status === 'Approved',
      remarks: data.reviewerNotes,
      isSubmitted: hasEvidence
    });

    // Also update current modal view state
    setDetailsModalProgram((prev) => {
      if (!prev) return null;
      const reqs = (prev.requirements || []).map((r) =>
        r.id === activeReqProgram.req.id
          ? {
              ...r,
              documentName: data.documentName,
              documentUrl: data.documentUrl,
              verified: data.status === 'Approved',
              remarks: data.reviewerNotes,
              isSubmitted: hasEvidence
            }
          : r
      );
      return { ...prev, requirements: reqs };
    });
  };

  // Summary view mode: AACCUP or COPC
  const [summaryMode, setSummaryMode] = useState<'aaccup' | 'copc'>('aaccup');

  // Overall calculations across all programs
  const totalPrograms = programAccreditations.length;
  const accreditedCount = useMemo(
    () => programAccreditations.filter((p) => ['Level 1', 'Level 2', 'Level 3', 'Level 4'].includes(p.status)).length,
    [programAccreditations]
  );
  const candidateCount = useMemo(
    () => programAccreditations.filter((p) => p.status === 'Candidate').length,
    [programAccreditations]
  );
  const pendingSurveyCount = useMemo(
    () => programAccreditations.filter((p) => !['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Candidate'].includes(p.status)).length,
    [programAccreditations]
  );
  const candidateOrPendingCount = candidateCount + pendingSurveyCount;
  const accreditationRate = totalPrograms > 0 ? ((accreditedCount / totalPrograms) * 100).toFixed(2) : '0';

  // COPC metrics
  const copcCompliantCount = useMemo(
    () => programAccreditations.filter((p) => p.copcStatus === 'Compliant').length,
    [programAccreditations]
  );
  const copcPendingCount = useMemo(
    () => programAccreditations.filter((p) => p.copcStatus === 'Pending' || p.copcStatus === 'Not Applicable').length,
    [programAccreditations]
  );
  const copcRate = totalPrograms > 0 ? ((copcCompliantCount / totalPrograms) * 100).toFixed(2) : '0';

  // Level counts
  const level4Count = useMemo(
    () => programAccreditations.filter((p) => p.status === 'Level 4').length,
    [programAccreditations]
  );
  const level3Count = useMemo(
    () => programAccreditations.filter((p) => p.status === 'Level 3').length,
    [programAccreditations]
  );
  const level2Count = useMemo(
    () => programAccreditations.filter((p) => p.status === 'Level 2').length,
    [programAccreditations]
  );
  const level1Count = useMemo(
    () => programAccreditations.filter((p) => p.status === 'Level 1').length,
    [programAccreditations]
  );

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link to="/frameworks" className="hover:text-ink hover:underline">
              Accreditation & Frameworks
            </Link>{' '}
            / Program-Level Accreditation
          </span>
        }
        title="AACCUP Program Accreditation Status"
        description="Comprehensive program accreditation tracking across all 7 campuses, including survey levels, certificates, Drive evaluation portfolios, technical reviews, and accreditation visit schedules."
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingProgram(null);
              setFormModalOpen(true);
            }}
            className="btn btn-primary btn-sm"
          >
            <PlusIcon className="h-4 w-4" /> Add Academic Program
          </button>
        }
      />

      {/* Mode Switcher Tabs for Summary Cards */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="grid grid-cols-1 sm:flex sm:items-center gap-1.5 rounded-xl border border-line bg-canvas p-1">
          <button
            type="button"
            onClick={() => setSummaryMode('aaccup')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all text-center ${
              summaryMode === 'aaccup'
                ? 'bg-white text-brand-700 shadow-xs border border-line'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            AACCUP Accreditation Summary ({accreditationRate}%)
          </button>
          <button
            type="button"
            onClick={() => setSummaryMode('copc')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all text-center ${
              summaryMode === 'copc'
                ? 'bg-white text-success-700 shadow-xs border border-line'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            CHED COPC Compliance Summary ({copcRate}%)
          </button>
        </div>

        <span className="text-xs text-ink-muted hidden md:inline">
          {summaryMode === 'aaccup'
            ? 'AACCUP Survey Levels 1–4 vs Candidate Status'
            : 'CHED Certificate of Program Compliance Alignment'}
        </span>
      </div>

      {/* Institutional Summary Cards (Reflects 2nd Image Reference) */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryMode === 'aaccup' ? (
          <>
            <div className="panel p-4">
              <span className="text-xs text-ink-muted">Total Programs Monitored</span>
              <p className="mt-1 text-2xl font-bold text-ink">{totalPrograms}</p>
              <p className="text-[11px] text-ink-subtle">University-wide degree offerings</p>
            </div>

            <div className="panel p-4">
              <span className="text-xs text-ink-muted">Accredited Programs (Levels 1–4)</span>
              <p className="mt-1 text-2xl font-bold text-success-700">{accreditedCount}</p>
              <p className="text-[11px] text-ink-subtle">AACCUP surveyed & certified</p>
            </div>

            <div className="panel p-4">
              <span className="text-xs text-ink-muted">Institutional Accreditation Rate</span>
              <p className="mt-1 text-2xl font-bold text-brand-700">{accreditationRate}%</p>
              <p className="text-[11px] text-ink-subtle">Target: 100% accredited</p>
            </div>

            <div className="panel p-4">
              <span className="text-xs text-ink-muted">Candidate / Under Evaluation</span>
              <p className="mt-1 text-2xl font-bold text-warning-700">{candidateOrPendingCount}</p>
              <p className="text-[11px] text-ink-subtle">{candidateCount} Candidate · {pendingSurveyCount} Pending Visit</p>
            </div>
          </>
        ) : (
          <>
            <div className="panel p-4">
              <span className="text-xs text-ink-muted">Total Programs Monitored</span>
              <p className="mt-1 text-2xl font-bold text-ink">{totalPrograms}</p>
              <p className="text-[11px] text-ink-subtle">University-wide degree offerings</p>
            </div>

            <div className="panel p-4">
              <span className="text-xs text-ink-muted">Programs with Active COPC</span>
              <p className="mt-1 text-2xl font-bold text-success-700">{copcCompliantCount}</p>
              <p className="text-[11px] text-ink-subtle">Issued by CHED Regional Office</p>
            </div>

            <div className="panel p-4">
              <span className="text-xs text-ink-muted">Institutional COPC Compliance</span>
              <p className="mt-1 text-2xl font-bold text-brand-700">{copcRate}%</p>
              <p className="text-[11px] text-ink-subtle">Target: 100% compliance</p>
            </div>

            <div className="panel p-4">
              <span className="text-xs text-ink-muted">Under Evaluation / Pending</span>
              <p className="mt-1 text-2xl font-bold text-warning-700">{copcPendingCount}</p>
              <p className="text-[11px] text-ink-subtle">Submitted renewal applications</p>
            </div>
          </>
        )}
      </div>

      {/* Campus Distribution Breakdown Grid (Master Reference) */}
      <div className="mb-6 panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            {summaryMode === 'aaccup'
              ? 'Campus AACCUP Accreditation Distribution (Master Reference)'
              : 'Campus COPC Compliance Distribution (Master Reference)'}
          </h3>
          {selectedCampus !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCampus('all')}
              className="text-[11px] text-brand-600 font-semibold hover:underline"
            >
              Clear Campus Filter (Show All 7)
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {campuses.map((c) => {
            const campusRecs = programAccreditations.filter((p) => p.campusId === c.id);
            const total = campusRecs.length;

            if (summaryMode === 'aaccup') {
              const accredited = campusRecs.filter((p) =>
                ['Level 1', 'Level 2', 'Level 3', 'Level 4'].includes(p.status)
              ).length;
              const rate = total > 0 ? ((accredited / total) * 100).toFixed(1) : '0';
              const isFull = accredited === total && total > 0;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCampus(c.id === selectedCampus ? 'all' : c.id)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    selectedCampus === c.id
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500 shadow-xs'
                      : 'border-line hover:bg-canvas'
                  }`}
                  title={`Filter by ${c.name} (${accredited}/${total} accredited)`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">{c.shortName}</span>
                    {isFull ? (
                      <span className="text-[10px] font-semibold text-success-700">100%</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-brand-700">{rate}%</span>
                    )}
                  </div>
                  <p className="mt-1 text-base font-extrabold text-brand-900">
                    {accredited} / {total}
                  </p>
                  <p className="text-[10px] text-ink-muted">programs accredited</p>
                </button>
              );
            } else {
              const comp = campusRecs.filter((p) => p.copcStatus === 'Compliant').length;
              const isFull = comp === total && total > 0;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCampus(c.id === selectedCampus ? 'all' : c.id)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    selectedCampus === c.id
                      ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500 shadow-xs'
                      : 'border-line hover:bg-canvas'
                  }`}
                  title={`Filter by ${c.name} (${comp}/${total} COPC compliant)`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">{c.shortName}</span>
                    {isFull ? (
                      <span className="text-[10px] font-semibold text-success-700">100%</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-warning-700">Pending</span>
                    )}
                  </div>
                  <p className="mt-1 text-base font-extrabold text-brand-900">
                    {comp} / {total}
                  </p>
                  <p className="text-[10px] text-ink-muted">programs compliant</p>
                </button>
              );
            }
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-5 panel p-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-ink-subtle" />
            <input
              type="text"
              placeholder="Search program by name, campus, certificate, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="input h-9 text-xs py-0 w-full sm:w-auto"
            >
              <option value="all">All Campuses (7)</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input h-9 text-xs py-0 w-full sm:w-auto"
            >
              <option value="all">All Levels</option>
              <option value="Candidate">Candidate</option>
              <option value="Level 1">Level 1</option>
              <option value="Level 2">Level 2</option>
              <option value="Level 3">Level 3</option>
              <option value="Level 4">Level 4</option>
              <option value="Not Accreditable">Not Accreditable</option>
              <option value="for accreditation">For Accreditation</option>
              <option value="waiting">Waiting for Survey</option>
            </select>

            <select
              value={selectedDegree}
              onChange={(e) => setSelectedDegree(e.target.value)}
              className="input h-9 text-xs py-0 w-full sm:w-auto"
            >
              <option value="all">All Degrees</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Graduate">Graduate</option>
            </select>

            <select
              value={validityFilter}
              onChange={(e) => setValidityFilter(e.target.value as 'all' | 'expiring' | 'active')}
              className="input h-9 text-xs py-0 w-full sm:w-auto col-span-2 sm:col-span-1"
            >
              <option value="all">All Validity</option>
              <option value="expiring">Expiring Soon (Within 1 Year)</option>
              <option value="active">Active</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-ink-muted border-t border-line pt-2">
          <span>
            Showing <strong className="text-ink">{filtered.length}</strong> of{' '}
            <strong className="text-ink">{programAccreditations.length}</strong> programs
          </span>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'Level 4' ? 'all' : 'Level 4')}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
                selectedStatus === 'Level 4' ? 'bg-gold-100 text-gold-900 font-bold' : 'hover:bg-canvas'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-gold-500" /> Level 4 ({level4Count})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'Level 3' ? 'all' : 'Level 3')}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
                selectedStatus === 'Level 3' ? 'bg-success-100 text-success-900 font-bold' : 'hover:bg-canvas'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-success-600" /> Level 3 ({level3Count})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'Level 2' ? 'all' : 'Level 2')}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
                selectedStatus === 'Level 2' ? 'bg-brand-100 text-brand-900 font-bold' : 'hover:bg-canvas'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-brand-500" /> Level 2 ({level2Count})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'Level 1' ? 'all' : 'Level 1')}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
                selectedStatus === 'Level 1' ? 'bg-slate-200 text-ink font-bold' : 'hover:bg-canvas'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-ink-subtle" /> Level 1 ({level1Count})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === 'Candidate' ? 'all' : 'Candidate')}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors ${
                selectedStatus === 'Candidate' ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-canvas'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Cand. ({candidateCount})
            </button>

            <span className="hidden xl:inline text-line">|</span>

            <div className="hidden xl:flex items-center gap-2">
              <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                AACCUP Rate: {accreditationRate}%
              </span>
              <span className="text-[11px] font-semibold text-success-700 bg-success-50 px-2 py-0.5 rounded border border-success-200">
                COPC Rate: {copcRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Accreditation Status Table (matching PDF Structure) */}
      <div className="panel overflow-hidden">
        {/* Desktop View Table (lg+) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="bg-canvas border-b border-line text-ink-muted">
              <tr>
                <th className="th py-3 w-10">#</th>
                <th className="th py-3 min-w-[240px]">Programs Offered</th>
                <th className="th py-3">Campus</th>
                <th className="th py-3">Initial Op.</th>
                <th className="th py-3">Accreditation Status</th>
                <th className="th py-3 min-w-[150px]">Validity Period</th>
                <th className="th py-3">Certification</th>
                <th className="th py-3">Instruments & Review</th>
                <th className="th py-3">COPC</th>
                <th className="th py-3">Schedule</th>
                <th className="th py-3 min-w-[180px]">Remarks</th>
                <th className="th py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="td py-8 text-center text-ink-muted">
                    No programs matched the selected search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((prog, idx) => {
                  const hasSchedule = !!prog.scheduleForAccreditation;
                  return (
                    <tr key={prog.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="td py-3 font-mono text-ink-subtle text-xs">{idx + 1}</td>

                      <td className="td py-3">
                        <div className="font-semibold text-ink leading-snug">{prog.programName}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-muted">
                          <span className="rounded bg-canvas px-1.5 py-0.5 border border-line">
                            {prog.degreeLevel}
                          </span>
                          {prog.borRes && <span>BOR: {prog.borRes}</span>}
                          {prog.cmoNo && <span>CMO: {prog.cmoNo}</span>}
                        </div>
                      </td>

                      <td className="td py-3 whitespace-nowrap text-ink-muted">
                        <span className="font-medium text-ink">{prog.campusName.replace(' Campus', '')}</span>
                      </td>

                      <td className="td py-3 whitespace-nowrap text-ink-muted">
                        {prog.yearOfInitialOperation || '—'}
                      </td>

                      <td className="td py-3 whitespace-nowrap">
                        <Badge
                          tone={
                            prog.status.includes('Level 4')
                              ? 'gold'
                              : prog.status.includes('Level 3')
                              ? 'success'
                              : prog.status.includes('Level 2')
                              ? 'brand'
                              : prog.status.includes('Level 1')
                              ? 'neutral'
                              : prog.status === 'Not Accreditable'
                              ? 'danger'
                              : 'warning'
                          }
                          dot
                        >
                          {prog.status}
                        </Badge>
                      </td>

                      <td className="td py-3 whitespace-nowrap text-xs text-ink">
                        {prog.validityStart && prog.validityEnd ? (
                          <div>
                            <div className="font-medium">{prog.validityStart}</div>
                            <div className="text-ink-muted">to {prog.validityEnd}</div>
                          </div>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
                      </td>

                      <td className="td py-3 text-xs">
                        {prog.certificationFile ? (
                          <span
                            className="inline-flex items-center gap-1 rounded bg-success-50 px-2 py-0.5 font-medium text-success-700 text-[11.5px] border border-success-100"
                            title={prog.certificationFile}
                          >
                            <FileCheckIcon className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[110px]">{prog.certificationFile}</span>
                          </span>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
                      </td>

                      <td className="td py-3 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {prog.instrumentLink && (
                            <a
                              href={prog.instrumentLink}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded border border-line bg-canvas p-1 text-ink-muted hover:text-brand-600 hover:border-brand-300"
                              title="AACCUP Instrument"
                            >
                              <FolderOpenIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {prog.findingsLink && (
                            <a
                              href={prog.findingsLink}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded border border-line bg-canvas p-1 text-ink-muted hover:text-brand-600 hover:border-brand-300"
                              title="Summary of Findings & Recommendations"
                            >
                              <FileTextIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {prog.technicalReviewLink && (
                            <a
                              href={prog.technicalReviewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded border border-line bg-canvas p-1 text-ink-muted hover:text-brand-600 hover:border-brand-300"
                              title="AACCUP Technical Review"
                            >
                              <CheckCircle2Icon className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {!prog.instrumentLink && !prog.findingsLink && !prog.technicalReviewLink && (
                            <span className="text-ink-subtle">—</span>
                          )}
                        </div>
                      </td>

                      <td className="td py-3 whitespace-nowrap">
                        {prog.copcStatus === 'Compliant' ? (
                          <span className="inline-flex items-center gap-1 text-success-700 font-medium text-xs">
                            <CheckCircle2Icon className="h-3.5 w-3.5" /> Compliant
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-warning-700 font-medium text-xs">
                            <AlertCircleIcon className="h-3.5 w-3.5" /> Pending
                          </span>
                        )}
                      </td>

                      <td className="td py-3 whitespace-nowrap">
                        {hasSchedule ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-brand-700 text-xs rounded bg-brand-50 px-2 py-0.5 border border-brand-100">
                            <CalendarIcon className="h-3 w-3" />
                            {prog.scheduleForAccreditation}
                          </span>
                        ) : (
                          <span className="text-ink-subtle">—</span>
                        )}
                      </td>

                      <td className="td py-3 text-xs text-ink-muted max-w-[220px]">
                        <p className="truncate" title={prog.remarks}>
                          {prog.remarks || '—'}
                        </p>
                      </td>

                      <td className="td py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailsModalProgram(prog)}
                            className="btn btn-secondary btn-sm h-7 px-2 text-xs"
                            title="View AACCUP survey areas and evidence portfolio"
                          >
                            Areas ({prog.requirements?.length || 10})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProgram(prog);
                              setFormModalOpen(true);
                            }}
                            className="btn btn-ghost btn-sm h-7 w-7 p-0"
                            title="Edit Program Details"
                          >
                            <PencilIcon className="h-3.5 w-3.5 text-ink-muted" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(prog.id, prog.programName)}
                              className="btn btn-ghost btn-sm h-7 w-7 p-0 text-danger-600 hover:bg-danger-50"
                              title="Delete program"
                            >
                              <Trash2Icon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Card View (< lg viewports) */}
        <div className="divide-y divide-line lg:hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted">
              No programs matched the selected search criteria.
            </div>
          ) : (
            filtered.map((prog, idx) => {
              const hasSchedule = !!prog.scheduleForAccreditation;
              return (
                <div key={prog.id} className="p-4 hover:bg-canvas/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-ink-subtle font-mono">
                        <span>#{idx + 1}</span>
                        <span>·</span>
                        <span className="font-sans font-medium text-ink-muted">{prog.campusName.replace(' Campus', '')}</span>
                      </div>
                      <h4 className="mt-0.5 text-sm font-bold text-ink leading-snug">
                        {prog.programName}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="rounded bg-canvas px-1.5 py-0.5 border border-line text-[11px] font-medium text-ink">
                          {prog.degreeLevel}
                        </span>
                        {prog.borRes && <span className="text-[11px] text-ink-muted">BOR: {prog.borRes}</span>}
                        {prog.cmoNo && <span className="text-[11px] text-ink-muted">CMO: {prog.cmoNo}</span>}
                      </div>
                    </div>

                    <Badge
                      tone={
                        prog.status.includes('Level 4')
                          ? 'gold'
                          : prog.status.includes('Level 3')
                          ? 'success'
                          : prog.status.includes('Level 2')
                          ? 'brand'
                          : prog.status.includes('Level 1')
                          ? 'neutral'
                          : prog.status === 'Not Accreditable'
                          ? 'danger'
                          : 'warning'
                      }
                      dot
                    >
                      {prog.status}
                    </Badge>
                  </div>

                  {/* Metadata Grid */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs rounded-lg bg-canvas/70 p-2.5">
                    <div>
                      <span className="text-[11px] text-ink-muted">Validity:</span>
                      <p className="font-medium text-ink truncate mt-0.5">
                        {prog.validityStart && prog.validityEnd ? `${prog.validityStart} – ${prog.validityEnd}` : '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-ink-muted">COPC Status:</span>
                      <p className={`font-semibold mt-0.5 flex items-center gap-1 ${
                        prog.copcStatus === 'Compliant' ? 'text-success-700' : 'text-warning-700'
                      }`}>
                        {prog.copcStatus === 'Compliant' ? (
                          <><CheckCircle2Icon className="h-3 w-3" /> Compliant</>
                        ) : (
                          <><AlertCircleIcon className="h-3 w-3" /> Pending</>
                        )}
                      </p>
                    </div>
                    {prog.certificationFile && (
                      <div className="col-span-2">
                        <span className="text-[11px] text-ink-muted">Certificate:</span>
                        <p className="font-medium text-success-700 truncate mt-0.5">
                          {prog.certificationFile}
                        </p>
                      </div>
                    )}
                    {hasSchedule && (
                      <div className="col-span-2">
                        <span className="text-[11px] text-ink-muted">Accreditation Visit:</span>
                        <p className="font-semibold text-brand-700 mt-0.5 flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" /> {prog.scheduleForAccreditation}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setDetailsModalProgram(prog)}
                      className="btn btn-secondary btn-sm flex-1 justify-center min-h-[38px] text-xs font-semibold"
                    >
                      Audit Survey Areas ({prog.requirements?.length || 10})
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProgram(prog);
                          setFormModalOpen(true);
                        }}
                        className="btn btn-ghost btn-icon h-9 w-9 text-ink-muted hover:text-ink"
                        title="Edit Program"
                        aria-label="Edit program"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(prog.id, prog.programName)}
                          className="btn btn-ghost btn-icon h-9 w-9 text-danger-600 hover:bg-danger-50"
                          title="Delete Program"
                          aria-label="Delete program"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Program Detail / 10 Survey Areas Modal */}
      {detailsModalProgram && (
        <Modal
          open={!!detailsModalProgram}
          onClose={() => setDetailsModalProgram(null)}
          title={detailsModalProgram.programName}
          description={`${detailsModalProgram.campusName} · ${detailsModalProgram.status} · Initial Operation: ${detailsModalProgram.yearOfInitialOperation || 'N/A'}`}
          size="xl"
          footer={
            <div className="flex w-full items-center justify-between">
              <span className="text-xs text-ink-muted">
                Schedule: <strong>{detailsModalProgram.scheduleForAccreditation || 'No survey scheduled'}</strong>
              </span>
              <button
                type="button"
                onClick={() => setDetailsModalProgram(null)}
                className="btn btn-secondary btn-sm"
              >
                Close Portfolio
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Quick Header Summary */}
            <div className="grid gap-3 sm:grid-cols-3 rounded-lg border border-line bg-canvas p-3 text-xs">
              <div>
                <span className="text-ink-muted">Validity Range</span>
                <p className="font-semibold text-ink">
                  {detailsModalProgram.validityStart} to {detailsModalProgram.validityEnd || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-ink-muted">Accreditation Certificate</span>
                <p className="font-semibold text-ink truncate">
                  {detailsModalProgram.certificationFile || 'No file registered'}
                </p>
              </div>
              <div>
                <span className="text-ink-muted">COPC Certificate</span>
                <p className="font-semibold text-ink">
                  {detailsModalProgram.copcCertificateNumber || detailsModalProgram.copcStatus}
                </p>
              </div>
            </div>

            {/* Official External Review Links */}
            <div className="rounded-lg border border-line p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                Official Google Drive Repositories & Review Links
              </h4>
              <div className="grid gap-2 sm:grid-cols-3 text-xs">
                {detailsModalProgram.instrumentLink ? (
                  <a
                    href={detailsModalProgram.instrumentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded border border-line p-2 hover:bg-canvas text-brand-700 font-medium"
                  >
                    <span>AACCUP Instrument</span>
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="rounded border border-line p-2 text-ink-subtle bg-canvas/40">
                    No Instrument link
                  </span>
                )}

                {detailsModalProgram.findingsLink ? (
                  <a
                    href={detailsModalProgram.findingsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded border border-line p-2 hover:bg-canvas text-brand-700 font-medium"
                  >
                    <span>Findings & Recommendation</span>
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="rounded border border-line p-2 text-ink-subtle bg-canvas/40">
                    No Findings link
                  </span>
                )}

                {detailsModalProgram.technicalReviewLink ? (
                  <a
                    href={detailsModalProgram.technicalReviewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded border border-line p-2 hover:bg-canvas text-brand-700 font-medium"
                  >
                    <span>Technical Review</span>
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="rounded border border-line p-2 text-ink-subtle bg-canvas/40">
                    No Technical Review
                  </span>
                )}
              </div>
            </div>

            {/* 10 AACCUP Survey Areas Checklist */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                10 AACCUP Program Survey Areas Checklist
              </h4>

              <div className="panel divide-y divide-line overflow-hidden max-h-80 overflow-y-auto">
                {(detailsModalProgram.requirements || []).map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 text-xs hover:bg-canvas/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{req.areaName}</span>
                        {req.verified ? (
                          <Badge tone="success" dot>
                            Verified
                          </Badge>
                        ) : (
                          <Badge tone="warning" dot>
                            Pending Review
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        {req.documentName || req.documentUrl ? (
                          <>
                            <span className="font-medium text-brand-700">{req.documentName || 'Reference link'}</span>
                            {req.documentUrl && (
                              <a
                                href={req.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="ml-1 font-medium text-brand-700 hover:underline"
                              >
                                Open link
                              </a>
                            )}
                          </>
                        ) : (
                          'No document uploaded yet'
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveReqProgram({
                            program: detailsModalProgram,
                            req
                          })
                        }
                        className="btn btn-secondary btn-sm h-7 px-2"
                      >
                        Upload / Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Program Create/Edit Form Modal */}
      <ProgramFormModal
        open={formModalOpen}
        program={editingProgram}
        onClose={() => setFormModalOpen(false)}
      />

      {/* Program Requirement Evidence Modal */}
      {activeReqProgram && (
        <AccreditationDocModal
          open={!!activeReqProgram}
          title={`${activeReqProgram.program.programName}`}
          areaCode={activeReqProgram.req.areaCode}
          requirementTitle={activeReqProgram.req.areaName}
          currentDocumentName={activeReqProgram.req.documentName}
          currentDocumentUrl={activeReqProgram.req.documentUrl}
          currentStatus={activeReqProgram.req.verified ? 'Approved' : 'Under Review'}
          currentNotes={activeReqProgram.req.remarks}
          onClose={() => setActiveReqProgram(null)}
          onSave={handleSaveProgramRequirement}
        />
      )}
    </>
  );
}
