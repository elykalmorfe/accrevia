import React from 'react';
import { DocumentStatus } from '../../types/evidence';
import { Badge, BadgeTone } from './Badge';

const statusTone: Record<DocumentStatus, BadgeTone> = {
  Indexed: 'success',
  Processing: 'brand',
  'Pending Classification': 'warning',
  Failed: 'danger',
  Archived: 'neutral'
};

const statusLabel: Record<DocumentStatus, string> = {
  Indexed: 'Indexed',
  Processing: 'Processing',
  'Pending Classification': 'Pending',
  Failed: 'Failed',
  Archived: 'Archived'
};

export function StatusBadge({ status }: {status: DocumentStatus;}) {
  return (
    <Badge tone={statusTone[status]} dot>
      {statusLabel[status]}
    </Badge>);

}