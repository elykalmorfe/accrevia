import { useEffect, useRef } from 'react';
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  ClockIcon,
  MailIcon,
  RotateCcwIcon,
  StarIcon,
  XCircleIcon
} from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { DocumentRequest, RequestMessage, RequestStatus } from '../../types/request';
import { UserRole } from '../../types/user';
import { formatDateTime, initials } from '../../utils/format';
import { requestStatusTone } from '../../utils/requests';
import { isAdminRole } from '../../utils/sharing';
import { Badge } from '../ui/Badge';
import { RowAction, RowActionsMenu } from '../ui/RowActionsMenu';
import { AttachmentChip } from './AttachmentChip';
import { ReplyComposer } from './ReplyComposer';

interface RequestThreadProps {
  request: DocumentRequest;
  asAdmin: boolean;
  onBack: () => void;
}

function MessageCard({ message, request }: { message: RequestMessage; request: DocumentRequest }) {
  const fromStaff = isAdminRole(message.authorRole as UserRole);
  const to = fromStaff ? request.requesterName : 'QA Office';

  return (
    <article className="rounded-xl border border-line bg-surface shadow-2xs">
      <header className="flex items-start gap-3 px-4 py-3 sm:px-5">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${
            fromStaff ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'
          }`}
          aria-hidden="true"
        >
          {initials(message.authorName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">
            {message.authorName}
            <span className="ml-1.5 font-normal text-ink-subtle">· {fromStaff ? 'QA Office' : message.authorRole}</span>
          </p>
          <p className="truncate text-xs text-ink-subtle">to {to}</p>
        </div>
        <time className="shrink-0 text-[11px] text-ink-subtle" dateTime={message.sentAt}>
          {formatDateTime(message.sentAt)}
        </time>
      </header>
      <div className="whitespace-pre-line px-4 pb-4 text-[13px] leading-relaxed text-ink sm:px-5 sm:pl-[68px]">{message.body}</div>
      {message.attachments.length > 0 && (
        <div className="border-t border-line-subtle px-4 py-3 sm:px-5 sm:pl-[68px]">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            {message.attachments.length} attachment{message.attachments.length === 1 ? '' : 's'}
          </p>
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((a) => (
              <AttachmentChip key={a.id} attachment={a} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export function RequestThread({ request, asAdmin, onBack }: RequestThreadProps) {
  const { setDocumentRequestStatus, toggleDocumentRequestStar } = usePortal();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [request.id, request.messages.length]);

  const statusAction = (status: RequestStatus, label: string, icon: RowAction['icon'], tone?: 'danger'): RowAction => ({
    label,
    icon,
    tone,
    onSelect: () => setDocumentRequestStatus(request.id, status)
  });

  const actions: RowAction[] = asAdmin
    ? [
        request.status !== 'Open' ? statusAction('Open', 'Mark as open', CircleDotIcon) : null,
        request.status !== 'In Progress' ? statusAction('In Progress', 'Mark in progress', ClockIcon) : null,
        request.status !== 'Fulfilled' ? statusAction('Fulfilled', 'Mark fulfilled', CheckCircle2Icon) : null,
        request.status !== 'Closed' ? statusAction('Closed', 'Close request', XCircleIcon, 'danger') : null
      ].filter((a): a is RowAction => a !== null)
    : request.status === 'Closed' || request.status === 'Fulfilled'
    ? [statusAction('Open', 'Reopen request', RotateCcwIcon)]
    : [statusAction('Closed', 'Close request', XCircleIcon, 'danger')];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start gap-3 border-b border-line px-4 py-3.5 sm:px-6">
        <button type="button" onClick={onBack} className="btn btn-ghost btn-icon -ml-2 md:hidden" aria-label="Back to requests">
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold leading-snug text-ink sm:text-lg">{request.subject}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={requestStatusTone[request.status]} dot>
              {request.status}
            </Badge>
            <Badge>{request.category}</Badge>
            {request.priority === 'Urgent' && <Badge tone="danger">Urgent</Badge>}
            {request.reference && <span className="text-xs text-ink-muted">· {request.reference}</span>}
          </div>
          {asAdmin && (
            <p className="mt-2 flex items-center gap-1.5 truncate text-xs text-ink-muted">
              <MailIcon className="h-3.5 w-3.5 shrink-0 text-ink-subtle" />
              <span className="font-medium text-ink">{request.requesterName}</span>
              {request.requesterEmail && <span className="truncate">&lt;{request.requesterEmail}&gt;</span>}
              {request.requesterOffice && <span className="hidden truncate sm:inline">· {request.requesterOffice}</span>}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => toggleDocumentRequestStar(request.id)}
            className="btn btn-ghost btn-icon"
            aria-pressed={!!request.starred}
            aria-label={request.starred ? 'Unstar request' : 'Star request'}
          >
            <StarIcon className={`h-4 w-4 ${request.starred ? 'fill-brand-400 text-brand-500' : ''}`} />
          </button>
          <RowActionsMenu actions={actions} label="Request actions" />
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-canvas/50 px-3 py-4 sm:px-6">
        {request.messages.map((m) => (
          <MessageCard key={m.id} message={m} request={request} />
        ))}
      </div>

      <ReplyComposer key={request.id} request={request} asAdmin={asAdmin} />
    </div>
  );
}
