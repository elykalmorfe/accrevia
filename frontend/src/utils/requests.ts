import { format, parseISO } from 'date-fns';
import { BadgeTone } from '../components/ui/Badge';
import { DocumentRequest, RequestAttachment, RequestStatus } from '../types/request';
import { persistUpload } from './fileStore';
import { fileTypeFromName } from './fileTypes';
import { formatTime } from './format';
import { TODAY } from './sharing';
import { filterAllowedUploads } from './uploadRules';

export const requestStatusTone: Record<RequestStatus, BadgeTone> = {
  Open: 'brand',
  'In Progress': 'warning',
  Fulfilled: 'success',
  Closed: 'neutral'
};

/** Time for today's messages, short date otherwise — like an email inbox. */
export function inboxTime(iso: string): string {
  return iso.slice(0, 10) === TODAY ? formatTime(iso) : format(parseISO(iso), 'MMM d');
}

export function lastMessage(request: DocumentRequest) {
  return request.messages[request.messages.length - 1];
}

export function hasAttachments(request: DocumentRequest): boolean {
  return request.messages.some((m) => m.attachments.length > 0);
}

/** Whether the request is unread from the viewer's side of the conversation. */
export function isUnreadFor(request: DocumentRequest, asAdmin: boolean): boolean {
  return asAdmin ? request.unreadByAdmin : request.unreadByRequester;
}

/** Stores accepted files in IndexedDB and returns them as attachments; disallowed files are skipped with a toast. */
export function filesToAttachments(files: File[]): RequestAttachment[] {
  return filterAllowedUploads(files, (f) => f).map((file, i) => {
    const id = `ratt-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;
    persistUpload(id, file);
    return {
      id,
      kind: 'upload',
      name: file.name,
      fileType: fileTypeFromName(file.name),
      sizeMb: Math.max(0.01, Math.round((file.size / (1024 * 1024)) * 100) / 100)
    };
  });
}
