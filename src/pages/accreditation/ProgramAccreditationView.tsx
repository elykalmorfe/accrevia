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
    updateProgramRequirement(activeReqProgram.program.id, activeReqProgram.req.id, {
      documentName: data.documentName,
      documentUrl: data.documentUrl,
      verified: data.status === 'Approved',
      remarks: data.reviewerNotes,
      isSubmitted: !!data.documentName
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
              isSubmitted: !!data.documentName
            }
          : r
      );
      return { ...prev, requirements: reqs };
    });
  };

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

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="input h-9 text-xs py-0 w-auto"
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
              className="input h-9 text-xs py-0 w-auto"
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
              className="input h-9 text-xs py-0 w-auto"
            >
              <option value="all">All Degrees</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Graduate">Graduate</option>
            </select>

            <select
              value={validityFilter}
              onChange={(e) => setValidityFilter(e.target.value as 'all' | 'expiring' | 'active')}
              className="input h-9 text-xs py-0 w-auto"
            >
              <option value="all">All Validity</option>
              <option value="expiring">Expiring Soon (Within 1 Year)</option>
              <option value="active">Active</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-ink-muted border-t border-line pt-2">
          <span>
            Showing <strong className="text-ink">{filtered.length}</strong> of{' '}
            <strong className="text-ink">{programAccreditations.length}</strong> programs
          </span>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gold-500" /> Level 4
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success-600" /> Level 3
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-brand-500" /> Level 2
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-ink-subtle" /> Level 1 / Cand.
            </span>
          </div>
        </div>
      </div>

      {/* Primary Accreditation Status Table (matching PDF Structure) */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
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
                        {req.documentName ? (
                          <span className="font-medium text-brand-700">{req.documentName}</span>
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
