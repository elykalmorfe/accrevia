import React, { useState } from 'react';
import { usePortal } from '../../contexts/PortalContext';
import { Badge } from '../ui/Badge';
import { PrinterIcon } from 'lucide-react';
import { AccreditationReportModal } from '../accreditation/AccreditationReportModal';

export function AccreditationMasterReport() {
  const { campuses, programAccreditations } = usePortal();
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const filteredPrograms = selectedCampus === 'all'
    ? programAccreditations
    : programAccreditations.filter((p) => p.campusId === selectedCampus);

  const totalPrograms = programAccreditations.length;
  const compliantCount = programAccreditations.filter((p) => p.copcStatus === 'Compliant').length;
  const copcPercent = totalPrograms > 0 ? ((compliantCount / totalPrograms) * 100).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
                Official Reference
              </span>
              <h2 className="text-base font-bold text-ink">
                AACCUP Program Accreditation & COPC Compliance Masterlist
              </h2>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Official institutional record of North Eastern Mindanao State University accreditation standing across all 7 campuses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="btn btn-primary btn-sm"
            >
              <PrinterIcon className="h-4 w-4" /> Print / Export Formal Report
            </button>
          </div>
        </div>

        {/* Executive summary metrics */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-line bg-canvas/60 p-3">
            <span className="text-xs text-ink-muted">Monitored Campuses</span>
            <p className="text-xl font-bold text-ink mt-0.5">{campuses.length}</p>
            <p className="text-[11px] text-ink-subtle">Tandag, Cantilan, Cagwait, etc.</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas/60 p-3">
            <span className="text-xs text-ink-muted">Academic Programs</span>
            <p className="text-xl font-bold text-ink mt-0.5">{totalPrograms}</p>
            <p className="text-[11px] text-ink-subtle">64 programs / 80 majors</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas/60 p-3">
            <span className="text-xs text-ink-muted">Programs with COPC</span>
            <p className="text-xl font-bold text-success-700 mt-0.5">
              {compliantCount} <span className="text-xs font-normal text-ink-muted">({copcPercent}%)</span>
            </p>
            <p className="text-[11px] text-ink-subtle">CHED PSG compliant</p>
          </div>
          <div className="rounded-lg border border-line bg-canvas/60 p-3">
            <span className="text-xs text-ink-muted">ISO 9001:2015 QMS</span>
            <p className="text-xl font-bold text-brand-700 mt-0.5">100%</p>
            <p className="text-[11px] text-ink-subtle">All 7 campuses monitored</p>
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="panel overflow-hidden">
        <div className="p-4 border-b border-line flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-canvas/40">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-ink">Filter by Campus:</label>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="input h-8 text-xs py-0 w-auto"
            >
              <option value="all">All Campuses (Consolidated)</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-ink-muted">
            Displaying <strong>{filteredPrograms.length}</strong> programs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas border-b border-line text-ink-muted">
              <tr>
                <th className="th py-2.5 w-8">#</th>
                <th className="th py-2.5">Programs Offered</th>
                <th className="th py-2.5">Campus</th>
                <th className="th py-2.5">Initial Op.</th>
                <th className="th py-2.5">Accreditation Status</th>
                <th className="th py-2.5">Validity Period</th>
                <th className="th py-2.5">Certification File</th>
                <th className="th py-2.5">COPC</th>
                <th className="th py-2.5">Schedule</th>
                <th className="th py-2.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredPrograms.map((p, idx) => (
                <tr key={p.id} className="hover:bg-canvas/40">
                  <td className="td py-2.5 font-mono text-ink-subtle">{idx + 1}</td>
                  <td className="td py-2.5 font-semibold text-ink">
                    {p.programName}
                    {p.degreeLevel === 'Graduate' && (
                      <span className="ml-1 rounded bg-brand-50 px-1 py-0.5 text-[10px] text-brand-700">
                        Graduate
                      </span>
                    )}
                  </td>
                  <td className="td py-2.5 text-ink-muted">{p.campusName.replace(' Campus', '')}</td>
                  <td className="td py-2.5 text-ink-muted">{p.yearOfInitialOperation || '—'}</td>
                  <td className="td py-2.5">
                    <Badge
                      tone={
                        p.status.includes('Level 4')
                          ? 'gold'
                          : p.status.includes('Level 3')
                          ? 'success'
                          : p.status.includes('Level 2')
                          ? 'brand'
                          : p.status.includes('Level 1')
                          ? 'neutral'
                          : p.status === 'Not Accreditable'
                          ? 'danger'
                          : 'warning'
                      }
                      dot
                    >
                      {p.status}
                    </Badge>
                  </td>
                  <td className="td py-2.5 text-ink-muted whitespace-nowrap">
                    {p.validityStart && p.validityEnd ? `${p.validityStart} to ${p.validityEnd}` : '—'}
                  </td>
                  <td className="td py-2.5 text-ink-muted truncate max-w-[120px]">
                    {p.certificationFile || '—'}
                  </td>
                  <td className="td py-2.5">
                    {p.copcStatus === 'Compliant' ? (
                      <span className="text-success-700 font-medium">Compliant</span>
                    ) : (
                      <span className="text-warning-700 font-medium">Pending</span>
                    )}
                  </td>
                  <td className="td py-2.5 whitespace-nowrap">
                    {p.scheduleForAccreditation ? (
                      <span className="font-semibold text-brand-700">{p.scheduleForAccreditation}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="td py-2.5 text-ink-muted truncate max-w-[180px]">
                    {p.remarks || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AccreditationReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </div>
  );
}
