import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../../contexts/PortalContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { AccreditationReportModal } from '../../components/accreditation/AccreditationReportModal';
import { ProgramFormModal } from '../../components/accreditation/ProgramFormModal';
import {
  Building2Icon,
  GraduationCapIcon,
  FileCheck2Icon,
  ShieldCheckIcon,
  AwardIcon,
  CalendarIcon,
  FileTextIcon,
  PlusIcon,
  CheckCircle2Icon,
  ChevronRightIcon
} from 'lucide-react';

type DashboardTab = 'all-campuses' | 'campus-level' | 'program-level' | 'schedules' | 'deficiencies';

export function AccreditationDashboard() {
  const { campuses, iaRecords, pqaRecords, programAccreditations, copcRecords, isoRecords } = usePortal();
  const [tab, setTab] = useState<DashboardTab>('all-campuses');

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [addProgramModalOpen, setAddProgramModalOpen] = useState(false);

  // Overall Statistics
  const totalPrograms = programAccreditations.length;
  const compliantCopc = programAccreditations.filter((p) => p.copcStatus === 'Compliant').length;
  const copcRate = totalPrograms > 0 ? ((compliantCopc / totalPrograms) * 100).toFixed(2) : '0';

  const level4Count = programAccreditations.filter((p) => p.status === 'Level 4').length;
  const level3Count = programAccreditations.filter((p) => p.status === 'Level 3').length;
  const level2Count = programAccreditations.filter((p) => p.status === 'Level 2').length;
  const level1Count = programAccreditations.filter((p) => p.status === 'Level 1').length;
  const candidateCount = programAccreditations.filter((p) => p.status === 'Candidate').length;

  // Scheduled accreditation visits
  const scheduledPrograms = programAccreditations.filter((p) => !!p.scheduleForAccreditation);

  // Cross-system Deficiencies
  const deficientIAReqs = iaRecords.flatMap((r) =>
    r.requirements.filter((req) => req.status === 'Deficient').map((req) => ({ ...req, campusId: r.campusId }))
  );
  const pendingCopc = copcRecords.filter((c) => c.copcStatus === 'Pending Review');
  const openCars = isoRecords.flatMap((r) =>
    (r.correctiveActions || []).filter((c) => c.status !== 'Closed / Verified').map((car) => ({ ...car, campusName: r.campusName }))
  );

  return (
    <>
      <PageHeader
        title="Accreditation & Frameworks Hub"
        description="Centralized accreditation and quality assurance portal managing campus-level certifications (IA, PQA, ISO) and academic program compliance (AACCUP, COPC)."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAddProgramModalOpen(true)}
              className="btn btn-secondary btn-sm"
            >
              <PlusIcon className="h-4 w-4" /> Add Program
            </button>
            <button
              type="button"
              onClick={() => setReportModalOpen(true)}
              className="btn btn-primary btn-sm"
            >
              <FileTextIcon className="h-4 w-4" /> Generate Master Report
            </button>
          </div>
        }
      />

      {/* Top Level Strategic Metrics */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="panel p-4">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs">University Campuses</span>
            <Building2Icon className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-1 text-2xl font-bold text-ink">{campuses.length}</p>
          <p className="text-[11px] text-ink-subtle">7 operational campuses</p>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs">Monitored Programs</span>
            <GraduationCapIcon className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-1 text-2xl font-bold text-ink">{totalPrograms}</p>
          <p className="text-[11px] text-ink-subtle">64 programs / 80 offerings</p>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs">COPC Compliance</span>
            <FileCheck2Icon className="h-4 w-4 text-success-700" />
          </div>
          <p className="mt-1 text-2xl font-bold text-success-700">
            {compliantCopc}{' '}
            <span className="text-xs font-normal text-ink-muted">({copcRate}%)</span>
          </p>
          <p className="text-[11px] text-ink-subtle">62 of 64 compliant with CHED</p>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs">ISO 9001:2015 QMS</span>
            <ShieldCheckIcon className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-1 text-2xl font-bold text-brand-700">100%</p>
          <p className="text-[11px] text-ink-subtle">Certified surveillance status</p>
        </div>

        <div className="panel p-4">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs">Surveys Scheduled</span>
            <CalendarIcon className="h-4 w-4 text-warning-700" />
          </div>
          <p className="mt-1 text-2xl font-bold text-warning-700">{scheduledPrograms.length}</p>
          <p className="text-[11px] text-ink-subtle">Scheduled AACCUP visits</p>
        </div>
      </div>

      {/* Quick Nav Modules Cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Link
          to="/frameworks/ia"
          className="group panel p-3.5 hover:border-brand-500 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="rounded bg-brand-50 p-1.5 text-brand-700">
              <Building2Icon className="h-4 w-4" />
            </span>
            <ChevronRightIcon className="h-4 w-4 text-ink-subtle group-hover:text-brand-600" />
          </div>
          <h3 className="mt-2 text-xs font-bold text-ink group-hover:text-brand-700">Institutional Acc. (IA)</h3>
          <p className="text-[11px] text-ink-muted">Campus-based survey levels</p>
        </Link>

        <Link
          to="/frameworks/pa"
          className="group panel p-3.5 hover:border-brand-500 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="rounded bg-brand-50 p-1.5 text-brand-700">
              <GraduationCapIcon className="h-4 w-4" />
            </span>
            <ChevronRightIcon className="h-4 w-4 text-ink-subtle group-hover:text-brand-600" />
          </div>
          <h3 className="mt-2 text-xs font-bold text-ink group-hover:text-brand-700">Program Accreditation</h3>
          <p className="text-[11px] text-ink-muted">All 64 programs across 7 campuses</p>
        </Link>

        <Link
          to="/frameworks/copc"
          className="group panel p-3.5 hover:border-brand-500 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="rounded bg-success-50 p-1.5 text-success-700">
              <FileCheck2Icon className="h-4 w-4" />
            </span>
            <ChevronRightIcon className="h-4 w-4 text-ink-subtle group-hover:text-success-700" />
          </div>
          <h3 className="mt-2 text-xs font-bold text-ink group-hover:text-success-700">COPC Compliance</h3>
          <p className="text-[11px] text-ink-muted">96.88% institutional rate</p>
        </Link>

        <Link
          to="/frameworks/pqa"
          className="group panel p-3.5 hover:border-brand-500 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="rounded bg-gold-100 p-1.5 text-gold-700">
              <AwardIcon className="h-4 w-4" />
            </span>
            <ChevronRightIcon className="h-4 w-4 text-ink-subtle group-hover:text-gold-700" />
          </div>
          <h3 className="mt-2 text-xs font-bold text-ink group-hover:text-gold-700">Philippine Quality Award</h3>
          <p className="text-[11px] text-ink-muted">Campus 7 criteria scorecard</p>
        </Link>

        <Link
          to="/frameworks/iso"
          className="group panel p-3.5 hover:border-brand-500 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="rounded bg-brand-50 p-1.5 text-brand-700">
              <ShieldCheckIcon className="h-4 w-4" />
            </span>
            <ChevronRightIcon className="h-4 w-4 text-ink-subtle group-hover:text-brand-600" />
          </div>
          <h3 className="mt-2 text-xs font-bold text-ink group-hover:text-brand-700">ISO Surveillance QMS</h3>
          <p className="text-[11px] text-ink-muted">Audits & CAR management</p>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs<DashboardTab>
        label="Accreditation Hub Views"
        value={tab}
        onChange={setTab}
        className="mb-5"
        tabs={[
          { id: 'all-campuses', label: 'All Campuses Overview' },
          { id: 'campus-level', label: 'Campus-Level Accreditations (IA, PQA, ISO)' },
          { id: 'program-level', label: `Program Accreditations (${totalPrograms})` },
          { id: 'schedules', label: `Upcoming Surveys (${scheduledPrograms.length})` },
          {
            id: 'deficiencies',
            label: `Deficiencies & Actions (${deficientIAReqs.length + pendingCopc.length + openCars.length})`
          }
        ]}
      />

      {/* TAB 1: ALL CAMPUSES OVERVIEW */}
      {tab === 'all-campuses' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campuses.map((c) => {
              const ia = iaRecords.find((i) => i.campusId === c.id);
              const pqa = pqaRecords.find((p) => p.campusId === c.id);
              const iso = isoRecords.find((i) => i.campusId === c.id);
              const progs = programAccreditations.filter((p) => p.campusId === c.id);
              const copc = progs.filter((p) => p.copcStatus === 'Compliant').length;
              const rate = progs.length > 0 ? ((copc / progs.length) * 100).toFixed(0) : '0';

              return (
                <div key={c.id} className="panel p-5 hover:border-brand-400 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-ink">{c.name}</h3>
                          {c.isMain && <Badge tone="gold">Main</Badge>}
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5">{c.location}</p>
                      </div>
                      <Badge tone="brand">{ia?.status || 'Candidate'}</Badge>
                    </div>

                    <div className="mt-4 space-y-2 border-t border-line pt-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">PQA Recognition:</span>
                        <span className="font-semibold text-ink truncate max-w-[170px] text-right">
                          {pqa?.recognitionLevel.split(':')[0] || 'Candidate'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">ISO 9001:2015:</span>
                        <span className="font-semibold text-success-700">{iso?.complianceStatus || 'Compliant'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Academic Programs:</span>
                        <span className="font-semibold text-ink">{progs.length} programs</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">COPC Compliance Rate:</span>
                        <span className="font-bold text-brand-700">
                          {copc} / {progs.length} ({rate}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-line pt-3 flex items-center justify-between">
                    <Link
                      to={`/frameworks/pa?campus=${c.id}`}
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      View Campus Programs →
                    </Link>
                    <Link
                      to={`/frameworks/ia`}
                      className="btn btn-secondary btn-sm h-7 text-xs"
                    >
                      Audit IA
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CAMPUS-LEVEL ACCREDITATIONS (IA, PQA, ISO) */}
      {tab === 'campus-level' && (
        <div className="panel overflow-hidden">
          <div className="p-4 border-b border-line flex items-center justify-between bg-canvas/40">
            <div>
              <h3 className="text-sm font-bold text-ink">Campus Institutional Quality Matrix</h3>
              <p className="text-xs text-ink-muted">Comparative status of all 7 university campuses across IA, PQA, and ISO QMS.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-line text-ink-muted">
                <tr>
                  <th className="th py-3">Campus Name</th>
                  <th className="th py-3">Director</th>
                  <th className="th py-3">Institutional Acc. (IA)</th>
                  <th className="th py-3">IA Validity Period</th>
                  <th className="th py-3">PQA Quality Level</th>
                  <th className="th py-3">PQA Score</th>
                  <th className="th py-3">ISO Surveillance Status</th>
                  <th className="th py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {campuses.map((c) => {
                  const ia = iaRecords.find((i) => i.campusId === c.id);
                  const pqa = pqaRecords.find((p) => p.campusId === c.id);
                  const iso = isoRecords.find((i) => i.campusId === c.id);
                  return (
                    <tr key={c.id} className="hover:bg-canvas/50">
                      <td className="td py-3">
                        <span className="font-semibold text-ink">{c.name}</span>
                        {c.isMain && <span className="ml-1 text-[10px] text-brand-700 font-bold">(Main)</span>}
                      </td>
                      <td className="td py-3 text-ink-muted">{c.director}</td>
                      <td className="td py-3">
                        <Badge tone="brand">{ia?.status || 'Candidate'}</Badge>
                      </td>
                      <td className="td py-3 text-ink-muted">
                        {ia?.validityStart} to {ia?.validityEnd}
                      </td>
                      <td className="td py-3 text-ink font-medium">
                        {pqa?.recognitionLevel.split(':')[0]}
                      </td>
                      <td className="td py-3 text-ink font-bold tabular-nums">
                        {pqa?.overallScore} / 1000
                      </td>
                      <td className="td py-3">
                        <Badge tone="success">{iso?.complianceStatus || 'Compliant'}</Badge>
                      </td>
                      <td className="td py-3 text-right">
                        <Link to="/frameworks/ia" className="btn btn-secondary btn-sm h-7 text-xs">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PROGRAM-LEVEL ACCREDITATION SUMMARY */}
      {tab === 'program-level' && (
        <div className="space-y-4">
          <div className="panel p-5">
            <h3 className="text-sm font-bold text-ink mb-2">AACCUP Program Accreditation Level Breakdown</h3>
            <p className="text-xs text-ink-muted mb-4">
              Distribution of degree programs across AACCUP survey levels and Candidate status.
            </p>

            <div className="grid gap-3 sm:grid-cols-5">
              <div className="rounded-lg border border-gold-200 bg-gold-50/50 p-3">
                <span className="text-xs font-semibold text-gold-900">Level 4 Accredited</span>
                <p className="text-2xl font-bold text-gold-900 mt-1">{level4Count}</p>
                <p className="text-[11px] text-gold-800">Highest program quality</p>
              </div>

              <div className="rounded-lg border border-success-200 bg-success-50/50 p-3">
                <span className="text-xs font-semibold text-success-900">Level 3 Re-accredited</span>
                <p className="text-2xl font-bold text-success-900 mt-1">{level3Count}</p>
                <p className="text-[11px] text-success-800">Mature instructional standard</p>
              </div>

              <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-3">
                <span className="text-xs font-semibold text-brand-900">Level 2 Re-accredited</span>
                <p className="text-2xl font-bold text-brand-900 mt-1">{level2Count}</p>
                <p className="text-[11px] text-brand-800">Fully validated programs</p>
              </div>

              <div className="rounded-lg border border-line bg-canvas p-3">
                <span className="text-xs font-semibold text-ink">Level 1 Accredited</span>
                <p className="text-2xl font-bold text-ink mt-1">{level1Count}</p>
                <p className="text-[11px] text-ink-muted">Initial formal accreditation</p>
              </div>

              <div className="rounded-lg border border-warning-200 bg-warning-50/50 p-3">
                <span className="text-xs font-semibold text-warning-900">Candidate / In Prep</span>
                <p className="text-2xl font-bold text-warning-900 mt-1">{candidateCount}</p>
                <p className="text-[11px] text-warning-800">Candidate survey status</p>
              </div>
            </div>

            <div className="mt-5 border-t border-line pt-4 flex justify-between items-center">
              <span className="text-xs text-ink-muted">
                Track full roster of programs, Drive links, and certificates:
              </span>
              <Link to="/frameworks/pa" className="btn btn-primary btn-sm">
                Open Full Program Accreditation Masterlist →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHEDULES & EXPIRATION MONITORING */}
      {tab === 'schedules' && (
        <div className="panel overflow-hidden">
          <div className="p-4 border-b border-line flex items-center justify-between bg-canvas/40">
            <div>
              <h3 className="text-sm font-bold text-ink">Upcoming Accreditation Survey Schedule</h3>
              <p className="text-xs text-ink-muted">
                Programs with scheduled AACCUP survey visits and validity expirations recorded from official masterlist.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-line text-ink-muted">
                <tr>
                  <th className="th py-3">Scheduled Date</th>
                  <th className="th py-3">Program Name</th>
                  <th className="th py-3">Campus</th>
                  <th className="th py-3">Current Status</th>
                  <th className="th py-3">Validity End</th>
                  <th className="th py-3">COPC Status</th>
                  <th className="th py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {scheduledPrograms.map((p) => (
                  <tr key={p.id} className="hover:bg-canvas/50">
                    <td className="td py-3 whitespace-nowrap">
                      <span className="font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 flex items-center gap-1 w-max">
                        <CalendarIcon className="h-3 w-3" />
                        {p.scheduleForAccreditation}
                      </span>
                    </td>
                    <td className="td py-3 font-semibold text-ink">{p.programName}</td>
                    <td className="td py-3 text-ink-muted">{p.campusName}</td>
                    <td className="td py-3">
                      <Badge tone="brand">{p.status}</Badge>
                    </td>
                    <td className="td py-3 text-ink-muted">{p.validityEnd || '—'}</td>
                    <td className="td py-3">
                      {p.copcStatus === 'Compliant' ? (
                        <span className="text-success-700 font-medium">Compliant</span>
                      ) : (
                        <span className="text-warning-700 font-medium">Pending</span>
                      )}
                    </td>
                    <td className="td py-3 text-right">
                      <Link to="/frameworks/pa" className="btn btn-secondary btn-sm h-7 text-xs">
                        View Dossier
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DEFICIENCIES & ACTION TRACKER */}
      {tab === 'deficiencies' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="panel p-4 border-l-4 border-l-danger-600">
              <span className="text-xs text-ink-muted">IA Areas with Deficiencies</span>
              <p className="text-xl font-bold text-danger-700 mt-1">{deficientIAReqs.length}</p>
              <p className="text-[11px] text-ink-subtle">Flagged during campus institutional review</p>
            </div>

            <div className="panel p-4 border-l-4 border-l-warning-600">
              <span className="text-xs text-ink-muted">Pending COPC Applications</span>
              <p className="text-xl font-bold text-warning-700 mt-1">{pendingCopc.length}</p>
              <p className="text-[11px] text-ink-subtle">Under evaluation at CHED Regional Office</p>
            </div>

            <div className="panel p-4 border-l-4 border-l-brand-600">
              <span className="text-xs text-ink-muted">Open ISO Corrective Actions (CARs)</span>
              <p className="text-xl font-bold text-brand-700 mt-1">{openCars.length}</p>
              <p className="text-[11px] text-ink-subtle">Non-conformances pending resolution</p>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="p-4 border-b border-line bg-canvas/40">
              <h3 className="text-sm font-bold text-ink">Active University Quality Action Items</h3>
              <p className="text-xs text-ink-muted">Items requiring corrective response or regulatory documentation.</p>
            </div>

            <div className="divide-y divide-line text-xs">
              {deficientIAReqs.map((d) => (
                <div key={d.id} className="p-4 flex items-center justify-between">
                  <div>
                    <Badge tone="danger">IA Deficiency</Badge>
                    <h4 className="font-semibold text-ink text-sm mt-1">{d.title}</h4>
                    <p className="text-ink-muted mt-0.5">{d.reviewerNotes || d.description}</p>
                  </div>
                  <Link to="/frameworks/ia" className="btn btn-secondary btn-sm">
                    Resolve in IA
                  </Link>
                </div>
              ))}

              {pendingCopc.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div>
                    <Badge tone="warning">COPC Pending</Badge>
                    <h4 className="font-semibold text-ink text-sm mt-1">
                      {c.programName} ({c.campusName})
                    </h4>
                    <p className="text-ink-muted mt-0.5">{c.remarks || 'Awaiting CHED regional confirmation.'}</p>
                  </div>
                  <Link to="/frameworks/copc" className="btn btn-secondary btn-sm">
                    Manage COPC
                  </Link>
                </div>
              ))}

              {openCars.map((car) => (
                <div key={car.id} className="p-4 flex items-center justify-between">
                  <div>
                    <Badge tone="brand">ISO CAR: {car.carNumber}</Badge>
                    <h4 className="font-semibold text-ink text-sm mt-1">
                      {car.deficiencyDescription} ({car.campusName})
                    </h4>
                    <p className="text-ink-muted mt-0.5">
                      Target Date: <strong>{car.targetDate}</strong> · Resp: {car.responsiblePerson}
                    </p>
                  </div>
                  <Link to="/frameworks/iso" className="btn btn-secondary btn-sm">
                    Audit & Verify CAR
                  </Link>
                </div>
              ))}

              {deficientIAReqs.length === 0 && pendingCopc.length === 0 && openCars.length === 0 && (
                <div className="p-8 text-center text-ink-muted">
                  <CheckCircle2Icon className="mx-auto h-8 w-8 text-success-600 mb-2" />
                  All quality items, COPC submissions, and ISO surveillance conformances are fully compliant.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official Master Report Modal */}
      <AccreditationReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />

      {/* Add Academic Program Modal */}
      <ProgramFormModal
        open={addProgramModalOpen}
        program={null}
        onClose={() => setAddProgramModalOpen(false)}
      />
    </>
  );
}
