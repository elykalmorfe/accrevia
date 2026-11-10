import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PaperclipIcon, SendIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { RequestAttachment, RequestCategory, RequestPriority, requestCategories } from '../../types/request';
import { uploadAcceptAttribute } from '../../utils/uploadRules';
import { filesToAttachments } from '../../utils/requests';
import { Modal } from '../ui/Modal';
import { SelectField } from '../ui/SelectField';
import { TextField } from '../ui/TextField';
import { AttachmentChip } from './AttachmentChip';

interface ComposeRequestModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
  defaultCategory?: RequestCategory;
}

export function ComposeRequestModal({ open, onClose, onCreated, defaultCategory = 'Accreditation Instrument' }: ComposeRequestModalProps) {
  const { createDocumentRequest } = usePortal();
  const [category, setCategory] = useState<RequestCategory>(defaultCategory);
  const [priority, setPriority] = useState<RequestPriority>('Normal');
  const [subject, setSubject] = useState('');
  const [reference, setReference] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
      setPriority('Normal');
      setSubject('');
      setReference('');
      setBody('');
      setAttachments([]);
    }
  }, [open, defaultCategory]);

  const canSend = subject.trim().length > 0 && body.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    const id = createDocumentRequest({
      subject: subject.trim(),
      category,
      priority,
      reference: reference.trim(),
      body: body.trim(),
      attachments
    });
    toast.success('Request sent to the QA Office', { description: 'You will be notified when they reply.' });
    onClose();
    onCreated?.(id);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New request"
      description="Ask the QA Office for an accreditation instrument, template or any document you need."
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={send} disabled={!canSend} className="btn btn-primary disabled:opacity-50">
            <SendIcon className="h-4 w-4" /> Send request
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-ink-muted">
          <span className="font-semibold text-ink">To:</span> QA Office (Administrators &amp; QA Personnel)
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Request type"
            value={category}
            onChange={(v) => setCategory(v as RequestCategory)}
            options={requestCategories}
            required
          />
          <SelectField
            label="Priority"
            value={priority}
            onChange={(v) => setPriority(v as RequestPriority)}
            options={['Normal', 'Urgent']}
          />
        </div>

        <TextField
          label="Subject"
          value={subject}
          onChange={setSubject}
          placeholder="e.g. AACCUP instrument for BS Information Technology"
          required
        />

        <TextField
          label="Program, area or campus"
          value={reference}
          onChange={setReference}
          placeholder="Optional — e.g. BSIT · Area V · Tandag Campus"
        />

        <div>
          <label htmlFor="compose-request-body" className="label">
            Message<span className="ml-0.5 text-danger-600">*</span>
          </label>
          <textarea
            id="compose-request-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="Describe what you need and why, including any deadline."
            className="textarea"
          />
        </div>

        <div>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={uploadAcceptAttribute()}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                const added = filesToAttachments(Array.from(e.target.files));
                setAttachments((prev) => [...prev, ...added]);
              }
              e.target.value = '';
            }}
          />
          <button type="button" onClick={() => fileInput.current?.click()} className="btn btn-ghost btn-sm gap-1.5 text-xs">
            <PaperclipIcon className="h-3.5 w-3.5" /> Attach a reference file
          </button>
          {attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {attachments.map((a) => (
                <AttachmentChip key={a.id} attachment={a} onRemove={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
