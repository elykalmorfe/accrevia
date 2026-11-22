import { AttachmentAccess, AttachmentRole } from '../types/request';

export function accessSummary(access: AttachmentAccess = 'restricted', role: AttachmentRole = 'viewer') {
  const who = access === 'anyone' ? 'Anyone' : 'Restricted';
  const what = role === 'editor' ? 'Editor' : role === 'commenter' ? 'Commenter' : 'Viewer';
  return `${who} · ${what}`;
}
