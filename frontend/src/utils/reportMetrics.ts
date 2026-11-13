import { Campus, CampusIAStatus, ISOSurveillanceRecord, ProgramAccreditation } from '../types/accreditation';
import { EvidenceDocument } from '../types/evidence';
import {
  ExpiryInfo,
  expiringWindowMonths,
  formatReportDate,
  getExpiryInfo,
  getRenewalAction,
  isAccreditedLevel,
  parseAccreditationDate
} from './programAccreditation';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30.44;

/** Traffic-light status shared by every report: green is fine, yellow needs attention soon, red needs action now. */
export type Health = 'good' | 'warning' | 'danger';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

/** `In 12 days`, `In 5 months`, `Today`, `30 days ago`. */
export function describeDays(days: number): string {
  if (days < 0) {
    const ago = Math.abs(days);
    return ago < 60 ? `${ago} day${ago === 1 ? '' : 's'} ago` : `${Math.round(ago / DAYS_PER_MONTH)} months ago`;
  }
  if (days === 0) return 'Today';
  if (days < 60) return `In ${days} day${days === 1 ? '' : 's'}`;
  return `In ${Math.round(days / DAYS_PER_MONTH)} months`;
}

export function deadlineHealth(days: number): Health {
  if (days <= 90) return 'danger';
  if (days <= expiringWindowMonths() * DAYS_PER_MONTH) return 'warning';
  return 'good';
}

// ================= Program survey readiness =================

export type ReadinessLevel = 'Ready' | 'In progress' | 'Needs work';

export const READY_PERCENT = 90;
export const IN_PROGRESS_PERCENT = 50;

export const readinessHealth: Record<ReadinessLevel, Health> = {
  Ready: 'good',
  'In progress': 'warning',
  'Needs work': 'danger'
};

export const readinessHints: Record<ReadinessLevel, string> = {
  Ready: `${READY_PERCENT}% or more of survey requirements submitted`,
  'In progress': `${IN_PROGRESS_PERCENT}–${READY_PERCENT - 1}% of survey requirements submitted`,
  'Needs work': `Less than ${IN_PROGRESS_PERCENT}% of survey requirements submitted`
};

export function readinessLevel(percent: number): ReadinessLevel {
  if (percent >= READY_PERCENT) return 'Ready';
  if (percent >= IN_PROGRESS_PERCENT) return 'In progress';
  return 'Needs work';
}

export interface Deadline {
  kind: 'survey' | 'validity';
  date: Date;
  daysRemaining: number;
}

export interface ProgramReadiness {
  program: ProgramAccreditation;
  total: number;
  submitted: number;
  verified: number;
  percent: number;
  level: ReadinessLevel;
  expiry: ExpiryInfo;
  /** The most urgent upcoming date: the scheduled survey or the end of the current accreditation. */
  deadline: Deadline | null;
  /** Accreditation has ended, ends within the warning window, or a survey is scheduled within it. */
  dueSoon: boolean;
}

export function getProgramReadiness(program: ProgramAccreditation, now: Date = new Date()): ProgramReadiness {
  const requirements = program.requirements || [];
  const total = requirements.length;
  const submitted = requirements.filter((r) => r.isSubmitted).length;
  const verified = requirements.filter((r) => r.verified).length;
  const percent = total ? Math.round((submitted / total) * 100) : 0;
  const expiry = getExpiryInfo(program, now);

  const survey = parseAccreditationDate(program.scheduleForAccreditation);
  const surveyDays = survey ? daysBetween(now, survey) : null;

  let deadline: Deadline | null = null;
  if (survey && surveyDays !== null && surveyDays >= 0) {
    deadline = { kind: 'survey', date: survey, daysRemaining: surveyDays };
  }
  if (expiry.endDate && expiry.daysRemaining !== null && (!deadline || expiry.daysRemaining < deadline.daysRemaining)) {
    deadline = { kind: 'validity', date: expiry.endDate, daysRemaining: expiry.daysRemaining };
  }

  const surveySoon = surveyDays !== null && surveyDays >= 0 && surveyDays <= expiringWindowMonths() * DAYS_PER_MONTH;
  const dueSoon = expiry.state === 'expired' || expiry.state === 'expiring' || surveySoon;

  return { program, total, submitted, verified, percent, level: readinessLevel(percent), expiry, deadline, dueSoon };
}

