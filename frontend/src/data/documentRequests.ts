import { DocumentRequest } from '../types/request';

export const initialDocumentRequests: DocumentRequest[] = [
  {
    id: 'dreq-seed-01',
    subject: 'AACCUP Accreditation Instrument for BSIT (Level II)',
    category: 'Accreditation Instrument',
    priority: 'Urgent',
    reference: 'BS Information Technology · Tandag Campus',
    requesterId: 'u-08',
    requesterName: 'Prof. Arnel B. Lupian',
    requesterRole: 'Faculty',
    requesterEmail: 'ablupian@nemsu.edu.ph',
    requesterOffice: 'College of Information Technology Education',
    status: 'Open',
    messages: [
      {
        id: 'dmsg-seed-01',
        authorId: 'u-08',
        authorName: 'Prof. Arnel B. Lupian',
        authorRole: 'Faculty',
        body:
          'Good day QA Office,\n\nMay we request a copy of the latest AACCUP self-survey instrument and parameter rating matrix for BSIT Level II? Our area chairs will start preparing the documentary requirements next week.\n\nThank you.',
        attachments: [],
        sentAt: '2026-10-01T08:15:00'
      }
    ],
    createdAt: '2026-10-01T08:15:00',
    updatedAt: '2026-10-01T08:15:00',
    unreadByAdmin: true,
    unreadByRequester: false
  },
  {
    id: 'dreq-seed-02',
    subject: 'COPC application template and checklist',
    category: 'Template / Form',
    priority: 'Normal',
    reference: 'College of Engineering',
    requesterId: 'u-09',
    requesterName: 'Dr. Gemma R. Plaza',
    requesterRole: 'Faculty',
    requesterEmail: 'grplaza@nemsu.edu.ph',
    requesterOffice: 'College of Engineering',
    status: 'In Progress',
    messages: [
      {
        id: 'dmsg-seed-02',
        authorId: 'u-09',
        authorName: 'Dr. Gemma R. Plaza',
        authorRole: 'Faculty',
        body: 'Hello, could you send us the CHED COPC application template and the updated checklist of requirements for our new BS Civil Engineering program?',
        attachments: [],
        sentAt: '2026-09-29T10:02:00'
      },
      {
        id: 'dmsg-seed-03',
        authorId: 'u-02',
        authorName: 'Prof. Liza M. Cabrera',
        authorRole: 'QA Personnel',
        body: 'Hi Dr. Plaza, noted. We are confirming the latest CMO version with CHED Caraga and will send the files within the week.',
        attachments: [],
        sentAt: '2026-09-29T14:40:00'
      }
    ],
    createdAt: '2026-09-29T10:02:00',
    updatedAt: '2026-09-29T14:40:00',
    unreadByAdmin: false,
    unreadByRequester: false,
    starred: true
  },
  {
    id: 'dreq-seed-03',
    subject: 'BOR resolution approving the BSEd curriculum revision',
    category: 'Document',
    priority: 'Normal',
    reference: 'College of Teacher Education',
    requesterId: 'u-07',
    requesterName: 'Dr. Teresita A. Gonzaga',
    requesterRole: 'Faculty',
    requesterEmail: 'tagonzaga@nemsu.edu.ph',
    requesterOffice: 'College of Teacher Education',
    status: 'Fulfilled',
    messages: [
      {
        id: 'dmsg-seed-04',
        authorId: 'u-07',
        authorName: 'Dr. Teresita A. Gonzaga',
        authorRole: 'Faculty',
        body: 'Requesting a copy of the BOR resolution that approved the revised BSEd curriculum. We need it as evidence for Area IV.',
        attachments: [],
        sentAt: '2026-09-25T09:30:00'
      },
      {
        id: 'dmsg-seed-05',
        authorId: 'u-02',
        authorName: 'Prof. Liza M. Cabrera',
        authorRole: 'QA Personnel',
        body: 'Good morning Dr. Gonzaga. The resolution is available in the repository under Common Documents. Let us know if you need a certified true copy.',
        attachments: [],
        sentAt: '2026-09-26T08:05:00'
      }
    ],
    createdAt: '2026-09-25T09:30:00',
    updatedAt: '2026-09-26T08:05:00',
    unreadByAdmin: false,
    unreadByRequester: false
  }
];
