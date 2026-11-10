export type RequestCategory = 'Accreditation Instrument' | 'Document' | 'Template / Form' | 'Other';

export type RequestStatus = 'Open' | 'In Progress' | 'Fulfilled' | 'Closed';

export type RequestPriority = 'Normal' | 'Urgent';

export interface RequestAttachment {
  id: string;
  /** `upload` files live in IndexedDB under `id`; `document` points at a repository document. */
  kind: 'upload' | 'document';
  name: string;
  fileType: string;
  sizeMb?: number;
  documentId?: string;
}

export interface RequestMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  body: string;
  attachments: RequestAttachment[];
  sentAt: string;
}

export interface DocumentRequest {
  id: string;
  subject: string;
  category: RequestCategory;
  priority: RequestPriority;
  /** Program, area or campus the request relates to. */
  reference?: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  requesterEmail?: string;
  requesterOffice?: string;
  status: RequestStatus;
  messages: RequestMessage[];
  createdAt: string;
  updatedAt: string;
  unreadByAdmin: boolean;
  unreadByRequester: boolean;
  starred?: boolean;
}

export interface NewDocumentRequestInput {
  subject: string;
  category: RequestCategory;
  priority: RequestPriority;
  reference?: string;
  body: string;
  attachments: RequestAttachment[];
}

export const requestCategories: RequestCategory[] = ['Accreditation Instrument', 'Document', 'Template / Form', 'Other'];
