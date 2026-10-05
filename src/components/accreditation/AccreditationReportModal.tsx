import React, { useState } from 'react';
import { usePortal } from '../../contexts/PortalContext';
import { Modal } from '../ui/Modal';
import { PrinterIcon, DownloadIcon, BuildingIcon } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface AccreditationReportModalProps {
  open: boolean;
  onClose: () => void;
}

export function AccreditationReportModal({ open, onClose }: AccreditationReportModalProps) {
  const { campuses, programAccreditations, iaRecords, isoRecords } = usePortal();
  const [selectedCampus, setSelectedCampus] = useState<string>('all');

  const filteredPrograms = selectedCampus === 'all'
    ? programAccreditations
    : programAccreditations.filter((p) => p.campusId === selectedCampus);

  const totalPrograms = programAccreditations.length;
  const programsWithCopc = programAccreditations.filter((p) => p.copcStatus === 'Compliant').length;
  const copcPercent = totalPrograms > 0 ? ((programsWithCopc / totalPrograms) * 100).toFixed(2) : '0';

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Campus',
      'Degree Level',
      'Program Offered',
      'Initial Operation',
      'Accreditation Status',
      'Validity Start',
      'Validity End',
      'Certification',
      'COPC Status',
      'BOR Resolution',
      'CMO No',
      'Accreditation Schedule',
      'Remarks'
    ];

    const rows = filteredPrograms.map((p) => [
      `"${p.campusName}"`,
      `"${p.degreeLevel}"`,
      `"${p.programName.replace(/"/g, '""')}"`,
      `"${p.yearOfInitialOperation}"`,
      `"${p.status}"`,
      `"${p.validityStart}"`,
      `"${p.validityEnd}"`,
      `"${p.certificationFile || ''}"`,
      `"${p.copcStatus}"`,
      `"${p.borRes || ''}"`,
      `"${p.cmoNo || ''}"`,
      `"${p.scheduleForAccreditation || ''}"`,
      `"${(p.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NEMSU_Accreditation_Status_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Official Accreditation & Compliance Status Report"
      description="Consolidated AACCUP program accreditation, institutional status, and Certificate of Program Compliance (COPC) matrix."
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink-muted">Filter Campus:</label>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="input h-8 text-xs py-0"
            >
              <option value="all">All Campuses (Consolidated)</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={handleExportCSV} className="btn btn-secondary btn-sm">
              <DownloadIcon className="h-4 w-4" /> Export CSV
            </button>
            <button type="button" onClick={handlePrint} className="btn btn-primary btn-sm">
              <PrinterIcon className="h-4 w-4" /> Print / Save PDF
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 print:p-0">
        {/* Formal Institutional Header */}
        <div className="border-b border-line pb-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700 mb-2 border border-brand-200">
            <BuildingIcon className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold uppercase tracking-wider text-ink">
            North Eastern Mindanao State University
          </h2>
          <p className="text-xs font-semibold uppercase text-brand-700">
            Office of Quality Assurance & Accreditation
          </p>
          <h3 className="mt-1 text-sm font-semibold text-ink-muted">
            AACCUP PROGRAM ACCREDITATION & COPC STATUS REPORT
          </h3>
          <p className="text-[11px] text-ink-subtle">
            Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-line bg-canvas/60 p-3">
            <p className="text-xs text-ink-muted">Total Campuses</p>
            <p className="text-xl font-bold text-ink">{campuses.length}</p>
            <p className="text-[11px] text-ink-subtle">All university units</p>
          </div>

          <div className="rounded-lg border border-line bg-canvas/60 p-3">
            <p className="text-xs text-ink-muted">Academic Programs</p>
            <p className="text-xl font-bold text-ink">{totalPrograms}</p>
            <p className="text-[11px] text-ink-subtle">64 programs / 80 majors</p>
          </div>

          <div className="rounded-lg border border-line bg-canvas/60 p-3">
            <p className="text-xs text-ink-muted">Programs with COPC</p>
            <p className="text-xl font-bold text-success-700">
              {programsWithCopc} <span className="text-xs font-normal text-ink-muted">({copcPercent}%)</span>
            </p>
            <p className="text-[11px] text-ink-subtle">CHED PSG compliant</p>
          </div>

          <div className="rounded-lg border border-line bg-canvas/60 p-3">
            <p className="text-xs text-ink-muted">ISO 9001:2015 QMS</p>
            <p className="text-xl font-bold text-brand-700">100%</p>
            <p className="text-[11px] text-ink-subtle">All 7 campuses compliant</p>
          </div>
        </div>

        {/* Institutional Campus Accreditation Summary Table */}
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
            1. Campus-Level Institutional Accreditation & Quality Summary
          </h4>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-line text-ink-muted">
                <tr>
                  <th className="th py-2">Campus</th>
                  <th className="th py-2">Location</th>
                  <th className="th py-2">Institutional Accreditation (IA)</th>
                  <th className="th py-2">IA Validity</th>
                  <th className="th py-2">PQA Status</th>
                  <th className="th py-2">ISO Surveillance</th>
                  <th className="th py-2">COPC Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {campuses.map((c) => {
                  const ia = iaRecords.find((i) => i.campusId === c.id);
                  const iso = isoRecords.find((i) => i.campusId === c.id);
                  const campusProgs = programAccreditations.filter((p) => p.campusId === c.id);
                  const withCopc = campusProgs.filter((p) => p.copcStatus === 'Compliant').length;
                  const rate = campusProgs.length > 0 ? ((withCopc / campusProgs.length) * 100).toFixed(0) : '0';

                  return (
                    <tr key={c.id}>
                      <td className="td py-2 font-medium text-ink">
                        {c.name} {c.isMain && <span className="text-[10px] text-brand-700 font-semibold">(Main)</span>}
                      </td>
                      <td className="td py-2 text-ink-muted">{c.location}</td>
                      <td className="td py-2">
                        <Badge tone="brand">{ia?.status || 'Candidate'}</Badge>
                      </td>
                      <td className="td py-2 text-ink-muted">
                        {ia?.validityEnd || '—'}
                      </td>
                      <td className="td py-2 text-ink-muted">
                        {c.id === 'tandag' ? 'Level 3 Mastery' : c.id === 'cantilan' || c.id === 'lianga' || c.id === 'bislig' ? 'Level 2 Proficiency' : 'Level 1 Commitment'}
                      </td>
                      <td className="td py-2">
                        <span className="text-success-700 font-medium">{iso?.complianceStatus || 'Compliant'}</span>
                      </td>
                      <td className="td py-2 font-medium">
                        {withCopc}/{campusProgs.length} ({rate}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Program Accreditation Matrix */}
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
            2. Program Accreditation Status & Details (Ref: Uploaded Official Masterlist)
          </h4>

          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-[11.5px]">
              <thead className="bg-canvas border-b border-line text-ink-muted">
                <tr>
                  <th className="th py-2 w-8">#</th>
                  <th className="th py-2">Programs Offered</th>
                  <th className="th py-2">Campus</th>
                  <th className="th py-2">Initial Op.</th>
                  <th className="th py-2">Status</th>
                  <th className="th py-2">Validity Period</th>
                  <th className="th py-2">Certificate</th>
                  <th className="th py-2">COPC Status</th>
                  <th className="th py-2">Schedule</th>
                  <th className="th py-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredPrograms.map((prog, idx) => (
                  <tr key={prog.id} className="hover:bg-canvas/40">
                    <td className="td py-2 font-mono text-ink-subtle">{idx + 1}</td>
                    <td className="td py-2">
                      <span className="font-semibold text-ink">{prog.programName}</span>
                      {prog.degreeLevel === 'Graduate' && (
                        <span className="ml-1.5 rounded bg-brand-50 px-1 py-0.5 text-[10px] text-brand-700 font-medium">
                          Graduate
                        </span>
                      )}
                    </td>
                    <td className="td py-2 whitespace-nowrap text-ink-muted">{prog.campusName.replace(' Campus', '')}</td>
                    <td className="td py-2 whitespace-nowrap text-ink-muted">{prog.yearOfInitialOperation || '—'}</td>
                    <td className="td py-2 whitespace-nowrap">
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
                      >
                        {prog.status}
                      </Badge>
                    </td>
                    <td className="td py-2 whitespace-nowrap text-ink-muted">
                      {prog.validityStart && prog.validityEnd
                        ? `${prog.validityStart} to ${prog.validityEnd}`
                        : '—'}
                    </td>
                    <td className="td py-2 text-ink-muted truncate max-w-[120px]">
                      {prog.certificationFile || '—'}
                    </td>
                    <td className="td py-2 whitespace-nowrap">
                      {prog.copcStatus === 'Compliant' ? (
                        <span className="text-success-700 font-medium">Compliant</span>
                      ) : (
                        <span className="text-warning-700 font-medium">Pending</span>
                      )}
                    </td>
                    <td className="td py-2 whitespace-nowrap text-ink-muted">
                      {prog.scheduleForAccreditation || '—'}
                    </td>
                    <td className="td py-2 text-ink-muted max-w-[200px] truncate">
                      {prog.remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Certification Signature Block */}
        <div className="grid grid-cols-2 gap-8 border-t border-line pt-6 text-center text-xs text-ink">
          <div>
            <p className="font-semibold">Prepared by:</p>
            <div className="mt-8 border-t border-line mx-auto w-48 pt-1">
              <p className="font-bold">Prof. Liza M. Cabrera</p>
              <p className="text-ink-muted">Director, Quality Assurance & Accreditation</p>
            </div>
          </div>
          <div>
            <p className="font-semibold">Approved by:</p>
            <div className="mt-8 border-t border-line mx-auto w-48 pt-1">
              <p className="font-bold">Dr. Maria L. Santos</p>
              <p className="text-ink-muted">University President / Executive VP</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
