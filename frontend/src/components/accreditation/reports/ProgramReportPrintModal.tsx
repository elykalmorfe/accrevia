import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PrinterIcon, RefreshCwIcon } from 'lucide-react';
import { usePortal } from '../../../contexts/PortalContext';
import { Modal } from '../../ui/Modal';
import { loadSignatories, ReportSignatories, saveSignatories } from '../../../data/reportTemplates';
import { formatPrintTimestamp, printReactDocument } from '../../../utils/print';
import { reportYearOptions } from '../../../utils/programAccreditation';
import { CopiesField, ReportPreview, SignatoryFields } from './PrintControls';
import { DocumentChrome, LevelTrackingReportDocument, SummaryReportDocument } from './ProgramReportDocuments';

export type ProgramReportType = 'summary' | 'level';

interface ProgramReportPrintModalProps {
  open: boolean;
  onClose: () => void;
  initialType: ProgramReportType;
  defaultCampus: string;
  defaultTargetYear?: number;
  defaultFromYear?: number;
}

const REPORT_TITLES: Record<ProgramReportType, string> = {
  summary: 'Program Accreditation Summary Report',
  level: 'Higher Level Accreditation Tracking Report'
};

export function ProgramReportPrintModal({
  open,
  onClose,
  initialType,
  defaultCampus,
  defaultTargetYear,
  defaultFromYear
}: ProgramReportPrintModalProps) {
  const { campuses, programAccreditations } = usePortal();
  const currentYear = new Date().getFullYear();

  const [type, setType] = useState<ProgramReportType>(initialType);
  const [campus, setCampus] = useState(defaultCampus);
  const [fromYear, setFromYear] = useState(currentYear - 1);
  const [toYear, setToYear] = useState(currentYear);
  const [targetYear, setTargetYear] = useState(Math.max(2027, currentYear));
  const [copies, setCopies] = useState(1);
  const [signatories, setSignatories] = useState<ReportSignatories>(loadSignatories);
  const [generatedAt, setGeneratedAt] = useState(() => new Date());
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(initialType);
    setCampus(defaultCampus);
    setFromYear(defaultFromYear ?? currentYear - 1);
    setToYear(currentYear);
    setTargetYear(defaultTargetYear ?? Math.max(2027, currentYear));
    setSignatories(loadSignatories());
    setGeneratedAt(new Date());
  }, [open, initialType, defaultCampus, defaultTargetYear, defaultFromYear, currentYear]);

  useEffect(() => {
    if (open) setGeneratedAt(new Date());
  }, [open, programAccreditations]);

  const programs = useMemo(
    () => (campus === 'all' ? programAccreditations : programAccreditations.filter((p) => p.campusId === campus)),
    [campus, programAccreditations]
  );
  const scopeLabel = campus === 'all' ? `All Campuses (${campuses.length})` : campuses.find((c) => c.id === campus)?.name ?? campus;
  const yearOptions = useMemo(() => reportYearOptions(programAccreditations), [programAccreditations]);

  const renderDocument = (chrome: DocumentChrome, now: Date) =>
    type === 'summary' ? (
      <SummaryReportDocument
        programs={programs}
        scopeLabel={scopeLabel}
        fromYear={fromYear}
        toYear={toYear}
        targetYear={targetYear}
        now={now}
        chrome={chrome}
      />
    ) : (
      <LevelTrackingReportDocument
        programs={programs}
        scopeLabel={scopeLabel}
        fromYear={fromYear}
        targetYear={targetYear}
        now={now}
        chrome={chrome}
      />
    );

  const handlePrint = async () => {
    setPrinting(true);
    saveSignatories(signatories);
    try {
      const reportGeneratedAt = new Date();
      setGeneratedAt(reportGeneratedAt);
      const result = await printReactDocument({
        title: `${REPORT_TITLES[type]} – ${scopeLabel}`,
        copies,
        landscape: true,
        render: (printedAt, copyIndex, copyCount) =>
          renderDocument({ generatedAt: reportGeneratedAt, printedAt, signatories, copyIndex, copyCount }, printedAt)
      });
      toast.success(`${REPORT_TITLES[type]} sent to printer`, {
        description: `${result.copies} cop${result.copies === 1 ? 'y' : 'ies'} · ${formatPrintTimestamp(result.printedAt)}`
      });
    } catch {
      toast.error('Unable to open the print dialog. Please allow pop-ups and try again.');
    } finally {
      setPrinting(false);
    }
  };

  const yearSelect = (label: string, value: number, onChange: (y: number) => void, min?: number) => (
    <label className="block">
      <span className="label">{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="input h-9 text-xs py-0">
        {yearOptions
          .filter((y) => min === undefined || y >= min)
          .map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
      </select>
    </label>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={REPORT_TITLES[type]}
      description="Generated from the latest accreditation records. The exact date and time are stamped on the document when it is printed."
      size="xl"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-1.5 text-[11px] text-ink-subtle">
            <RefreshCwIcon className="h-3 w-3" /> Data as of {formatPrintTimestamp(generatedAt)}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <CopiesField value={copies} onChange={setCopies} />
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="button" onClick={handlePrint} disabled={printing} className="btn btn-primary btn-sm">
              <PrinterIcon className="h-4 w-4" />
              {printing ? 'Printing…' : `Print ${copies > 1 ? `${copies} Copies` : 'Report'}`}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block lg:col-span-1">
            <span className="label">Report</span>
            <select value={type} onChange={(e) => setType(e.target.value as ProgramReportType)} className="input h-9 text-xs py-0">
              <option value="summary">Summary Report</option>
              <option value="level">Level Tracking Report</option>
            </select>
          </label>
          <label className="block lg:col-span-1">
            <span className="label">Campus</span>
            <select value={campus} onChange={(e) => setCampus(e.target.value)} className="input h-9 text-xs py-0">
              <option value="all">All Campuses</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {yearSelect(type === 'summary' ? 'Compare from' : 'Baseline year', fromYear, (y) => {
            setFromYear(y);
            if (toYear < y) setToYear(y);
            if (targetYear < y) setTargetYear(y);
          })}
          {type === 'summary' && yearSelect('Compare to', toYear, setToYear, fromYear)}
          {yearSelect('Target year', targetYear, setTargetYear, fromYear)}
        </div>

        <details className="rounded-lg border border-line px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-ink">Signatories (Prepared by / Checked by)</summary>
          <div className="pt-3">
            <SignatoryFields value={signatories} onChange={setSignatories} />
          </div>
        </details>

        <ReportPreview>{renderDocument({ generatedAt, printedAt: null, signatories }, generatedAt)}</ReportPreview>
      </div>
    </Modal>
  );
}