export function describeDeadline(deadline: Deadline): string {
  if (deadline.kind === 'survey') return `Survey on ${formatReportDate(deadline.date)}`;
  return deadline.daysRemaining < 0
    ? `Accreditation ended ${formatReportDate(deadline.date)}`
    : `Accreditation ends ${formatReportDate(deadline.date)}`;
}

// ================= Document review =================

export type ReviewState = 'Approved' | 'Pending Review' | 'Needs Revision';

/** Documents uploaded without a review decision count as waiting for review, matching All Documents. */
export function reviewState(doc: EvidenceDocument): ReviewState {
  if (doc.approvalStatus === 'Approved') return 'Approved';
  if (doc.approvalStatus === 'Needs Revision') return 'Needs Revision';
  return 'Pending Review';
}

export const REVIEW_OVERDUE_DAYS = 14;

export function activeDocuments(documents: EvidenceDocument[]): EvidenceDocument[] {
  return documents.filter((d) => d.status !== 'Archived');
}

export function daysWaiting(doc: EvidenceDocument, now: Date = new Date()): number {
  const added = parseAccreditationDate(doc.dateAdded.slice(0, 10));
  return added ? Math.max(daysBetween(added, now), 0) : 0;
}

export interface ReviewSummary {
  approved: number;
  pending: number;
  revision: number;
  /** Waiting for review longer than `REVIEW_OVERDUE_DAYS`. */
  overdue: number;
  oldestWaitingDays: number | null;
}

export function summarizeReview(documents: EvidenceDocument[], now: Date = new Date()): ReviewSummary {
  const summary: ReviewSummary = { approved: 0, pending: 0, revision: 0, overdue: 0, oldestWaitingDays: null };
  for (const doc of activeDocuments(documents)) {
    const state = reviewState(doc);
    if (state === 'Approved') summary.approved += 1;
    else if (state === 'Needs Revision') summary.revision += 1;
    else {
      summary.pending += 1;
      const waited = daysWaiting(doc, now);
      if (waited > REVIEW_OVERDUE_DAYS) summary.overdue += 1;
      summary.oldestWaitingDays = Math.max(summary.oldestWaitingDays ?? 0, waited);
    }
  }
  return summary;
}

/** Documents whose "valid until" date has passed, e.g. lapsed certificates or licenses. */
export function expiredDocuments(documents: EvidenceDocument[], now: Date = new Date()): EvidenceDocument[] {
  const today = startOfDay(now);
  return activeDocuments(documents).filter((d) => {
    const until = parseAccreditationDate(d.validUntil);
    return !!until && until < today;
  });
}

// ================= What needs attention =================

export interface AttentionItem {
  id: string;
  health: Exclude<Health, 'good'>;
  title: string;
  detail: string;
  action: string;
  to: string;
  /** Lower sorts first within the same health. */
  urgency: number;
}

interface AttentionInput {
  programs: ProgramAccreditation[];
  iaRecords: CampusIAStatus[];
  campuses: Campus[];
  documents: EvidenceDocument[];
  isoRecords: ISOSurveillanceRecord[];
}

function campusShortName(campuses: Campus[], campusId: string): string {
  return campuses.find((c) => c.id === campusId)?.shortName ?? campusId;
}

