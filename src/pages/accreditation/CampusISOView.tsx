import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { CampusId, ISOCorrectiveAction } from '../../types/accreditation';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { ISOSurveillanceModal } from '../../components/accreditation/ISOSurveillanceModal';
import { Modal } from '../../components/ui/Modal';
import { TextField } from '../../components/ui/TextField';
import {
  ShieldCheckIcon,
  CheckCircle2Icon,
  PlusIcon,
  UserCheckIcon,
  PencilIcon,
  RotateCcwIcon,
  HistoryIcon,
  FileTextIcon,
  ArchiveIcon,
  ExternalLinkIcon,
  LayersIcon
} from 'lucide-react';

const DEFAULT_ISO_TITLE = 'ISO 9001:2015 Surveillance, Monitoring & Compliance';
const DEFAULT_ISO_DESCRIPTION =
  'Campus-level quality management system monitoring, clause surveillance audits, Corrective Action Request (CAR) tracking, and auditor sign-off.';

export function CampusISOView() {
  const { campuses, isoRecords, documents, updateISOCorrectiveAction, currentUser } = usePortal();
  const [selectedCampusId, setSelectedCampusId] = useState<CampusId>('tandag');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedStageFilter, setSelectedStageFilter] = useState<'All' | 'For Surveillance' | '2nd Surveillance' | 'Recertification'>('All');

  const campus = campuses.find((c) => c.id === selectedCampusId) || campuses[0];
  const campusRecords = isoRecords.filter((r) => r.campusId === selectedCampusId);
  const activeRecord = campusRecords.find((r) => !r.isHistorical) || campusRecords[0];
  const isoRecord = campusRecords.find((r) => r.id === selectedRecordId) || activeRecord || isoRecords[0];

  const handleSelectCampus = (cid: CampusId) => {
    setSelectedCampusId(cid);
    setSelectedRecordId(null);
  };

  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<ISOCorrectiveAction | null>(null);
  const [verifyDate, setVerifyDate] = useState(new Date().toISOString().slice(0, 10));
  const [verifyNotes, setVerifyNotes] = useState('');

  // Editable Section Header State
  const [sectionTitle, setSectionTitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('accrevia_iso_section_title');
      return saved ? JSON.parse(saved) : DEFAULT_ISO_TITLE;
    } catch {
      return DEFAULT_ISO_TITLE;
    }
  });
  const [sectionDescription, setSectionDescription] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('accrevia_iso_section_description');
      return saved ? JSON.parse(saved) : DEFAULT_ISO_DESCRIPTION;
    } catch {
      return DEFAULT_ISO_DESCRIPTION;
    }
  });

  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [modalTitleValue, setModalTitleValue] = useState(sectionTitle);
  const [modalDescValue, setModalDescValue] = useState(sectionDescription);

  const handleSaveModalHeader = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = modalTitleValue.trim();
    if (!trimmedTitle) {
      toast.error('Title cannot be empty');
      return;
    }
    const trimmedDesc = modalDescValue.trim() || DEFAULT_ISO_DESCRIPTION;
    setSectionTitle(trimmedTitle);
    setSectionDescription(trimmedDesc);
    try {
      localStorage.setItem('accrevia_iso_section_title', JSON.stringify(trimmedTitle));
      localStorage.setItem('accrevia_iso_section_description', JSON.stringify(trimmedDesc));
    } catch {
      // Ignore storage errors
    }
    setHeaderModalOpen(false);
    toast.success('ISO section header updated');
  };

  const handleResetHeader = () => {
    setSectionTitle(DEFAULT_ISO_TITLE);
    setSectionDescription(DEFAULT_ISO_DESCRIPTION);
    setModalTitleValue(DEFAULT_ISO_TITLE);
    setModalDescValue(DEFAULT_ISO_DESCRIPTION);
    try {
      localStorage.removeItem('accrevia_iso_section_title');
      localStorage.removeItem('accrevia_iso_section_description');
    } catch {
      // Ignore
    }
    setHeaderModalOpen(false);
    toast.success('Reset to default header');
  };

  const handleVerifyCar = () => {
    if (!selectedCar) return;
    updateISOCorrectiveAction(isoRecord.id, selectedCar.id, {
      status: 'Closed / Verified',
      verificationDate: verifyDate,
      verifiedBy: currentUser.name || 'Lead Quality Auditor'
    });
    toast.success(`CAR ${selectedCar.carNumber} marked as Verified and Closed`);
    setSelectedCar(null);
  };

  const openCars = (isoRecord.correctiveActions || []).filter((c) => c.status !== 'Closed / Verified');

  // ISO Documents filtering
  const isoDocuments = documents.filter(
    (d) => d.frameworkId === 'iso' || (d.keywords && d.keywords.some((t) => t.toLowerCase().includes('iso')))
  );

  const filteredIsoDocs = isoDocuments.filter((doc) => {
    if (selectedStageFilter === 'All') return true;
    return doc.isoStage === selectedStageFilter;
  });

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link to="/frameworks" className="hover:text-ink hover:underline">
              Accreditation & Frameworks
            </Link>{' '}
            / Quality Management
          </span>
        }
        title={sectionTitle}
        description={sectionDescription}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setModalTitleValue(sectionTitle);
                setModalDescValue(sectionDescription);
                setHeaderModalOpen(true);
              }}
              className="btn btn-secondary btn-sm"
              title="Edit Section Title & Header"
            >
              <PencilIcon className="h-4 w-4" /> Edit Header
            </button>
            <button
              type="button"
              onClick={() => setAuditModalOpen(true)}
              className="btn btn-primary btn-sm"
            >
              <PlusIcon className="h-4 w-4" /> Conduct Surveillance Audit
            </button>
          </div>
        }
      />

      {/* Campus Selector Pills */}
      <div className="mb-6 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 border-b border-line pb-4">
        {campuses.map((c) => {
          const rec = isoRecords.find((r) => r.campusId === c.id && !r.isHistorical) || isoRecords.find((r) => r.campusId === c.id);
          const isSelected = c.id === selectedCampusId;
          const openCarCount = (rec?.correctiveActions || []).filter((x) => x.status !== 'Closed / Verified').length;
          return (
            <button
              key={c.id}
              onClick={() => handleSelectCampus(c.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-left transition-all ${
                isSelected
                  ? 'border-brand-500 bg-brand-50/70 shadow-sm ring-1 ring-brand-500'
                  : 'border-line bg-white hover:bg-canvas'
              }`}
            >
              <ShieldCheckIcon className={`h-4 w-4 ${isSelected ? 'text-brand-700' : 'text-ink-subtle'}`} />
              <div>
                <p className={`text-xs font-semibold ${isSelected ? 'text-brand-900' : 'text-ink'}`}>
                  {c.shortName}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <span>{rec?.complianceStatus || 'Compliant'}</span>
                  {openCarCount > 0 && (
                    <span className="rounded bg-danger-100 px-1 font-bold text-danger-700 text-[10px]">
                      {openCarCount} CAR
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Historical Audit Cycle & Standard Selector */}
      {campusRecords.length > 1 && (
        <div className="mb-6 rounded-lg border border-line bg-canvas/60 p-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <LayersIcon className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-ink">
                ISO Standards & Surveillance Cycles ({campus.shortName})
              </span>
            </div>
            <span className="text-[11px] text-ink-muted">
              All previous ISO standards and records are preserved permanently for historical reference.
            </span>
          </div>

          <div className="mt-3 flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2">
            {campusRecords.map((rec) => {
              const isCurrent = rec.id === isoRecord.id;
              const isHistorical = !!rec.isHistorical;
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setSelectedRecordId(rec.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-all ${
                    isCurrent
                      ? 'border-brand-500 bg-brand-50 font-semibold text-brand-900 shadow-xs ring-1 ring-brand-500'
                      : 'border-line bg-white text-ink hover:bg-canvas'
                  }`}
                >
                  {isHistorical ? (
                    <HistoryIcon className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <ShieldCheckIcon className="h-3.5 w-3.5 text-brand-600" />
                  )}
                  <span>{rec.standardVersion || 'ISO 9001:2015'}</span>
                  <span className="text-ink-muted">·</span>
                  <span>{rec.cycle}</span>
                  {isHistorical ? (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      Preserved
                    </span>
                  ) : (
                    <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                      Active Cycle
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Preserved Historical Record Callout Banner */}
      {isoRecord.isHistorical && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50/80 p-4 text-amber-900 shadow-sm flex items-start gap-3.5">
          <div className="rounded-md bg-amber-100 p-2 text-amber-700 shrink-0">
            <HistoryIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-sm text-amber-950">
                Preserved Historical ISO Standard & Audit Record
              </h4>
              <Badge tone="warning">Preserved · Read-Only</Badge>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-200/60 text-amber-900">
                {isoRecord.standardVersion || 'ISO 9001:2015'}
              </span>
            </div>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
              Viewing preserved historical audit record for <strong>{campus.name}</strong> ({isoRecord.cycle}, audited on {isoRecord.auditDate}). As required by quality management policies, all previous ISO standards, surveillance evaluations, and compliance records are retained permanently for institutional accreditation and regulatory audits. Past records are never overwritten or deleted.
            </p>
            {activeRecord && activeRecord.id !== isoRecord.id && (
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedRecordId(activeRecord.id)}
                  className="btn btn-secondary btn-sm text-xs bg-white text-ink border-amber-300 hover:bg-amber-100/50"
                >
                  Return to Active Audit Cycle ({activeRecord.cycle})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Surveillance Status Card */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="panel col-span-2 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-ink">{campus.name}</h2>
                <Badge tone="success">{isoRecord.complianceStatus}</Badge>
                {isoRecord.isHistorical && (
                  <Badge tone="warning">Preserved Record</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Audit Scope: <strong className="text-ink">{isoRecord.scope}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-ink-muted">Standard & Cycle</span>
              <p className="font-semibold text-brand-700 text-sm">
                {isoRecord.standardVersion || 'ISO 9001:2015'} · {isoRecord.cycle}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <div>
              <span className="text-xs text-ink-muted">ISO Standard</span>
              <p className="text-xs font-semibold text-ink mt-0.5">
                {isoRecord.standardVersion || 'ISO 9001:2015'}
              </p>
            </div>
            <div>
              <span className="text-xs text-ink-muted">Audit Date</span>
              <p className="text-xs font-semibold text-ink mt-0.5">{isoRecord.auditDate}</p>
            </div>
            <div>
              <span className="text-xs text-ink-muted">Lead ISO Auditor</span>
              <p className="text-xs font-semibold text-ink mt-0.5">{isoRecord.leadAuditor}</p>
            </div>
            <div>
              <span className="text-xs text-ink-muted">Validation Status</span>
              <p className="text-xs font-semibold text-success-700 mt-0.5 flex items-center gap-1">
                <CheckCircle2Icon className="h-3.5 w-3.5" /> Certified & Signed
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-line bg-canvas p-3">
            <p className="text-xs text-ink-muted">
              <strong className="text-ink">Lead Auditor Summary:</strong> {isoRecord.summary}
            </p>
          </div>
        </div>

        {/* Findings Counter */}
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Surveillance Findings Distribution
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border border-success-200 bg-success-50/50 p-2.5">
                <span className="text-success-800 font-medium">Conformances</span>
                <p className="font-bold text-success-900 text-lg mt-0.5">
                  {isoRecord.findingsCount?.conformances || 14}
                </p>
              </div>
              <div className="rounded border border-brand-200 bg-brand-50/50 p-2.5">
                <span className="text-brand-800 font-medium">OFI (Opportunities)</span>
                <p className="font-bold text-brand-900 text-lg mt-0.5">
                  {isoRecord.findingsCount?.ofi || 2}
                </p>
              </div>
              <div className="rounded border border-warning-200 bg-warning-50/50 p-2.5">
                <span className="text-warning-800 font-medium">Minor NC</span>
                <p className="font-bold text-warning-900 text-lg mt-0.5">
                  {isoRecord.findingsCount?.minorNC || 0}
                </p>
              </div>
              <div className="rounded border border-danger-200 bg-danger-50/50 p-2.5">
                <span className="text-danger-800 font-medium">Major NC (CAR)</span>
                <p className="font-bold text-danger-900 text-lg mt-0.5">
                  {isoRecord.findingsCount?.majorNC || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-3 flex items-center justify-between text-xs">
            <span className="text-ink-muted">Active Non-conformances:</span>
            <span className={`font-bold ${openCars.length > 0 ? 'text-danger-700' : 'text-success-700'}`}>
              {openCars.length === 0 ? '0 (All Closed)' : `${openCars.length} Pending Action`}
            </span>
          </div>
        </div>
      </div>

      {/* ISO Management Documents & Surveillance Labels Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-bold text-ink">ISO Management Documents & Surveillance Evidence</h3>
            </div>
            <p className="text-xs text-ink-muted">
              Quality manuals, surveillance evidence, and compliance portfolios categorized by ISO audit stages.
            </p>
          </div>

          {/* Stage Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'For Surveillance', '2nd Surveillance', 'Recertification'] as const).map((stage) => {
              const count = stage === 'All'
                ? isoDocuments.length
                : isoDocuments.filter((d) => d.isoStage === stage).length;
              const isActive = selectedStageFilter === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setSelectedStageFilter(stage)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'border border-line bg-white text-ink hover:bg-canvas'
                  }`}
                >
                  {stage} <span className={`ml-1 text-[11px] ${isActive ? 'text-brand-100' : 'text-ink-muted'}`}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Documents Table / Grid */}
        {filteredIsoDocs.length === 0 ? (
          <div className="panel p-6 text-center text-xs text-ink-muted">
            <FileTextIcon className="mx-auto h-8 w-8 text-ink-subtle mb-1" />
            No documents found for this surveillance audit stage filter.
          </div>
        ) : (
          <div className="panel divide-y divide-line overflow-hidden">
            {filteredIsoDocs.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-canvas/50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-xs text-ink hover:text-brand-700">
                      <Link to={`/documents/${doc.id}`}>{doc.title}</Link>
                    </span>
                    {doc.isoStage && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                        doc.isoStage === 'For Surveillance'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : doc.isoStage === '2nd Surveillance'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {doc.isoStage}
                      </span>
                    )}
                    <span className="rounded bg-canvas px-1.5 py-0.5 text-[11px] text-ink-muted border border-line">
                      {doc.fileType} · {doc.pages} p · {doc.sizeMb} MB
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1 line-clamp-1">{doc.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-ink-subtle">
                    <span>Office: {doc.office}</span>
                    <span>·</span>
                    <span>AY: {doc.academicYear}</span>
                    <span>·</span>
                    <span>Date: {doc.documentDate}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    to={`/documents/${doc.id}`}
                    className="btn btn-secondary btn-sm text-xs gap-1"
                  >
                    <ExternalLinkIcon className="h-3.5 w-3.5" /> View Document
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-md border border-line bg-canvas p-3 flex items-center justify-between text-xs text-ink-muted">
          <span>
            <strong className="text-ink">Historical Document Retention:</strong> In accordance with ISO QMS standard requirements, all evidence documents across current and superseded standards are permanently preserved and safeguarded against accidental deletion.
          </span>
          <span className="text-[11px] font-semibold text-brand-700">ISO 9001:2015 Clause 7.5.3 Compliant</span>
        </div>
      </div>

      {/* ISO Clauses Surveillance Checklist */}
      <div className="mb-6 space-y-3">
        <h3 className="text-sm font-bold text-ink">
          {isoRecord.standardVersion || 'ISO 9001:2015'} Clause Conformance Audit Trail
        </h3>

        <div className="panel divide-y divide-line overflow-hidden">
          {(isoRecord.clausesEvaluated || []).map((clause) => (
            <div key={clause.clauseNumber} className="p-3.5 hover:bg-canvas/50 transition-colors">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-700">{clause.clauseNumber}</span>
                    <span className="font-semibold text-ink text-xs">{clause.clauseTitle}</span>
                    <Badge
                      tone={
                        clause.status === 'Conforming'
                          ? 'success'
                          : clause.status === 'Opportunity for Improvement'
                          ? 'brand'
                          : 'warning'
                      }
                      dot
                    >
                      {clause.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">{clause.notes}</p>
                </div>

                <div className="text-right text-xs text-ink-subtle shrink-0">
                  <span>Auditor: {clause.auditor}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Corrective Action Requests (CARs) Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink">Campus Corrective Action Requests (CARs)</h3>
            <p className="text-xs text-ink-muted">
              Monitoring and verification of non-conformance corrections and systemic preventive measures.
            </p>
          </div>
        </div>

        {(isoRecord.correctiveActions || []).length === 0 ? (
          <div className="panel p-6 text-center text-xs text-ink-muted">
            <CheckCircle2Icon className="mx-auto h-8 w-8 text-success-600 mb-1" />
            No active or past Corrective Action Requests issued for this audit record. Full conformance maintained.
          </div>
        ) : (
          <div className="space-y-3">
            {(isoRecord.correctiveActions || []).map((car) => {
              const isClosed = car.status === 'Closed / Verified';
              return (
                <div
                  key={car.id}
                  className={`panel p-4 border-l-4 ${
                    isClosed ? 'border-l-success-600 bg-white' : 'border-l-warning-600 bg-warning-50/20'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink">{car.carNumber}</span>
                        <span className="text-xs text-ink-muted font-medium">({car.clauseRef})</span>
                        <Badge tone={isClosed ? 'success' : 'warning'} dot>
                          {car.status}
                        </Badge>
                      </div>

                      <h4 className="mt-1 text-sm font-semibold text-ink">{car.deficiencyDescription}</h4>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2 rounded-md bg-canvas/70 p-3 text-xs">
                        <div>
                          <strong className="text-ink">Root Cause:</strong>{' '}
                          <span className="text-ink-muted">{car.rootCause}</span>
                        </div>
                        <div>
                          <strong className="text-ink">Immediate Correction:</strong>{' '}
                          <span className="text-ink-muted">{car.correction}</span>
                        </div>
                        <div>
                          <strong className="text-ink">Systemic Corrective Action:</strong>{' '}
                          <span className="text-ink-muted">{car.correctiveAction}</span>
                        </div>
                        <div>
                          <strong className="text-ink">Target Date:</strong>{' '}
                          <span className="text-ink font-semibold">{car.targetDate}</span>
                        </div>
                      </div>

                      {isClosed && (
                        <div className="mt-2 text-xs text-success-700 font-medium flex items-center gap-1">
                          <CheckCircle2Icon className="h-3.5 w-3.5" />
                          Verified and closed on {car.verificationDate} by {car.verifiedBy}
                        </div>
                      )}
                    </div>

                    {isoRecord.isHistorical ? (
                      <span className="text-xs text-ink-muted italic flex items-center gap-1 shrink-0">
                        <ArchiveIcon className="h-3.5 w-3.5 text-amber-600" /> Preserved in historical archive
                      </span>
                    ) : !isClosed ? (
                      <button
                        type="button"
                        onClick={() => setSelectedCar(car)}
                        className="btn btn-secondary btn-sm text-xs shrink-0"
                      >
                        <UserCheckIcon className="h-3.5 w-3.5" /> Verify & Close CAR
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Surveillance Modal */}
      <ISOSurveillanceModal
        open={auditModalOpen}
        campusId={selectedCampusId}
        onClose={() => setAuditModalOpen(false)}
      />

      {/* Close CAR Modal */}
      {selectedCar && (
        <Modal
          open={!!selectedCar}
          onClose={() => setSelectedCar(null)}
          title={`Verify & Close ${selectedCar.carNumber}`}
          description={selectedCar.deficiencyDescription}
          size="md"
          footer={
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end w-full">
              <button
                type="button"
                onClick={() => setSelectedCar(null)}
                className="btn btn-secondary w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyCar}
                className="btn btn-primary w-full sm:w-auto"
              >
                Sign Off & Close
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <TextField
              label="Verification Date"
              type="date"
              value={verifyDate}
              onChange={setVerifyDate}
              required
            />

            <div>
              <label className="label">Auditor Verification Remarks</label>
              <textarea
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                className="textarea h-20 text-[13px]"
                placeholder="Confirm that corrective action was evaluated in place and effectiveness was verified..."
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Section Header Modal */}
      {headerModalOpen && (
        <Modal
          open={headerModalOpen}
          onClose={() => setHeaderModalOpen(false)}
          title="Edit ISO Section Header"
          description="Update the title and contextual description for the ISO quality surveillance page."
          size="md"
          footer={
            <div className="flex flex-col-reverse sm:flex-row w-full items-stretch sm:items-center justify-between gap-3">
              {sectionTitle !== DEFAULT_ISO_TITLE || sectionDescription !== DEFAULT_ISO_DESCRIPTION ? (
                <button
                  type="button"
                  onClick={handleResetHeader}
                  className="btn btn-ghost btn-sm text-ink-muted hover:text-ink gap-1.5 self-center sm:self-auto"
                >
                  <RotateCcwIcon className="h-3.5 w-3.5" /> Reset to Default
                </button>
              ) : <div />}
              <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setHeaderModalOpen(false)}
                  className="btn btn-secondary w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalHeader}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  Save Changes
                </button>
              </div>
            </div>
          }
        >
          <form onSubmit={handleSaveModalHeader} className="space-y-4">
            <div>
              <label className="label">Section Title</label>
              <input
                type="text"
                value={modalTitleValue}
                onChange={(e) => setModalTitleValue(e.target.value)}
                className="input"
                placeholder="e.g. ISO 9001:2015 Surveillance, Monitoring & Compliance"
                maxLength={120}
                required
              />
              <p className="mt-1 text-[11px] text-ink-muted">
                Main heading displayed at the top of the ISO quality management section.
              </p>
            </div>

            <div>
              <label className="label">Section Description</label>
              <textarea
                value={modalDescValue}
                onChange={(e) => setModalDescValue(e.target.value)}
                className="textarea h-24 text-[13px]"
                placeholder="Brief description of the quality management surveillance..."
              />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
