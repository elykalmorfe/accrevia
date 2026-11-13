import {
  AccreditationLevel,
  AccreditationResult,
  ProgramAccreditation,
  ProgramLevelHistoryEntry
} from '../types/accreditation';
import { getSettings, ValidityLevel } from '../settings/portalSettings';

const MONTH_INDEX: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Expiring soon" window in months, from Settings → Deadlines & Reminders. */
export function expiringWindowMonths(): number {
  return getSettings().reminders.expiryWarningMonths;
}

/** Suggested validity end date: start date plus the configured validity years for the level. */
export function suggestValidityEnd(level: AccreditationLevel, validityStart: string): string | null {
  const years = getSettings().accreditation.levelValidityYears[level as ValidityLevel];
  const start = parseAccreditationDate(validityStart);
  if (!years || !start) return null;
  const end = new Date(start.getFullYear() + years, start.getMonth(), start.getDate() - 1);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
}

export const RANKED_LEVELS: AccreditationLevel[] = ['Level 4', 'Level 3', 'Level 2', 'Level 1', 'Candidate'];

const LEVEL_RANK: Partial<Record<AccreditationLevel, number>> = {
  Candidate: 0,
  'Level 1': 1,
  'Level 2': 2,
  'Level 3': 3,
  'Level 4': 4
};

const ROMAN = ['', 'I', 'II', 'III', 'IV'];

