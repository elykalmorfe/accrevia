import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { DownloadIcon, ExternalLinkIcon, FileImageIcon, FileSpreadsheetIcon, FileTextIcon, XIcon } from 'lucide-react';
import { RequestAttachment } from '../../types/request';
import { downloadStoredFile } from '../../utils/fileStore';

function iconFor(fileType: string) {
  if (fileType === 'XLSX') return FileSpreadsheetIcon;
  if (fileType === 'JPG' || fileType === 'PNG' || fileType === 'TIFF') return FileImageIcon;
  return FileTextIcon;
}

interface AttachmentChipProps {
  attachment: RequestAttachment;
  /** Shown in the composer instead of the download/open action. */
  onRemove?: () => void;
}

export function AttachmentChip({ attachment, onRemove }: AttachmentChipProps) {
  const Icon = iconFor(attachment.fileType);
  const isDocument = attachment.kind === 'document';

  const download = async () => {
    const ok = await downloadStoredFile(attachment.id, attachment.name);
    if (!ok) toast.error('File not available', { description: 'This attachment is no longer stored in this browser.' });
  };

  return (
    <div className="group flex min-w-0 max-w-full items-center gap-2.5 rounded-lg border border-line bg-white py-1.5 pl-2 pr-1.5 sm:max-w-[260px]">
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
        <p className="text-[11px] text-ink-subtle">
          {attachment.fileType}
          {attachment.sizeMb ? ` · ${attachment.sizeMb} MB` : ''}
          {isDocument ? ' · Repository' : ''}
        </p>
      </div>
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
        <Link
          to={`/documents/${attachment.documentId}`}
          aria-label={`Open ${attachment.name}`}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-subtle hover:bg-brand-50 hover:text-brand-700"
        >
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={download}
          aria-label={`Download ${attachment.name}`}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-subtle hover:bg-brand-50 hover:text-brand-700"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
