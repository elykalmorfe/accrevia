import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';
import { SelectField } from '../ui/SelectField';
import { RequirementVerificationStatus } from '../../types/accreditation';
import { FileTextIcon, UploadCloudIcon, CheckCircle2Icon, AlertTriangleIcon } from 'lucide-react';

interface AccreditationDocModalProps {
  open: boolean;
  title: string;
  requirementTitle: string;
  areaCode?: string;
  currentDocumentName?: string;
  currentDocumentUrl?: string;
  currentStatus: RequirementVerificationStatus;
  currentNotes?: string;
  onClose: () => void;
  onSave: (data: {
    documentName: string;
    documentUrl: string;
    status: RequirementVerificationStatus;
    reviewerNotes: string;
  }) => void;
}

export function AccreditationDocModal({
  open,
  title,
  requirementTitle,
  areaCode,
  currentDocumentName = '',
  currentDocumentUrl = '',
  currentStatus = 'Pending',
  currentNotes = '',
  onClose,
  onSave
}: AccreditationDocModalProps) {
  const [docName, setDocName] = useState(currentDocumentName);
  const [docUrl, setDocUrl] = useState(currentDocumentUrl);
  const [status, setStatus] = useState<RequirementVerificationStatus>(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [simulatedUploading, setSimulatedUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDocName(currentDocumentName);
    setDocUrl(currentDocumentUrl);
    setStatus(currentStatus);
    setNotes(currentNotes);
  }, [open, currentDocumentName, currentDocumentUrl, currentStatus, currentNotes]);

  const handleSimulateFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSimulatedUploading(true);
      setTimeout(() => {
        setDocName(file.name);
        setDocUrl(`https://drive.google.com/file/d/accrevia-${Date.now()}/view`);
        setStatus('Under Review');
        setSimulatedUploading(false);
        toast.success(`Attached "${file.name}"`);
      }, 600);
    }
  };

  const handleSave = () => {
    if (!docName.trim() && status === 'Approved') {
      toast.error('An approved requirement must have an attached document or reference link.');
      return;
    }
    onSave({
      documentName: docName.trim(),
      documentUrl: docUrl.trim(),
      status,
      reviewerNotes: notes.trim()
    });
    toast.success('Requirement evidence record updated');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={areaCode ? `${areaCode} · ${requirementTitle}` : requirementTitle}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-ink-subtle">
            {status === 'Approved' && (
              <span className="flex items-center gap-1 text-success-700">
                <CheckCircle2Icon className="h-3.5 w-3.5" /> Verification Approved
              </span>
            )}
            {status === 'Deficient' && (
              <span className="flex items-center gap-1 text-danger-700">
                <AlertTriangleIcon className="h-3.5 w-3.5" /> Flagged with Deficiencies
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn btn-primary">
              Save Requirement
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* File upload drag/drop dropzone */}
        <div className="rounded-lg border-2 border-dashed border-line-strong p-4 text-center hover:bg-canvas/50">
          <UploadCloudIcon className="mx-auto h-8 w-8 text-brand-600" />
          <p className="mt-2 text-sm font-medium text-ink">Upload certificate or evidence document</p>
          <p className="text-xs text-ink-muted">PDF, DOCX, XLSX, or scanned certificate up to 50MB</p>
          <div className="mt-3">
            <label className="btn btn-secondary btn-sm cursor-pointer">
              <span>{simulatedUploading ? 'Attaching...' : 'Choose file'}</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xlsx,.png,.jpg"
                onChange={handleSimulateFilePick}
                disabled={simulatedUploading}
              />
            </label>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Document / Certificate File Name"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="e.g. AACCUP_Certification_2023.pdf"
          />

          <TextField
            label="Document URL or Google Drive Link"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Evaluation / Verification Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as RequirementVerificationStatus)}
            options={[
              { value: 'Approved', label: 'Approved & Verified' },
              { value: 'Under Review', label: 'Under Review' },
              { value: 'Deficient', label: 'Deficient (Action Required)' },
              { value: 'Pending', label: 'Pending Submission' }
            ]}
          />

          <div className="flex flex-col justify-end">
            <p className="text-xs text-ink-muted">
              Quality Assurance personnel and Administrators can verify and sign off on submitted portfolios.
            </p>
          </div>
        </div>

        <div>
          <label className="label">Reviewer Notes & Action Items</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="textarea h-24 text-[13px]"
            placeholder="Enter verification remarks, deficiency details, or corrective instructions for this requirement..."
          />
        </div>

        {docName && (
          <div className="flex items-center gap-2 rounded-md border border-line bg-canvas p-3 text-xs text-ink">
            <FileTextIcon className="h-4 w-4 shrink-0 text-brand-600" />
            <span className="font-medium">{docName}</span>
            {docUrl && (
              <a
                href={docUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto font-medium text-brand-600 hover:underline"
              >
                Open Document
              </a>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
