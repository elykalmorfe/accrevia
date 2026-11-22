import { programAccreditationRecords } from './programAccreditationRecords';

/** Types the portal assigns when a file is stored. The other catalog labels are optional edit choices. */
export const documentTypeSearchOptions = ['Report', 'Certificate', 'Statistical Report', 'Other'] as const;

/** Values the portal writes on institutional evidence, ahead of the degree catalog. */
const institutionalPrograms = ['Institutional Portfolio', 'Institution-wide'];

function catalogPrograms(): string[] {
  const names = new Set<string>();
  for (const record of programAccreditationRecords) {
    const name = record.programName.trim();
    if (name) names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'en'));
}

const catalog = catalogPrograms();

/** Exact program parameter: institutional filings, then each AACCUP program name once. */
export const programSearchOptions: readonly string[] = [
  ...institutionalPrograms.filter((name) => !catalog.includes(name)),
  ...catalog
];
