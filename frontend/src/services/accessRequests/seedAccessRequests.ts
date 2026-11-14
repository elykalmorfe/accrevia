import type { TechnicalReviewAccessRequest } from '../../types/technicalReviewAccess';

/**
 * Sample records demonstrating approval states.
 * Identities are generic — no restricted filenames or Drive links.
 */
export const seedTechnicalReviewAccessRequests: TechnicalReviewAccessRequest[] = [
  {
    id: 'seed-tr-approved',
    demoRequestId: 'DEMO-TR-2026-0001',
    campusId: 'bislig',
    campusName: 'Bislig',
    collegeProgram: 'College of Engineering · BS Civil Engineering',
    purpose: 'Prepare program accreditation evidence summary for internal QA coordination (demo).',
    status: 'Approved',
    submittedAt: '2026-10-12T08:30:00.000Z',
    updatedAt: '2026-10-14T10:00:00.000Z',
    requesterName: 'Demo Faculty',
    reviewedBy: 'Demo QA',
    reviewedAt: '2026-10-14T10:00:00.000Z',
    expiresAt: '2099-12-31',
    qaRemarks: 'Simulated approval for UI demonstration only. Does not unlock Google Drive materials.',
    reviewHistory: [
      { at: '2026-10-12T08:30:00.000Z', action: 'Submitted', by: 'Demo Faculty' },
      {
        at: '2026-10-14T10:00:00.000Z',
        action: 'Approved',
        by: 'Demo QA',
        note: 'Simulated approval. Expires 2099-12-31 (demo).'
      }
    ],
    isDemo: true
  },
  {
    id: 'seed-tr-denied',
    demoRequestId: 'DEMO-TR-2026-0002',
    campusId: 'cantilan',
    campusName: 'Cantilan',
    collegeProgram: 'College of Computing · BS Information Technology',
    purpose: 'Review evaluator findings for instructional planning (demo).',
    status: 'Denied',
    submittedAt: '2026-09-20T09:15:00.000Z',
    updatedAt: '2026-09-22T11:20:00.000Z',
    requesterName: 'Demo Faculty',
    reviewedBy: 'Demo QA',
    reviewedAt: '2026-09-22T11:20:00.000Z',
    qaRemarks: 'Simulated denial. No restricted files were shared.',
    reviewHistory: [
      { at: '2026-09-20T09:15:00.000Z', action: 'Submitted', by: 'Demo Faculty' },
      {
        at: '2026-09-22T11:20:00.000Z',
        action: 'Denied',
        by: 'Demo QA',
        note: 'Simulated denial. No restricted files were shared.'
      }
    ],
    isDemo: true
  },
  {
    id: 'seed-tr-expired',
    demoRequestId: 'DEMO-TR-2026-0003',
    campusId: 'lianga',
    campusName: 'Lianga',
    collegeProgram: 'College of Arts and Sciences · BS Environmental Science',
    purpose: 'Temporary access for accreditation timeline drafting (demo).',
    /** Stored as Approved with a past expiresAt so derivation yields Expired on read. */
    status: 'Approved',
    submittedAt: '2026-06-02T07:45:00.000Z',
    updatedAt: '2026-06-10T12:00:00.000Z',
    requesterName: 'Demo Faculty',
    reviewedBy: 'Demo QA',
    reviewedAt: '2026-06-10T12:00:00.000Z',
    expiresAt: '2026-07-01',
    qaRemarks: 'Simulated short-lived approval (demo).',
    reviewHistory: [
      { at: '2026-06-02T07:45:00.000Z', action: 'Submitted', by: 'Demo Faculty' },
      {
        at: '2026-06-10T12:00:00.000Z',
        action: 'Approved',
        by: 'Demo QA',
        note: 'Simulated approval with past expiration date for Expired-state demo.'
      }
    ],
    isDemo: true
  },
  {
    id: 'seed-tr-revoked',
    demoRequestId: 'DEMO-TR-2026-0004',
    campusId: 'tagbina',
    campusName: 'Tagbina',
    collegeProgram: 'Teacher education · Bachelor of Elementary Education',
    purpose: 'Short-term review of technical packet structure (demo).',
    status: 'Revoked',
    submittedAt: '2026-08-05T13:00:00.000Z',
    updatedAt: '2026-08-18T16:40:00.000Z',
    requesterName: 'Demo Faculty',
    reviewedBy: 'Demo QA',
    reviewedAt: '2026-08-10T09:00:00.000Z',
    expiresAt: '2099-01-01',
    qaRemarks: 'Simulated revocation. No Drive permissions were granted or removed.',
    reviewHistory: [
      { at: '2026-08-05T13:00:00.000Z', action: 'Submitted', by: 'Demo Faculty' },
      { at: '2026-08-10T09:00:00.000Z', action: 'Approved', by: 'Demo QA', note: 'Simulated approval.' },
      {
        at: '2026-08-18T16:40:00.000Z',
        action: 'Revoked',
        by: 'Demo QA',
        note: 'Simulated revocation. No Drive permissions were granted or removed.'
      }
    ],
    isDemo: true
  },
  {
    id: 'seed-tr-pending',
    demoRequestId: 'DEMO-TR-2026-0005',
    campusId: 'tandag',
    campusName: 'Tandag',
    collegeProgram: 'College of Arts and Sciences · BS Computer Science',
    purpose: 'Request temporary visibility of technical review summaries for program preparation (demo).',
    remarks: 'Demo submission for Pending state layout.',
    status: 'Pending',
    submittedAt: '2026-11-01T04:20:00.000Z',
    updatedAt: '2026-11-01T04:20:00.000Z',
    requesterName: 'Demo Faculty',
    reviewHistory: [{ at: '2026-11-01T04:20:00.000Z', action: 'Submitted', by: 'Demo Faculty' }],
    isDemo: true
  }
];
