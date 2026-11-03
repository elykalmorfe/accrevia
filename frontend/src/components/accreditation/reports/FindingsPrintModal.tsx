import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ExternalLinkIcon, PrinterIcon, SaveIcon } from 'lucide-react';
import { usePortal } from '../../../contexts/PortalContext';
import { Modal } from '../../ui/Modal';
import { loadSignatories, ReportSignatories, saveSignatories } from '../../../data/reportTemplates';
import { formatPrintTimestamp, printReactDocument } from '../../../utils/print';
import { CopiesField, ReportPreview, SignatoryFields } from './PrintControls';
import { FindingsDocument } from './ProgramReportDocuments';

interface FindingsPrintModalProps {
  open: boolean;
  programId: string | null;
  onClose: () => void;
}

export function FindingsPrintModal({ open, programId, onClose }: FindingsPrintModalProps) {
  const { programAccreditations, saveProgramAccreditation } = usePortal();
  const program = useMemo(() => programAccreditations.find((p) => p.id === programId) ?? null, [programAccreditations, programId]);

  const [findingsSummary, setFindingsSummary] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [copies, setCopies] = useState(1);
  const [signatories, setSignatories] = useState<ReportSignatories>(loadSignatories);
  const [generatedAt, setGeneratedAt] = useState(() => new Date());
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!open || !program) return;
    setFindingsSummary(program.findingsSummary || '');
    setRecommendations(program.recommendations || '');
    setCopies(1);
    setSignatories(loadSignatories());
    setGeneratedAt(new Date());
    // Only reset the draft when a different program is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, programId]);

  if (!program) return null;

  const dirty = findingsSummary !== (program.findingsSummary || '') || recommendations !== (program.recommendations || '');
  const draft = { ...program, findingsSummary: findingsSummary.trim() || undefined, recommendations: recommendations.trim() || undefined };

  const save = () => {
    saveProgramAccreditation(draft);
    setGeneratedAt(new Date());
  };

  const handleSave = () => {
    save();
    toast.success('Summary of Findings & Recommendation saved');
  };

  const handlePrint = async () => {
    setPrinting(true);
    saveSignatories(signatories);
    if (dirty) save();
    try {
      const docGeneratedAt = new Date();
      const result = await printReactDocument({
        title: `Summary of Findings and Recommendations – ${program.programName}`,
        copies,
        render: (printedAt, copyIndex, copyCount) => (
          <FindingsDocument program={draft} chrome={{ generatedAt: docGeneratedAt, printedAt, signatories, copyIndex, copyCount }} />
        )
      });
      toast.success('Summary of Findings & Recommendation sent to printer', {
        description: `${result.copies} cop${result.copies === 1 ? 'y' : 'ies'} · ${formatPrintTimestamp(result.printedAt)}`
      });
    } catch {
      toast.error('Unable to open the print dialog. Please allow pop-ups and try again.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Summary of Findings & Recommendation"
      description={`${program.programName} · ${program.campusName}`}
      size="xl"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[11px] text-ink-subtle">
            {dirty ? 'Unsaved changes – they are saved automatically when you print.' : 'Date and time are stamped when printed.'}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <CopiesField value={copies} onChange={setCopies} />
            <button type="button" onClick={handleSave} disabled={!dirty} className="btn btn-secondary btn-sm">
              <SaveIcon className="h-4 w-4" /> Save
            </button>
            <button type="button" onClick={handlePrint} disabled={printing} className="btn btn-primary btn-sm">
              <PrinterIcon className="h-4 w-4" />
              {printing ? 'Printing…' : 'Print'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {program.findingsLink && (
          <a
            href={program.findingsLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" /> Open uploaded Summary of Findings file
          </a>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="label">Summary of Findings</span>
            <textarea
              value={findingsSummary}
              onChange={(e) => setFindingsSummary(e.target.value)}
              className="textarea h-36 text-[13px]"
              placeholder="Key findings from the AACCUP survey visit, per area…"
            />
          </label>
          <label className="block">
            <span className="label">Recommendations</span>
            <textarea
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="textarea h-36 text-[13px]"
              placeholder="Recommendations of the accreditors for program improvement…"
            />
          </label>
        </div>

        <details className="rounded-lg border border-line px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold text-ink">Signatories (Prepared by / Checked by)</summary>
          <div className="pt-3">
            <SignatoryFields value={signatories} onChange={setSignatories} />
          </div>
        </details>

        <ReportPreview>
          <FindingsDocument program={draft} chrome={{ generatedAt, printedAt: null, signatories }} />
        </ReportPreview>
      </div>
    </Modal>
  );
}
