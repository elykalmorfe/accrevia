import type { ReactNode } from 'react';
import { ExternalLinkIcon } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import type { CopcRecordRow } from '../../../types/accreditationRepository';
import { SAMPLE_COPC_SPREADSHEET_URL } from '../../../services/repository/mockRepositoryData';

type CopcRecordDetailsModalProps = {
  record: CopcRecordRow | null;
  onClose: () => void;
  sourceReferenceUrl?: string;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="mt-1 text-[13px] font-medium text-ink break-words">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[12px] font-bold uppercase tracking-wide text-ink-subtle">{title}</h3>
      <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export function CopcRecordDetailsModal({
  record,
  onClose,
  sourceReferenceUrl = SAMPLE_COPC_SPREADSHEET_URL
}: CopcRecordDetailsModalProps) {
  const isDemo = Boolean(record?.isSample || record?.provenance === 'demonstration');
  const isVerified = Boolean(record?.provenance === 'verified' || record?.isSample === false);
  const hasProgramInfo = Boolean(record?.campus || record?.college || record?.program || record?.academicYear);
  const hasSheetEntry = Boolean(
    record?.certificateNumber || record?.sampleNote || record?.sheetLabel || record?.complianceNote
  );
  const hasSourceInfo = Boolean(
    record?.worksheet || record?.id || record?.dataSource || record?.verificationNote || record?.sourceRow
  );

  return (
    <Modal
      open={!!record}
      onClose={onClose}
      title={record?.program ?? 'COPC record'}
      description={isVerified ? 'Verified source record — static worksheet snapshot' : 'Demonstration record details'}
      size="md"
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      }
    >
      {record ? (
        <div className="space-y-5">
          {isDemo ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] font-medium text-amber-950">
              <strong>Demonstration record.</strong> Invented layout values for interface testing only.
            </p>
          ) : null}
          {isVerified ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[12px] font-medium text-emerald-950">
              <strong>Verified source record.</strong> Values come from the institutional COPC spreadsheet export as a
              static snapshot. Spreadsheet notes are shown as written and are not interpreted as official compliance
              decisions.
            </p>
          ) : null}
          {record.isOngoingCompliance ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] font-medium text-amber-950">
              This row includes an <strong>ongoing compliance</strong> note from the sheet and must not be presented as
              an approved certificate.
            </p>
          ) : null}

          {hasProgramInfo ? (
            <Section title="Program information">
              <Field label="Campus" value={record.campus} />
              <Field label="College / graduate section" value={record.college} />
              <Field label="Academic program" value={record.program} />
              <Field label="Academic year / worksheet year" value={record.academicYear} />
            </Section>
          ) : null}

          {hasSheetEntry ? (
            <Section title="Original COPC spreadsheet entry">
              <Field label="COPC column value" value={record.sheetLabel} />
              <Field label="Preserved note" value={record.complianceNote} />
              <Field label="Demonstration certificate number" value={record.certificateNumber} />
              <Field label="Demonstration layout note" value={record.sampleNote} />
            </Section>
          ) : null}

          {hasSourceInfo ? (
            <Section title="Worksheet / source row">
              <Field label="Worksheet" value={record.worksheet} />
              <Field
                label="Source row (section sequence)"
                value={typeof record.sourceRow === 'number' ? String(record.sourceRow) : undefined}
              />
              <Field label="Data source" value={record.dataSource} />
              <Field label="Provenance" value={record.provenance} />
              <Field label="Record id" value={record.id} />
              <Field label="Verification note" value={record.verificationNote} />
              {isDemo ? <Field label="Data type" value="DEMONSTRATION RECORD" /> : null}
              {isVerified ? <Field label="Data type" value="VERIFIED SOURCE RECORD" /> : null}
            </Section>
          ) : null}

          <div className="rounded-xl border border-line bg-canvas px-3.5 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-subtle">Source reference</p>
            <p className="mt-1 text-[12px] font-medium text-ink-muted">
              Google Sheets reference for provenance. The Faculty UI uses a static export snapshot and is not
              live-synchronized.
            </p>
            <a
              href={sourceReferenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:underline"
            >
              Open COPC spreadsheet reference
              <ExternalLinkIcon className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
