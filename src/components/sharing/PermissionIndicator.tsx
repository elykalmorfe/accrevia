import React from 'react';
import { CheckIcon, XIcon } from 'lucide-react';

export function PermissionIndicator({ canDownload }: {canDownload: boolean;}) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap text-xs font-medium">
      <span className="inline-flex items-center gap-1 text-success-700">
        <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" /> View
      </span>
      <span className={`inline-flex items-center gap-1 ${canDownload ? 'text-success-700' : 'text-ink-subtle'}`}>
        {canDownload ?
        <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" /> :

        <XIcon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
        }
        Download
      </span>
      <span className="sr-only">{canDownload ? 'View and download allowed' : 'View only, download not allowed'}</span>
    </span>);

}