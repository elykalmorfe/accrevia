import React from 'react';
import { LockIcon, UsersIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { shareStatus } from '../../utils/sharing';
import { ShareStatus } from '../../types/sharing';
import { Badge, BadgeTone } from '../ui/Badge';

export function SharingStatusBadge({ documentId }: {documentId: string;}) {
  const { shares } = usePortal();
  const active = shares.filter((s) => s.documentId === documentId && shareStatus(s) === 'Active').length;
  if (!active) {
    return (
      <Badge>
        <LockIcon className="h-3 w-3" aria-hidden="true" /> Private
      </Badge>);

  }
  return (
    <Badge tone="brand">
      <UsersIcon className="h-3 w-3" aria-hidden="true" /> Shared · {active}
    </Badge>);

}

const shareTone: Record<ShareStatus, BadgeTone> = { Active: 'success', Expired: 'warning', Revoked: 'neutral' };

export function ShareStatusBadge({ status }: {status: ShareStatus;}) {
  return (
    <Badge tone={shareTone[status]} dot>
      {status}
    </Badge>);

}