/** Parses `YYYY-MM-DD`, `Mon-DD-YYYY` / `Mon DD, YYYY`, or any `Date.parse`-able string as a local date. */
export function parseAccreditationDate(value?: string | null): Date | null {
  const v = (value || '').trim();
  if (!v) return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const named = /^([A-Za-z]{3,})[-\s.](\d{1,2}),?[-\s](\d{4})$/.exec(v);
  if (named) {
    const month = MONTH_INDEX[named[1].slice(0, 3).toLowerCase()];
    if (month !== undefined) return new Date(Number(named[3]), month, Number(named[2]));
  }

  const parsed = Date.parse(v);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

export function isUrl(value?: string | null): boolean {
  return /^https?:\/\//i.test((value || '').trim());
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
}

export function formatReportDate(value?: string | Date | null): string {
  const d = value instanceof Date ? value : parseAccreditationDate(value);
  if (!d) return typeof value === 'string' && value ? value : '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatValidity(p: Pick<ProgramAccreditation, 'validityStart' | 'validityEnd'>): string {
  if (!p.validityStart && !p.validityEnd) return '—';
  return `${formatReportDate(p.validityStart)} – ${formatReportDate(p.validityEnd)}`;
}

export function levelRank(level?: AccreditationLevel | null): number | null {
  if (!level) return null;
  const rank = LEVEL_RANK[level];
  return rank === undefined ? null : rank;
}

export function isAccreditedLevel(level?: AccreditationLevel | null): boolean {
  const rank = levelRank(level);
  return rank !== null && rank >= 1;
}

/** Levels that get their own certificate folder, in display order. */
export const CERTIFICATE_LEVELS: AccreditationLevel[] = ['Candidate', 'Level 1', 'Level 2', 'Level 3', 'Level 4'];

/** `areaId` shared by a program's certificate folders and documents. */
export function certificateAreaKey(programId: string): string {
  return `cert-${programId}`;
}

/** `areaId` shared by a program's Technical Review & Board Action / ratings folders. */
export function ratingsAreaKey(programId: string): string {
  return `trba-${programId}`;
}

/** `areaId` shared by a campus's institutional (IA) certificate folders and documents. */
export function institutionalCertificateAreaKey(campusId: string): string {
  return `cert-ia-${campusId}`;
}

/** `areaId` shared by a campus's PQA recognition certificate folders and documents. */
export function pqaCertificateAreaKey(campusId: string): string {
  return `cert-pqa-${campusId}`;
}

export function isCertificateArea(areaId?: string | null): boolean {
  return !!areaId && areaId.startsWith('cert-');
}

/** Display name for a stored status; `Not Accreditable` is shown as `New Program`. */
export function statusLabel(level: string): string {
  return level === 'Not Accreditable' ? 'New Program' : level;
}

/** `Level 2` → `Level II`; non-level statuses are returned as their display label. */
export function formatLevel(level?: AccreditationLevel | null): string {
  if (!level) return 'No recorded level';
  const rank = levelRank(level);
  if (rank && rank >= 1) return `Level ${ROMAN[rank]}`;
  return statusLabel(level);
}

// ================= Expiry =================

export type ExpiryState = 'expired' | 'expiring' | 'active' | 'none';

export interface ExpiryInfo {
  state: ExpiryState;
  endDate: Date | null;
  daysRemaining: number | null;
}

export function getExpiryInfo(p: Pick<ProgramAccreditation, 'validityEnd'>, now: Date = new Date()): ExpiryInfo {
  const endDate = parseAccreditationDate(p.validityEnd);
  if (!endDate) return { state: 'none', endDate: null, daysRemaining: null };

  const today = startOfDay(now);
  const windowEnd = addMonths(today, expiringWindowMonths());
  const daysRemaining = Math.round((startOfDay(endDate).getTime() - today.getTime()) / DAY_MS);

  let state: ExpiryState = 'active';
  if (endDate < today) state = 'expired';
  else if (endDate <= windowEnd) state = 'expiring';

  return { state, endDate, daysRemaining };
}

export function describeDaysRemaining(info: ExpiryInfo): string {
  if (info.daysRemaining === null) return '—';
  if (info.daysRemaining < 0) return `Expired ${Math.abs(info.daysRemaining)} day(s) ago`;
  if (info.daysRemaining === 0) return 'Expires today';
  if (info.daysRemaining < 60) return `${info.daysRemaining} day(s) left`;
  return `${Math.round(info.daysRemaining / 30.44)} month(s) left`;
}

/** Suggested preparation for a program whose validity is lapsing or has lapsed. */
export function getRenewalAction(p: ProgramAccreditation): string {
  const history = getLevelHistory(p);
  const latest = history[history.length - 1];
  if (latest?.result === 'Failed') return 'Appeal / Re-survey';

  const rank = levelRank(p.status);
  if (rank === null) return 'Accreditation Proposal';
  if (rank === 0) return 'Proposal for Level I Survey';
  if (rank >= 4) return 'Renewal of Level IV';
  return `Renewal / Level ${ROMAN[rank + 1]} Proposal`;
}

// ================= Level history =================

function historyYearFrom(p: Pick<ProgramAccreditation, 'validityStart'>): number | null {
  return parseAccreditationDate(p.validityStart)?.getFullYear() ?? null;
}

function newHistoryId(): string {
  return `lh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function compareEntries(a: ProgramLevelHistoryEntry, b: ProgramLevelHistoryEntry): number {
  if (a.year !== b.year) return a.year - b.year;
  const da = parseAccreditationDate(a.surveyDate || a.validityStart)?.getTime() ?? 0;
  const db = parseAccreditationDate(b.surveyDate || b.validityStart)?.getTime() ?? 0;
  if (da !== db) return da - db;
  return a.recordedAt.localeCompare(b.recordedAt);
}

export function getLevelHistory(p: ProgramAccreditation): ProgramLevelHistoryEntry[] {
  return [...(p.levelHistory || [])].sort(compareEntries);
}

/** Initial history entry derived from the program's current level and validity start year. */
export function buildBaselineEntry(p: ProgramAccreditation, fallbackYear?: number): ProgramLevelHistoryEntry | null {
  if (levelRank(p.status) === null) return null;
  const year = historyYearFrom(p) ?? fallbackYear;
  if (!year) return null;
  return {
    id: newHistoryId(),
    year,
    level: p.status,
    result: 'Passed',
    validityStart: p.validityStart || undefined,
    validityEnd: p.validityEnd || undefined,
    boardAction: p.boardAction,
    remarks: 'Initial record from accreditation registry',
    recordedAt: new Date().toISOString(),
    recordedBy: 'System'
  };
}

const LEGACY_STATUS_MAP: Record<string, AccreditationLevel> = {
  'Candidate for Graduation': 'Candidate'
};

/** Maps statuses that are no longer offered (stored in older records) onto the current status list. */
export function normalizeLegacyStatus(p: ProgramAccreditation): ProgramAccreditation {
  const mapLevel = (level: AccreditationLevel) => LEGACY_STATUS_MAP[level as string] ?? level;
  const status = mapLevel(p.status);
  const historyChanged = (p.levelHistory || []).some((e) => mapLevel(e.level) !== e.level);
  if (status === p.status && !historyChanged) return p;
  return {
    ...p,
    status,
    levelHistory: historyChanged ? p.levelHistory?.map((e) => ({ ...e, level: mapLevel(e.level) })) : p.levelHistory
  };
}

export function ensureLevelHistory(p: ProgramAccreditation): ProgramAccreditation {
  if (p.levelHistory) return p;
  const baseline = buildBaselineEntry(p);
  return { ...p, levelHistory: baseline ? [baseline] : [] };
}

/** Appends a history entry whenever a save moves the program to a different ranked level. */
export function applyLevelChange(
  next: ProgramAccreditation,
  previous: ProgramAccreditation | undefined,
  recordedBy: string
): ProgramAccreditation {
  const currentYear = new Date().getFullYear();

  if (!previous) {
    if (next.levelHistory && next.levelHistory.length > 0) return next;
    const baseline = buildBaselineEntry(next, currentYear);
    return { ...next, levelHistory: baseline ? [{ ...baseline, recordedBy, remarks: 'Program registered' }] : [] };
  }

  const history = next.levelHistory ?? previous.levelHistory ?? [];
  if (previous.status === next.status || levelRank(next.status) === null) {
    return { ...next, levelHistory: history };
  }

  const year = historyYearFrom(next) ?? currentYear;
  if (history.some((e) => e.year === year && e.level === next.status)) {
    return { ...next, levelHistory: history };
  }

  const entry: ProgramLevelHistoryEntry = {
    id: newHistoryId(),
    year,
    level: next.status,
    result: 'Passed',
    validityStart: next.validityStart || undefined,
    validityEnd: next.validityEnd || undefined,
    boardAction: next.boardAction,
    remarks: `Status updated from ${previous.status}`,
    recordedAt: new Date().toISOString(),
    recordedBy
  };
  return { ...next, levelHistory: [...history, entry] };
}

export function createHistoryEntry(
  fields: Pick<ProgramLevelHistoryEntry, 'year' | 'level' | 'result'> & Partial<ProgramLevelHistoryEntry>,
  recordedBy: string
): ProgramLevelHistoryEntry {
  return { ...fields, id: newHistoryId(), recordedAt: new Date().toISOString(), recordedBy };
}

/** Highest-confidence level held at the end of `year`: the latest passed, ranked entry on or before it. */
export function levelAsOf(p: ProgramAccreditation, year: number): AccreditationLevel | null {
  let level: AccreditationLevel | null = null;
  for (const e of getLevelHistory(p)) {
    if (e.year > year) break;
    if (e.result === 'Passed' && levelRank(e.level) !== null) level = e.level;
  }
  return level;
}

export type ChangeDirection = 'up' | 'down' | 'same' | 'initial';

export interface LevelResultRow {
  program: ProgramAccreditation;
  entry: ProgramLevelHistoryEntry;
  previousLevel: AccreditationLevel | null;
  direction: ChangeDirection;
}

/** Every recorded survey result, each paired with the level the program held before it. */
export function getResultRows(programs: ProgramAccreditation[], years?: number[]): LevelResultRow[] {
  const rows: LevelResultRow[] = [];
  for (const program of programs) {
    let held: AccreditationLevel | null = null;
    for (const entry of getLevelHistory(program)) {
      const prevRank = levelRank(held);
      const nextRank = levelRank(entry.level);
      let direction: ChangeDirection = 'same';
      if (held === null) direction = 'initial';
      else if (prevRank !== null && nextRank !== null && entry.result === 'Passed') {
        direction = nextRank > prevRank ? 'up' : nextRank < prevRank ? 'down' : 'same';
      }
      if (!years || years.includes(entry.year)) {
        rows.push({ program, entry, previousLevel: held, direction });
      }
      if (entry.result === 'Passed' && nextRank !== null) held = entry.level;
    }
  }
  return rows.sort((a, b) => b.entry.year - a.entry.year || a.program.programName.localeCompare(b.program.programName));
}

export interface LevelImprovement {
  program: ProgramAccreditation;
  fromLevel: AccreditationLevel;
  toLevel: AccreditationLevel;
  yearAchieved: number;
}

export interface YearComparison {
  fromYear: number;
  toYear: number;
  improved: LevelImprovement[];
  firstRecorded: { program: ProgramAccreditation; level: AccreditationLevel; year: number }[];
  declined: LevelImprovement[];
  unchanged: number;
}

export function compareYears(programs: ProgramAccreditation[], fromYear: number, toYear: number): YearComparison {
  const result: YearComparison = { fromYear, toYear, improved: [], firstRecorded: [], declined: [], unchanged: 0 };

  for (const program of programs) {
    const from = levelAsOf(program, fromYear);
    const to = levelAsOf(program, toYear);
    if (!to) continue;

    const achievedEntry = getLevelHistory(program).find(
      (e) => e.year > fromYear && e.year <= toYear && e.result === 'Passed' && e.level === to
    );

    if (!from) {
      if (achievedEntry) result.firstRecorded.push({ program, level: to, year: achievedEntry.year });
      continue;
    }

    const fromRank = levelRank(from) ?? 0;
    const toRank = levelRank(to) ?? 0;
    const change = { program, fromLevel: from, toLevel: to, yearAchieved: achievedEntry?.year ?? toYear };
    if (toRank > fromRank) result.improved.push(change);
    else if (toRank < fromRank) result.declined.push(change);
    else result.unchanged += 1;
  }

  result.improved.sort((a, b) => a.program.programName.localeCompare(b.program.programName));
  return result;
}

export type LevelDistribution = Record<'Level 4' | 'Level 3' | 'Level 2' | 'Level 1' | 'Candidate' | 'none', number>;

export function levelDistribution(programs: ProgramAccreditation[], year: number): LevelDistribution {
  const dist: LevelDistribution = { 'Level 4': 0, 'Level 3': 0, 'Level 2': 0, 'Level 1': 0, Candidate: 0, none: 0 };
  for (const p of programs) {
    const level = levelAsOf(p, year);
    const rank = levelRank(level);
    if (rank === null) dist.none += 1;
    else if (rank === 0) dist.Candidate += 1;
    else dist[`Level ${rank}` as 'Level 1'] += 1;
  }
  return dist;
}

export function accreditedCount(dist: LevelDistribution): number {
  return dist['Level 1'] + dist['Level 2'] + dist['Level 3'] + dist['Level 4'];
}

/** Programs whose validity ends, or whose survey is scheduled, on or before the end of `year`. */
export function programsDueBy(programs: ProgramAccreditation[], year: number) {
  const cutoff = new Date(year, 11, 31);
  return programs
    .map((program) => {
      const validityEnd = parseAccreditationDate(program.validityEnd);
      const schedule = parseAccreditationDate(program.scheduleForAccreditation);
      return { program, validityEnd, schedule };
    })
    .filter(({ validityEnd, schedule }) => (validityEnd && validityEnd <= cutoff) || (schedule && schedule <= cutoff))
    .sort((a, b) => (a.validityEnd?.getTime() ?? Infinity) - (b.validityEnd?.getTime() ?? Infinity));
}

const MAX_YEAR_COLUMNS = 6;

export function yearRange(from: number, to: number): number[] {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const years: number[] = [];
  for (let y = start; y <= end && years.length < MAX_YEAR_COLUMNS; y++) years.push(y);
  return years;
}

export function reportYearOptions(programs: ProgramAccreditation[], now: Date = new Date()): number[] {
  const current = now.getFullYear();
  let min = current - 5;
  for (const p of programs) {
    for (const e of p.levelHistory || []) min = Math.min(min, e.year);
  }
  const max = Math.max(current + 2, 2027);
  const years: number[] = [];
  for (let y = max; y >= min; y--) years.push(y);
  return years;
}

export const RESULT_OPTIONS: AccreditationResult[] = ['Passed', 'Failed', 'Pending'];
