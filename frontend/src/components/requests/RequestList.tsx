import {
  ArchiveIcon,
  CheckCircle2Icon,
  ClockIcon,
  InboxIcon,
  LucideIcon,
  MailOpenIcon,
  PaperclipIcon,
  PenSquareIcon,
  SearchIcon,
  StarIcon
} from 'lucide-react';
import { DocumentRequest, RequestCategory, requestCategories } from '../../types/request';
import { initials } from '../../utils/format';
import { hasAttachments, inboxTime, isUnreadFor, lastMessage, requestStatusTone } from '../../utils/requests';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

export type RequestFolderId = 'inbox' | 'unread' | 'starred' | 'fulfilled' | 'closed' | 'all';

export interface RequestFolder {
  id: RequestFolderId;
  label: string;
  icon: LucideIcon;
}

export const adminFolders: RequestFolder[] = [
  { id: 'inbox', label: 'Inbox', icon: InboxIcon },
  { id: 'unread', label: 'Unread', icon: MailOpenIcon },
  { id: 'starred', label: 'Starred', icon: StarIcon },
  { id: 'fulfilled', label: 'Fulfilled', icon: CheckCircle2Icon },
  { id: 'closed', label: 'Closed', icon: ArchiveIcon }
];

export const userFolders: RequestFolder[] = [
  { id: 'all', label: 'My Requests', icon: InboxIcon },
  { id: 'inbox', label: 'Awaiting reply', icon: ClockIcon },
  { id: 'fulfilled', label: 'Fulfilled', icon: CheckCircle2Icon },
  { id: 'closed', label: 'Closed', icon: ArchiveIcon }
];

export function inFolder(request: DocumentRequest, folder: RequestFolderId, asAdmin: boolean): boolean {
  switch (folder) {
    case 'inbox':
      return request.status === 'Open' || request.status === 'In Progress';
    case 'unread':
      return isUnreadFor(request, asAdmin);
    case 'starred':
      return !!request.starred;
    case 'fulfilled':
      return request.status === 'Fulfilled';
    case 'closed':
      return request.status === 'Closed';
    default:
      return true;
  }
}

interface RequestListProps {
  asAdmin: boolean;
  folders: RequestFolder[];
  folder: RequestFolderId;
  onFolderChange: (folder: RequestFolderId) => void;
  counts: Record<string, number>;
  requests: DocumentRequest[];
  selectedId?: string;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  category: RequestCategory | '';
  onCategoryChange: (value: RequestCategory | '') => void;
  onCompose?: () => void;
  /** Hides both panes below the md breakpoint while a thread is open. */
  hiddenOnMobile: boolean;
}

