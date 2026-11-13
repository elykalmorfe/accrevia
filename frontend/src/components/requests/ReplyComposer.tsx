import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2Icon, LibraryIcon, PaperclipIcon, RotateCcwIcon, SendIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { DocumentRequest, RequestAttachment, RequestStatus } from '../../types/request';
import { uploadAcceptAttribute } from '../../utils/uploadRules';
import { filesToAttachments } from '../../utils/requests';
import { AttachmentChip } from './AttachmentChip';
import { AttachDocumentsModal } from './AttachDocumentsModal';

interface ReplyComposerProps {
  request: DocumentRequest;
  asAdmin: boolean;
}

export function ReplyComposer({ request, asAdmin }: ReplyComposerProps) {
  const { replyToDocumentRequest, setDocumentRequestStatus } = usePortal();
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  if (request.status === 'Closed') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas/60 px-4 py-3 sm:px-6">
        <p className="text-xs text-ink-muted">This request is closed. Reopen it to continue the conversation.</p>
        <button type="button" onClick={() => setDocumentRequestStatus(request.id, 'Open')} className="btn btn-secondary btn-sm text-xs">
          <RotateCcwIcon className="h-3.5 w-3.5" /> Reopen
        </button>
      </div>
    );
  }

  const canSend = body.trim().length > 0 || attachments.length > 0;
  const recipient = asAdmin ? request.requesterName : 'QA Office';

  const send = (nextStatus?: RequestStatus) => {
    if (!canSend) return;
    const text = body.trim() || (attachments.length > 0 ? 'Please see the attached files.' : '');
    replyToDocumentRequest(request.id, text, attachments, nextStatus);
    setBody('');
    setAttachments([]);
    toast.success(nextStatus === 'Fulfilled' ? 'Reply sent and request marked fulfilled' : 'Reply sent', {
      description: `To ${recipient}`
    });
  };

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const added = filesToAttachments(Array.from(files));
    setAttachments((prev) => [...prev, ...added]);
  };

  return (
    <div className="border-t border-line bg-white p-3 sm:px-6 sm:py-4">
      <div className="rounded-xl border border-line bg-white shadow-sm transition-colors focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100">
        <p className="border-b border-line-subtle px-3.5 py-2 text-[11px] text-ink-subtle">
          Reply to <span className="font-semibold text-ink-muted">{recipient}</span>
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              send();
            }
          }}
          rows={3}
          placeholder={asAdmin ? 'Write a reply and attach the requested files...' : 'Write a reply...'}
          className="block w-full resize-none border-0 bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-0"
        />

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3.5 pb-2.5">
            {attachments.map((a) => (
              <AttachmentChip key={a.id} attachment={a} onRemove={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))} />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-subtle px-2 py-2">
          <div className="flex items-center gap-1">
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={uploadAcceptAttribute()}
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="btn btn-ghost btn-sm gap-1.5 text-xs"
              title="Attach files from your computer"
            >
              <PaperclipIcon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Attach files</span>
            </button>
            {asAdmin && (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="btn btn-ghost btn-sm gap-1.5 text-xs"
                title="Attach documents from the repository"
              >
                <LibraryIcon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">From repository</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] text-ink-subtle lg:inline">Ctrl + Enter to send</span>
            {asAdmin && request.status !== 'Fulfilled' && (
              <button
                type="button"
                onClick={() => send('Fulfilled')}
                disabled={!canSend}
                className="btn btn-secondary btn-sm text-xs disabled:opacity-50"
              >
                <CheckCircle2Icon className="h-3.5 w-3.5 text-brand-600" /> Send &amp; mark fulfilled
              </button>
            )}
            <button type="button" onClick={() => send()} disabled={!canSend} className="btn btn-primary btn-sm text-xs disabled:opacity-50">
              <SendIcon className="h-3.5 w-3.5" /> Send
            </button>
          </div>
        </div>
      </div>

      <AttachDocumentsModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={attachments.filter((a) => a.documentId).map((a) => a.documentId as string)}
        onAttach={(added) => setAttachments((prev) => [...prev, ...added])}
      />
    </div>
  );
}
