import { useEffect, useMemo, useState } from 'react';
import { PrinterIcon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { usePortal } from '../../../contexts/PortalContext';
import { loadSignatories, saveSignatories } from '../../../data/reportTemplates';
import { formatPrintTimestamp, printReactDocument } from '../../../utils/print';
import { Modal } from '../../ui/Modal';
import { COPCSummaryDocument } from './COPCSummaryDocument';
import { CopiesField, ReportPreview, SignatoryFields } from './PrintControls';

interface COPCSummaryPrintModalProps {
  open: boolean;
  onClose: () => void;
  defaultCampus: string;
}

export function COPCSummaryPrintModal({ open, onClose, defaultCampus }: COPCSummaryPrintModalProps) {
  const { campuses, copcRecords } = usePortal();
  const [campus, setCampus] = useState(defaultCampus);
  const [copies, setCopies] = useState(1);
  const [signatories, setSignatories] = useState(loadSignatories);
  const [generatedAt, setGeneratedAt] = useState(() => new Date());
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCampus(defaultCampus);
    setSignatories(loadSignatories());
  }, [open, defaultCampus]);

  const records = useMemo(
    () => campus === 'all' ? copcRecords : copcRecords.filter((record) => record.campusId === campus),
    [campus, copcRecords]
  );
  const scopeLabel = campus === 'all' ? `All Campuses (${campuses.length})` : campuses.find((item) => item.id === campus)?.name ?? campus;

  useEffect(() => {
    if (open) setGeneratedAt(new Date());
  }, [open, campus, records]);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      saveSignatories(signatories);
      await printReactDocument({
        title: `COPC Summary Report – ${scopeLabel}`,
        copies,
        render: (printedAt) => (
          <COPCSummaryDocument records={records} scopeLabel={scopeLabel} generatedAt={generatedAt} signatories={signatories} printedAt={printedAt} />
        )
      });
    } catch {
      toast.error('Unable to open the COPC summary print dialog.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="COPC Summary Report"
      description="Generated from the current COPC records. The date and time are added to the printed report."
      size="xl"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-1.5 text-[11px] text-ink-subtle">
            <RefreshCwIcon className="h-3 w-3" aria-hidden="true" /> Data as of {formatPrintTimestamp(generatedAt)}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <CopiesField value={copies} onChange={setCopies} />
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
            <button type="button" onClick={handlePrint} disabled={printing || records.length === 0} className="btn btn-primary btn-sm">
              <PrinterIcon className="h-4 w-4" aria-hidden="true" />
              {printing ? 'Opening print preview…' : 'Print Report'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block sm:max-w-56">
          <span className="label">Campus</span>
          <select value={campus} onChange={(event) => setCampus(event.target.value)} className="input select select-sm h-9 text-xs">
            <option value="all">All Campuses</option>
            {campuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <details className="rounded-lg border border-line px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-ink">Signatories (Prepared by / Checked by)</summary>
          <div className="pt-3">
            <SignatoryFields value={signatories} onChange={setSignatories} />
          </div>
        </details>
        <ReportPreview>
          <COPCSummaryDocument records={records} scopeLabel={scopeLabel} generatedAt={generatedAt} signatories={signatories} />
        </ReportPreview>
      </div>
    </Modal>
  );
}