export function RequestList({
  asAdmin,
  folders,
  folder,
  onFolderChange,
  counts,
  requests,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  onCompose,
  hiddenOnMobile
}: RequestListProps) {
  const activeFolder = folders.find((f) => f.id === folder) ?? folders[0];

  return (
    <>
      {/* Folder rail */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-line bg-canvas/60 p-3 lg:flex">
        {onCompose && (
          <button type="button" onClick={onCompose} className="btn btn-primary mb-4 w-full">
            <PenSquareIcon className="h-4 w-4" /> New Request
          </button>
        )}
        <nav aria-label="Request folders">
          <ul className="space-y-0.5">
            {folders.map((f) => {
              const active = f.id === folder;
              const Icon = f.icon;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => onFolderChange(f.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                      active ? 'bg-brand-50 font-semibold text-brand-700' : 'font-medium text-ink-muted hover:bg-white hover:text-ink'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 truncate text-left">{f.label}</span>
                    {counts[f.id] > 0 && (
                      <span className={`text-[11px] font-semibold ${active ? 'text-brand-700' : 'text-ink-subtle'}`}>{counts[f.id]}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Message list */}
      <section
        className={`${hiddenOnMobile ? 'hidden md:flex' : 'flex'} w-full min-w-0 shrink-0 flex-col border-r border-line md:w-80 xl:w-96`}
        aria-label={activeFolder.label}
      >
        <div className="space-y-2.5 border-b border-line p-3">
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onFolderChange(f.id)}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    f.id === folder ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink-muted'
                  }`}
                >
                  {f.label}
                  {counts[f.id] > 0 ? ` · ${counts[f.id]}` : ''}
                </button>
              ))}
            </div>
            {onCompose && (
              <button type="button" onClick={onCompose} className="btn btn-primary btn-icon h-8 min-h-0 w-8 shrink-0" aria-label="New request">
                <PenSquareIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search requests"
                aria-label="Search requests"
                className="input h-9 min-h-0 pl-8 text-[13px]"
              />
            </div>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as RequestCategory | '')}
              aria-label="Filter by request type"
              className="input select select-sm h-9 min-h-0 w-auto max-w-[8.5rem] text-xs hover:border-brand-300"
            >
              <option value="">All types</option>
              {requestCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {requests.length === 0 ? (
            <EmptyState
              icon={activeFolder.icon}
              title={search || category ? 'No matching requests' : `Nothing in ${activeFolder.label.toLowerCase()}`}
              description={
                search || category
                  ? 'Try a different search or request type.'
                  : asAdmin
                  ? 'New requests from faculty and staff will appear here.'
                  : 'Requests you send to the QA Office will appear here.'
              }
            />
          ) : (
            <ul>
              {requests.map((r) => {
                const last = lastMessage(r);
                const unread = isUnreadFor(r, asAdmin);
                const selected = r.id === selectedId;
                const sender = asAdmin ? r.requesterName : 'QA Office';
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(r.id)}
                      aria-current={selected ? 'true' : undefined}
                      className={`relative flex w-full gap-3 border-b border-line-subtle px-4 py-3 text-left transition-colors ${
                        selected ? 'bg-brand-50/70' : 'hover:bg-canvas'
                      }`}
                    >
                      {selected && <span className="absolute inset-y-0 left-0 w-0.5 bg-brand-600" aria-hidden="true" />}
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${
                          asAdmin ? 'bg-slate-100 text-slate-700' : 'bg-brand-600 text-white'
                        }`}
                        aria-hidden="true"
                      >
                        {asAdmin ? initials(r.requesterName) : 'QA'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={`truncate text-[13px] ${unread ? 'font-bold text-ink' : 'font-medium text-ink-muted'}`}>
                            {asAdmin ? sender : `To: ${sender}`}
                          </span>
                          <span className={`shrink-0 text-[11px] ${unread ? 'font-semibold text-brand-700' : 'text-ink-subtle'}`}>
                            {inboxTime(r.updatedAt)}
                          </span>
                        </div>
                        <p className={`truncate text-[13px] ${unread ? 'font-semibold text-ink' : 'text-ink'}`}>{r.subject}</p>
                        <p className="truncate text-xs text-ink-subtle">
                          {last
                            ? `${last.authorId === r.requesterId ? (asAdmin ? '' : 'You: ') : 'QA: '}${last.body.replace(/\s+/g, ' ')}`
                            : ''}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <Badge tone={requestStatusTone[r.status]} className="!px-2 !py-0 !text-[10.5px]">
                            {r.status}
                          </Badge>
                          {r.priority === 'Urgent' && (
                            <Badge tone="danger" className="!px-2 !py-0 !text-[10.5px]">
                              Urgent
                            </Badge>
                          )}
                          <span className="ml-auto flex items-center gap-1.5 text-ink-subtle">
                            {hasAttachments(r) && <PaperclipIcon className="h-3.5 w-3.5" aria-label="Has attachments" />}
                            {r.starred && <StarIcon className="h-3.5 w-3.5 fill-brand-400 text-brand-500" aria-label="Starred" />}
                            {unread && <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
