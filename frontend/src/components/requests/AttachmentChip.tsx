import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { DownloadIcon, ExternalLinkIcon, FileImageIcon, FileSpreadsheetIcon, FileTextIcon, XIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { AttachmentAccess, AttachmentRole, RequestAttachment } from '../../types/request';
import { seesOfficeQueue } from '../../utils/sharing';
import { accessSummary } from '../../utils/attachmentAccess';
import { downloadStoredFile } from '../../utils/fileStore';
import { ShareMenu } from './ShareMenu';

function iconFor(fileType: string) {
  if (fileType === 'XLSX') return FileSpreadsheetIcon;
  if (fileType === 'JPG' || fileType === 'PNG' || fileType === 'TIFF') return FileImageIcon;
  return FileTextIcon;
}

interface AttachmentChipProps {
  attachment: RequestAttachment;
  /** Shown in the composer instead of the download/open action. */
  onRemove?: () => void;
  /** Composer menu for this file's access. */
  share?: {
    requesterName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onChange: (next: { access: AttachmentAccess; role: AttachmentRole }) => void;
  };
}

export function AttachmentChip({ attachment, onRemove, share }: AttachmentChipProps) {
  const { currentUser } = usePortal();
  const Icon = iconFor(attachment.fileType);
  const isDocument = attachment.kind === 'document';
  const office = seesOfficeQueue(currentUser.role);
  const canTakeFile = !attachment.role || attachment.role === 'editor' || office;
  const shareLabel = attachment.access && attachment.role ? accessSummary(attachment.access, attachment.role) : '';

  const download = async () => {
    const ok = await downloadStoredFile(attachment.documentId || attachment.id, attachment.name);
    if (!ok) toast.error('File not available', { description: 'This attachment is no longer stored in this browser.' });
  };

  return (
    <div
      className={`group relative flex min-w-0 items-center gap-2 rounded-lg border border-line bg-white py-1.5 pl-2 pr-1 ${
        onRemove ? 'max-w-full sm:max-w-[320px]' : 'w-full max-w-xl'
      }`}
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
          isDocument ? 'bg-brand-50 text-brand-600' : 'bg-brand-50 text-brand-600'
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-ink" title={attachment.name}>
          {attachment.name}
        </p>
        <p className="truncate text-[11px] text-ink-subtle">
          {attachment.fileType}
          {attachment.sizeMb ? ` · ${attachment.sizeMb} MB` : ''}
          {isDocument ? ' · Repository' : ''}
        </p>
        {shareLabel && <p className="truncate text-[11px] font-semibold text-brand-800">{shareLabel}</p>}
      </div>
      {share && (
        <ShareMenu
          title={attachment.name}
          label={`Access for ${attachment.name}`}
          access={attachment.access ?? 'restricted'}
          role={attachment.role ?? 'viewer'}
          requesterName={share.requesterName}
          open={share.open}
          onOpenChange={share.onOpenChange}
          onChange={share.onChange}
        />
      )}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${attachment.name}`}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-subtle hover:bg-canvas hover:text-ink"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      ) : isDocument && attachment.documentId ? (
        <span className="flex shrink-0 items-center">
          <Link
            to={office ? `/documents/${attachment.documentId}` : `/open/documents/${attachment.documentId}`}
            aria-label={`Open ${attachment.name}`}
            className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-brand-50 hover:text-brand-700"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </Link>
          {canTakeFile && (
            <button
              type="button"
              onClick={download}
              aria-label={`Download ${attachment.name}`}
              className="grid h-7 w-7 place-items-center rounded-md text-ink-subtle hover:bg-brand-50 hover:text-brand-700"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </span>
      ) : canTakeFile ? (
        <button
          type="button"
          onClick={download}
          aria-label={`Download ${attachment.name}`}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-subtle hover:bg-brand-50 hover:text-brand-700"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