export function buildAttentionItems(
  { programs, iaRecords, campuses, documents, isoRecords }: AttentionInput,
  now: Date = new Date()
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const p of programs) {
    const expiry = getExpiryInfo(p, now);
    if (expiry.state !== 'expired' && expiry.state !== 'expiring') continue;
    const days = expiry.daysRemaining ?? 0;
    const when = expiry.state === 'expired' ? `ended ${formatReportDate(expiry.endDate)}` : `ends ${formatReportDate(expiry.endDate)} (${describeDays(days).toLowerCase()})`;
    items.push({
      id: `program-${p.id}`,
      health: expiry.state === 'expired' || days <= 90 ? 'danger' : 'warning',
      title: `${p.programName} · ${campusShortName(campuses, p.campusId)}`,
      detail: `Accreditation ${when}. Next step: ${getRenewalAction(p)}.`,
      action: 'View program',
      to: '/frameworks/pa',
      urgency: days
    });
  }

  for (const ia of iaRecords) {
    const expiry = getExpiryInfo(ia, now);
    if (expiry.state !== 'expired' && expiry.state !== 'expiring') continue;
    const days = expiry.daysRemaining ?? 0;
    items.push({
      id: `ia-${ia.campusId}`,
      health: expiry.state === 'expired' || days <= 90 ? 'danger' : 'warning',
      title: `${campusShortName(campuses, ia.campusId)} institutional accreditation`,
      detail: `${expiry.state === 'expired' ? 'Ended' : 'Ends'} ${formatReportDate(expiry.endDate)}. Prepare the institutional resurvey.`,
      action: 'View campus',
      to: '/frameworks/ia',
      urgency: days
    });
  }

  const expired = expiredDocuments(documents, now);
  if (expired.length) {
    items.push({
      id: 'docs-expired',
      health: 'danger',
      title: `${expired.length} document${expired.length === 1 ? ' has' : 's have'} expired`,
      detail: 'Their "valid until" date has passed. Upload updated copies so they still count as evidence.',
      action: 'View documents',
      to: '/evidence',
      urgency: -1
    });
  }

  const review = summarizeReview(documents, now);
  if (review.revision) {
    items.push({
      id: 'docs-revision',
      health: 'warning',
      title: `${review.revision} document${review.revision === 1 ? ' was' : 's were'} returned for revision`,
      detail: 'Reviewers asked for changes. Fix and re-upload them before the survey.',
      action: 'Fix documents',
      to: `/evidence?review=${encodeURIComponent('Needs Revision')}`,
      urgency: 0
    });
  }
  if (review.overdue) {
    items.push({
      id: 'docs-overdue',
      health: 'warning',
      title: `${review.overdue} document${review.overdue === 1 ? ' has' : 's have'} waited over ${REVIEW_OVERDUE_DAYS} days for review`,
      detail: 'Documents only count as evidence once they are approved.',
      action: 'Review now',
      to: `/evidence?review=${encodeURIComponent('Pending Review')}`,
      urgency: 0
    });
  }

  const today = startOfDay(now);
  const overdueCars = isoRecords
    .flatMap((r) => r.correctiveActions || [])
    .filter((car) => {
      if (car.status === 'Closed / Verified') return false;
      const target = parseAccreditationDate(car.targetDate);
      return !!target && target < today;
    }).length;
  if (overdueCars) {
    items.push({
      id: 'iso-cars',
      health: 'danger',
      title: `${overdueCars} ISO corrective action${overdueCars === 1 ? ' is' : 's are'} past the target date`,
      detail: 'Close these before the next surveillance audit.',
      action: 'View actions',
      to: '/frameworks/iso',
      urgency: -1
    });
  }

  return items.sort((a, b) => (a.health === b.health ? a.urgency - b.urgency : a.health === 'danger' ? -1 : 1));
}

// ================= Campus comparison =================

export interface CampusScore {
  campus: Campus;
  programs: number;
  accredited: number;
  copcCompliant: number;
  endingSoon: number;
  documents: number;
}

export function percentOf(part: number, whole: number): number {
  return whole ? Math.round((part / whole) * 100) : 0;
}

export function campusScorecard(
  campuses: Campus[],
  programs: ProgramAccreditation[],
  documents: EvidenceDocument[],
  isCampusMatch: (docCampus?: string, targetCampus?: Campus['id'] | 'all') => boolean,
  now: Date = new Date()
): CampusScore[] {
  const active = activeDocuments(documents);
  return campuses.map((campus) => {
    const list = programs.filter((p) => p.campusId === campus.id);
    return {
      campus,
      programs: list.length,
      accredited: list.filter((p) => isAccreditedLevel(p.status)).length,
      copcCompliant: list.filter((p) => p.copcStatus === 'Compliant').length,
      endingSoon: list.filter((p) => {
        const state = getExpiryInfo(p, now).state;
        return state === 'expired' || state === 'expiring';
      }).length,
      documents: active.filter((d) => d.campusId === campus.id || isCampusMatch(d.campus, campus.id)).length
    };
  });
}

// ================= ISO =================

/** Share of campuses whose latest current ISO audit is compliant or certified. */
export function isoConformance(isoRecords: ISOSurveillanceRecord[]): { campuses: number; conforming: number; rate: number } {
  const latestByCampus = new Map<string, ISOSurveillanceRecord>();
  isoRecords
    .filter((r) => !r.isHistorical)
    .forEach((r) => {
      const current = latestByCampus.get(r.campusId);
      if (!current || r.auditDate > current.auditDate) latestByCampus.set(r.campusId, r);
    });
  const latest = [...latestByCampus.values()];
  const conforming = latest.filter((r) => r.complianceStatus === 'Compliant' || r.complianceStatus === 'Certified').length;
  return { campuses: latest.length, conforming, rate: percentOf(conforming, latest.length) };
}
