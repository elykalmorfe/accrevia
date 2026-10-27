import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { COPCRecord, COPCRequirementItem, RequirementVerificationStatus } from '../../types/accreditation';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { AccreditationDocModal } from '../../components/accreditation/AccreditationDocModal';
import { Modal } from '../../components/ui/Modal';
import {
  SearchIcon,
  FileTextIcon
} from 'lucide-react';

export function COPCView() {
  const { campuses, copcRecords, updateCOPCRecord, updateCOPCRequirement, selectedCampus, setSelectedCampus } = usePortal();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [activeCopcProgram, setActiveCopcProgram] = useState<COPCRecord | null>(null);
  const [activeReqItem, setActiveReqItem] = useState<{
    copc: COPCRecord;
    req: COPCRequirementItem;
  } | null>(null);

  const filtered = useMemo(() => {
    return copcRecords.filter((rec) => {
      if (selectedCampus !== 'all' && rec.campusId !== selectedCampus) return false;
      if (selectedStatus !== 'all' && rec.copcStatus !== selectedStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          rec.programName.toLowerCase().includes(q) ||
          rec.campusName.toLowerCase().includes(q) ||
          (rec.certificateNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [copcRecords, selectedCampus, selectedStatus, search]);

  const campusCopcRecords = useMemo(() => {
    if (selectedCampus === 'all') return copcRecords;
    return copcRecords.filter((rec) => rec.campusId === selectedCampus);
  }, [copcRecords, selectedCampus]);

  const totalPrograms = campusCopcRecords.length;
  const compliantCount = campusCopcRecords.filter((r) => r.copcStatus === 'Compliant').length;
  const pendingCount = campusCopcRecords.filter((r) => r.copcStatus === 'Pending Review').length;
  const compliantRate = totalPrograms > 0 ? ((compliantCount / totalPrograms) * 100).toFixed(1) : '0';

  const handleSaveRequirement = (data: {
    documentName: string;
    documentUrl: string;
    status: RequirementVerificationStatus;
    reviewerNotes: string;
  }) => {
    if (!activeReqItem) return;
    const hasEvidence = Boolean(data.documentName || data.documentUrl);
    updateCOPCRequirement(activeReqItem.copc.id, activeReqItem.req.id, {
      documentName: data.documentName,
      documentUrl: data.documentUrl,
      status: data.status,
      deficiencyNote: data.reviewerNotes,
      isSubmitted: hasEvidence
    });

    // Also update current active program state
    setActiveCopcProgram((prev) => {
      if (!prev) return null;
      const updatedReqs = prev.requirements.map((r) =>
        r.id === activeReqItem.req.id
          ? {
              ...r,
              documentName: data.documentName,
              documentUrl: data.documentUrl,
              status: data.status,
              deficiencyNote: data.reviewerNotes,
              isSubmitted: hasEvidence
            }
          : r
      );
      return { ...prev, requirements: updatedReqs };
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
            / Program Compliance
          </span>
        }
        title="Certificate of Program Compliance (COPC)"
        description="Official CHED regulatory compliance tracking across degree programs, institutional compliance matrix, CMO curriculum alignment, and faculty portfolio verifications."
      />

      {/* Institutional COPC Summary Cards (Reflects bottom summary table of PDF) */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-4">
          <span className="text-xs text-ink-muted">Total Programs Monitored</span>
          <p className="mt-1 text-2xl font-bold text-ink">{totalPrograms}</p>
          <p className="text-[11px] text-ink-subtle">University-wide degree offerings</p>
        </div>

        <div className="panel p-4">
          <span className="text-xs text-ink-muted">Programs with Active COPC</span>
          <p className="mt-1 text-2xl font-bold text-success-700">{compliantCount}</p>
          <p className="text-[11px] text-ink-subtle">Issued by CHED Regional Office</p>
        </div>

        <div className="panel p-4">
          <span className="text-xs text-ink-muted">Institutional COPC Compliance</span>
          <p className="mt-1 text-2xl font-bold text-brand-700">{compliantRate}%</p>
          <p className="text-[11px] text-ink-subtle">Target: 100% compliance</p>
        </div>

        <div className="panel p-4">
          <span className="text-xs text-ink-muted">Under Evaluation / Pending</span>
          <p className="mt-1 text-2xl font-bold text-warning-700">{pendingCount}</p>
          <p className="text-[11px] text-ink-subtle">Submitted renewal applications</p>
        </div>
      </div>

      {/* Campus COPC Breakdown Table (Reflects official data from document) */}
      <div className="mb-6 panel p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
          Campus COPC Compliance Distribution (Master Reference)
        </h3>

        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {campuses.map((c) => {
            const campusRecs = copcRecords.filter((r) => r.campusId === c.id);
            const comp = campusRecs.filter((r) => r.copcStatus === 'Compliant').length;
            const isFull = comp === campusRecs.length && campusRecs.length > 0;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCampus(c.id === selectedCampus ? 'all' : c.id)}
                className={`rounded-lg border p-3 text-left transition-all ${
                  selectedCampus === c.id
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                    : 'border-line hover:bg-canvas'
                }`}
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
                  {comp} / {campusRecs.length}
                </p>
                <p className="text-[10px] text-ink-muted">programs compliant</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="mb-5 panel p-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-ink-subtle" />
            <input
              type="text"
              placeholder="Search program or certificate number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value as any)}
              className="input h-9 text-xs py-0 w-full sm:w-auto"
            >
              <option value="all">All Campuses</option>
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
              <option value="all">All Statuses</option>
              <option value="Compliant">Compliant</option>
              <option value="Pending Review">Pending Review</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-ink-muted border-t border-line pt-2">
          <span>
            Showing <strong className="text-ink">{filtered.length}</strong> programs
          </span>
          <span className="text-success-700 font-medium">
            Institutional Rate: {compliantRate}% Compliant with CHED PSGs
          </span>
        </div>
      </div>

      {/* COPC Programs Table */}
      <div className="panel overflow-hidden">
        {/* Desktop Table View (lg+) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="bg-canvas border-b border-line text-ink-muted">
              <tr>
                <th className="th py-3 w-10">#</th>
                <th className="th py-3 min-w-[240px]">Degree Program</th>
                <th className="th py-3">Campus</th>
                <th className="th py-3">COPC Status</th>
                <th className="th py-3">Certificate Number</th>
                <th className="th py-3">Date Issued</th>
                <th className="th py-3">CHED CMO Policy</th>
                <th className="th py-3">BOR Resolution</th>
                <th className="th py-3">Requirements Audit</th>
                <th className="th py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((copc, idx) => {
                const approvedReqs = copc.requirements.filter((r) => r.status === 'Approved').length;
                return (
                  <tr key={copc.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="td py-3 font-mono text-ink-subtle text-xs">{idx + 1}</td>

                    <td className="td py-3">
                      <div className="font-semibold text-ink leading-snug">{copc.programName}</div>
                      <div className="mt-0.5 text-[11px] text-ink-muted">{copc.degreeLevel}</div>
                    </td>

                    <td className="td py-3 whitespace-nowrap text-ink-muted">
                      {copc.campusName.replace(' Campus', '')}
                    </td>

                    <td className="td py-3 whitespace-nowrap">
                      {copc.copcStatus === 'Compliant' ? (
                        <Badge tone="success" dot>
                          Compliant
                        </Badge>
                      ) : (
                        <Badge tone="warning" dot>
                          Pending Review
                        </Badge>
                      )}
                    </td>

                    <td className="td py-3 whitespace-nowrap font-mono text-xs font-semibold text-brand-700">
                      {copc.certificateNumber || 'Pending CHED Issuance'}
                    </td>

                    <td className="td py-3 whitespace-nowrap text-xs text-ink-muted">
                      {copc.dateIssued || '—'}
                    </td>

                    <td className="td py-3 text-xs text-ink-muted truncate max-w-[150px]">
                      {copc.cmoNo || '—'}
                    </td>

                    <td className="td py-3 text-xs text-ink-muted truncate max-w-[150px]">
                      {copc.borRes || '—'}
                    </td>

                    <td className="td py-3 whitespace-nowrap text-xs">
                      <span className="font-semibold text-ink">{approvedReqs} / 5</span>{' '}
                      <span className="text-ink-muted">areas verified</span>
                    </td>

                    <td className="td py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setActiveCopcProgram(copc)}
                        className="btn btn-secondary btn-sm h-7 px-2 text-xs"
                      >
                        Verify Requirements
                      </button>
                    </td>
                  </tr>
                );
              })}
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
            filtered.map((copc, idx) => {
              const approvedReqs = copc.requirements.filter((r) => r.status === 'Approved').length;
              return (
                <div key={copc.id} className="p-4 hover:bg-canvas/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-ink-subtle font-mono">
                        <span>#{idx + 1}</span>
                        <span>·</span>
                        <span className="font-sans font-medium text-ink-muted">{copc.campusName.replace(' Campus', '')}</span>
                      </div>
                      <h4 className="mt-0.5 text-sm font-bold text-ink leading-snug">
                        {copc.programName}
                      </h4>
                      <p className="text-[11px] text-ink-muted mt-0.5">{copc.degreeLevel}</p>
                    </div>

                    <Badge tone={copc.copcStatus === 'Compliant' ? 'success' : 'warning'} dot>
                      {copc.copcStatus}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs rounded-lg bg-canvas/70 p-2.5">
                    <div>
                      <span className="text-[11px] text-ink-muted">Certificate No:</span>
                      <p className="font-mono font-semibold text-brand-700 truncate mt-0.5">
                        {copc.certificateNumber || 'Pending CHED'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-ink-muted">Date Issued:</span>
                      <p className="font-medium text-ink mt-0.5">
                        {copc.dateIssued || '—'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[11px] text-ink-muted">CMO / BOR:</span>
                      <p className="font-medium text-ink truncate mt-0.5">
                        {copc.cmoNo || '—'} · {copc.borRes || '—'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[11px] text-ink-muted">Audit Verification:</span>
                      <p className="font-semibold text-ink mt-0.5">
                        {approvedReqs} / 5 areas verified
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveCopcProgram(copc)}
                      className="btn btn-secondary btn-sm w-full sm:w-auto justify-center min-h-[38px] text-xs font-semibold"
                    >
                      Verify Requirements ({approvedReqs}/5)
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* COPC Requirements Checklist Modal */}
      {activeCopcProgram && (
        <Modal
          open={!!activeCopcProgram}
          onClose={() => setActiveCopcProgram(null)}
          title={`COPC Requirements: ${activeCopcProgram.programName}`}
          description={`${activeCopcProgram.campusName} · Certificate: ${activeCopcProgram.certificateNumber || 'Pending'} · ${activeCopcProgram.copcStatus}`}
          size="xl"
          footer={
            <div className="flex w-full flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-muted">Status:</span>
                <select
                  value={activeCopcProgram.copcStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value as 'Compliant' | 'Pending Review' | 'Non-Compliant' | 'Not Applicable (Under 5 years)';
                    updateCOPCRecord(activeCopcProgram.id, { copcStatus: newStatus });
                    setActiveCopcProgram((prev) => (prev ? { ...prev, copcStatus: newStatus } : null));
                    toast.success('COPC Status updated');
                  }}
                  className="input h-9 text-xs py-0 w-auto"
                >
                  <option value="Compliant">Compliant</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setActiveCopcProgram(null)}
                className="btn btn-secondary w-full sm:w-auto min-h-[38px]"
              >
                Close Checklist
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-line bg-canvas p-3 text-xs grid gap-3 sm:grid-cols-3">
              <div>
                <span className="text-ink-muted">CHED PSG Policy</span>
                <p className="font-semibold text-ink">{activeCopcProgram.cmoNo || 'CMO Policies'}</p>
              </div>
              <div>
                <span className="text-ink-muted">Board of Regents Authority</span>
                <p className="font-semibold text-ink">{activeCopcProgram.borRes || 'N/A'}</p>
              </div>
              <div>
                <span className="text-ink-muted">Issuance / Effective Date</span>
                <p className="font-semibold text-ink">{activeCopcProgram.dateIssued || 'Under Evaluation'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                CHED 5 Minimum Mandatory Compliance Parameters
              </h4>

              <div className="panel divide-y divide-line overflow-hidden">
                {activeCopcProgram.requirements.map((req) => (
                  <div key={req.id} className="p-3.5 hover:bg-canvas/40 transition-colors">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brand-700">
                            {req.category}
                          </span>
                          <span className="font-semibold text-ink text-xs">{req.requirementName}</span>
                          <Badge
                            tone={
                              req.status === 'Approved'
                                ? 'success'
                                : req.status === 'Under Review'
                                ? 'brand'
                                : req.status === 'Deficient'
                                ? 'danger'
                                : 'warning'
                            }
                            dot
                          >
                            {req.status}
                          </Badge>
                        </div>

                        {req.documentName || req.documentUrl ? (
                          <div className="mt-1.5 flex items-center gap-2 text-xs">
                            <FileTextIcon className="h-3.5 w-3.5 text-brand-600" />
                            <span className="font-medium text-ink">{req.documentName || 'Reference link'}</span>
                            {req.documentUrl && (
                              <a
                                href={req.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-brand-600 hover:underline"
                              >
                                View File
                              </a>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-ink-subtle mt-1">No portfolio file attached.</p>
                        )}

                        {req.deficiencyNote && (
                          <p className="mt-1 text-xs text-danger-700 bg-danger-50 p-1.5 rounded border border-danger-100">
                            <strong>Note:</strong> {req.deficiencyNote}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveReqItem({
                            copc: activeCopcProgram,
                            req
                          })
                        }
                        className="btn btn-secondary btn-sm h-7 px-2.5 text-xs shrink-0"
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

      {/* Requirement Doc Modal */}
      {activeReqItem && (
        <AccreditationDocModal
          open={!!activeReqItem}
          title={activeReqItem.copc.programName}
          areaCode={activeReqItem.req.code}
          requirementTitle={activeReqItem.req.requirementName}
          currentDocumentName={activeReqItem.req.documentName}
          currentDocumentUrl={activeReqItem.req.documentUrl}
          currentStatus={activeReqItem.req.status}
          currentNotes={activeReqItem.req.deficiencyNote}
          onClose={() => setActiveReqItem(null)}
          onSave={handleSaveRequirement}
        />
      )}
    </>
  );
}
