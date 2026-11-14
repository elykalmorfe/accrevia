import { useMemo } from 'react';
import { usePortal } from '../contexts/PortalContext';
import { PageHeader } from '../components/ui/PageHeader';
import { AccessLogTable, LogTableEntry } from '../components/sharing/AccessLogTable';
import { AccessAction } from '../types/sharing';
import { formatDate } from '../utils/format';

const requestActions: AccessAction[] = ['Access requested', 'Access approved', 'Access rejected'];

export function RequestLogs() {
  const { accessRequests, users } = usePortal();

  const entries = useMemo(() => {
    const roleOf = (name?: string) => users.find((u) => u.name === name)?.role ?? 'Reviewer';
    const rows: LogTableEntry[] = [];
    for (const r of accessRequests) {
      rows.push({
        id: `${r.id}-requested`,
        actor: r.requesterName,
        actorRole: [r.requesterRole, r.requesterOffice].filter(Boolean).join(' · '),
        action: 'Access requested',
        documentId: r.documentId,
        documentTitle: r.documentTitle,
        detail: `${r.requestedPermission} — "${r.reason}"`,
        at: r.requestedAt
      });
      if (r.status !== 'Pending' && r.reviewedAt) {
        const approved = r.status === 'Approved';
        const expiry = approved ? (r.grantedExpiresAt ? `until ${formatDate(r.grantedExpiresAt)}` : 'no expiration') : '';
        rows.push({
          id: `${r.id}-reviewed`,
          actor: r.reviewedBy ?? 'Unknown reviewer',
          actorRole: roleOf(r.reviewedBy),
          action: approved ? 'Access approved' : 'Access rejected',
          documentId: r.documentId,
          documentTitle: r.documentTitle,
          detail: [
            approved ? `Granted ${r.requestedPermission} to ${r.requesterName} (${expiry})` : `Declined for ${r.requesterName}`,
            r.reviewNotes
          ]
            .filter(Boolean)
            .join(' — '),
          at: r.reviewedAt
        });
      }
    }
    return rows.sort((a, b) => b.at.localeCompare(a.at));
  }, [accessRequests, users]);

  return (
    <>
      <PageHeader
        eyebrow="Document Access"
        title="Request Logs"
        description="Chronological history of every document access request and the decision made on it."
      />
      <AccessLogTable entries={entries} actions={requestActions} label="Request log" />
    </>
  );
}
