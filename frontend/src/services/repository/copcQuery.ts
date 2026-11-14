import type {
  CopcLocalFilters,
  CopcRecordRow,
  CopcSortDirection,
  CopcSortKey,
  CopcSummaryStats
} from '../../types/accreditationRepository';

export const COPC_PAGE_SIZE = 10;

export function summarizeCopcRecords(records: CopcRecordRow[]): CopcSummaryStats {
  const campuses = new Set<string>();
  const programs = new Set<string>();
  const years = new Set<string>();
  for (const row of records) {
    if (row.campus) campuses.add(row.campus);
    if (row.program) programs.add(row.program);
    if (row.academicYear) years.add(row.academicYear);
  }
  return {
    totalRecords: records.length,
    campusCount: campuses.size,
    programCount: programs.size,
    academicYearCount: years.size
  };
}

export function uniqueSorted(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function filterCopcRecords(records: CopcRecordRow[], filters: CopcLocalFilters): CopcRecordRow[] {
  const q = filters.query.trim().toLowerCase();
  return records.filter((row) => {
    if (filters.campus && row.campus !== filters.campus) return false;
    if (filters.academicYear && row.academicYear !== filters.academicYear) return false;
    if (filters.college && row.college !== filters.college) return false;
    if (!q) return true;
    return [
      row.campus,
      row.college,
      row.program,
      row.academicYear,
      row.certificateNumber,
      row.sampleNote,
      row.sheetLabel,
      row.complianceNote
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q);
  });
}

export function sortCopcRecords(
  records: CopcRecordRow[],
  sortKey: CopcSortKey,
  direction: CopcSortDirection
): CopcRecordRow[] {
  const factor = direction === 'asc' ? 1 : -1;
  return records.slice().sort((a, b) => {
    const av = (a[sortKey] ?? '').toString();
    const bv = (b[sortKey] ?? '').toString();
    const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
    if (cmp !== 0) return cmp * factor;
    return (a.program ?? '').localeCompare(b.program ?? '') * factor;
  });
}

export function paginateCopcRecords<T>(rows: T[], page: number, pageSize = COPC_PAGE_SIZE) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    total,
    pageSize,
    rows: rows.slice(start, start + pageSize)
  };
}
