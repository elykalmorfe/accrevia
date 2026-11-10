import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MailIcon, PenSquareIcon } from 'lucide-react';
import { usePortal } from '../contexts/PortalContext';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { adminFolders, inFolder, RequestFolderId, RequestList, userFolders } from '../components/requests/RequestList';
import { RequestThread } from '../components/requests/RequestThread';
import { ComposeRequestModal } from '../components/requests/ComposeRequestModal';
import { RequestCategory } from '../types/request';
import { isUnreadFor, lastMessage } from '../utils/requests';

export function Requests() {
  const { requestId } = useParams<{ requestId?: string }>();
  const navigate = useNavigate();
  const { documentRequests, currentUser, isAdmin, markDocumentRequestRead } = usePortal();
  const asAdmin = isAdmin;
  const folders = asAdmin ? adminFolders : userFolders;

  const [folder, setFolder] = useState<RequestFolderId>(folders[0].id);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<RequestCategory | ''>('');
  const [composeOpen, setComposeOpen] = useState(false);

  const visible = useMemo(
    () =>
      (asAdmin ? documentRequests : documentRequests.filter((r) => r.requesterId === currentUser.id))
        .slice()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [documentRequests, asAdmin, currentUser.id]
  );

  const counts = useMemo(
    () => Object.fromEntries(folders.map((f) => [f.id, visible.filter((r) => inFolder(r, f.id, asAdmin)).length])),
    [folders, visible, asAdmin]
  );

  const listed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visible.filter(
      (r) =>
        inFolder(r, folder, asAdmin) &&
        (!category || r.category === category) &&
        (!q ||
          [r.subject, r.requesterName, r.reference ?? '', r.category, lastMessage(r)?.body ?? ''].some((v) => v.toLowerCase().includes(q)))
    );
  }, [visible, folder, asAdmin, category, search]);

  const selected = visible.find((r) => r.id === requestId);
  const selectedUnread = !!selected && isUnreadFor(selected, asAdmin);

  useEffect(() => {
    if (selected && selectedUnread) markDocumentRequestRead(selected.id);
  }, [selected, selectedUnread, markDocumentRequestRead]);

  const openRequest = (id: string) => navigate(`/requests/${id}`);
  const unreadTotal = visible.filter((r) => isUnreadFor(r, asAdmin)).length;

  return (
    <div className="flex h-[calc(100dvh-6.5rem)] flex-col sm:h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-8rem)]">
      <PageHeader
        eyebrow="Document Requests"
        title={asAdmin ? 'Requests' : 'My Requests'}
        description={
          <span className="hidden sm:inline">
            {asAdmin
              ? 'Requests for accreditation instruments and documents from faculty and staff. Reply with files or repository documents to fulfill them.'
              : 'Request accreditation instruments, templates or other documents from the QA Office and follow the conversation here.'}
          </span>
        }
        actions={
          !asAdmin ? (
            <button type="button" onClick={() => setComposeOpen(true)} className="btn btn-primary">
              <PenSquareIcon className="h-4 w-4" /> New Request
            </button>
          ) : unreadTotal > 0 ? (
            <span className="text-xs font-medium text-ink-muted">
              <span className="font-bold text-brand-700">{unreadTotal}</span> unread
            </span>
          ) : undefined
        }
      />

      <div className="panel flex min-h-[360px] flex-1 overflow-hidden !p-0 sm:min-h-[480px]">
        <RequestList
          asAdmin={asAdmin}
          folders={folders}
          folder={folder}
          onFolderChange={setFolder}
          counts={counts}
          requests={listed}
          selectedId={selected?.id}
          onSelect={openRequest}
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          onCompose={asAdmin ? undefined : () => setComposeOpen(true)}
          hiddenOnMobile={!!selected}
        />

        <section className={`${selected ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`} aria-label="Request conversation">
          {selected ? (
            <RequestThread request={selected} asAdmin={asAdmin} onBack={() => navigate('/requests')} />
          ) : (
            <div className="grid flex-1 place-items-center bg-canvas/40">
              <EmptyState
                icon={MailIcon}
                title={requestId ? 'Request not found' : 'Select a request to read'}
                description={
                  requestId
                    ? 'It may have been removed, or it belongs to someone else.'
                    : asAdmin
                    ? 'Open a request to view the conversation and send the requested files.'
                    : 'Open one of your requests, or send a new one to the QA Office.'
                }
                action={
                  !asAdmin ? (
                    <button type="button" onClick={() => setComposeOpen(true)} className="btn btn-secondary btn-sm">
                      <PenSquareIcon className="h-3.5 w-3.5" /> New Request
                    </button>
                  ) : undefined
                }
              />
            </div>
          )}
        </section>
      </div>

      {!asAdmin && (
        <ComposeRequestModal
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          onCreated={(id) => {
            setFolder('all');
            openRequest(id);
          }}
        />
      )}
    </div>
  );
}
