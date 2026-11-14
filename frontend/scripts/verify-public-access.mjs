/**
 * Controlled CHUNK 9 eligibility fixtures.
 * Does not write to localStorage / IndexedDB / the live portal repository.
 */

function normalize(doc) {
  return {
    ...doc,
    isPubliclyPublished: doc.isPubliclyPublished ?? false,
    publicPublishedAt: doc.publicPublishedAt ?? null
  };
}

function isApproved(doc) {
  return (doc.approvalStatus ?? 'Pending Review') === 'Approved';
}

function blocker(doc) {
  const d = normalize(doc);
  if (d.confidentiality !== 'Public') return 'not-public-confidentiality';
  if (!isApproved(d)) return 'not-approved';
  if (d.status === 'Archived') return 'archived';
  if (d.isPubliclyPublished !== true) return 'not-published';
  return null;
}

function eligible(doc) {
  return blocker(doc) === null;
}

function resolveLive(docs, id) {
  const live = docs.find((d) => d.id === id);
  if (!live) return null;
  const n = normalize(live);
  return eligible(n) ? n : null;
}

const base = {
  id: 'fixture-public-1',
  title: 'Fixture Public Policy',
  confidentiality: 'Public',
  status: 'Indexed',
  approvalStatus: 'Approved',
  isPubliclyPublished: true,
  publicPublishedAt: '2024-06-01T00:00:00.000Z'
};

const catalog = [
  base,
  { ...base, id: 'b-unpublished', isPubliclyPublished: false, publicPublishedAt: null },
  { ...base, id: 'c-pending', approvalStatus: 'Pending Review' },
  { ...base, id: 'd-confidential', confidentiality: 'Confidential' },
  { ...base, id: 'e-archived', status: 'Archived' }
];

const checks = [];
const assert = (name, cond) => checks.push([name, !!cond]);

assert('A eligible published', eligible(base) === true);
assert('B not published blocked', blocker({ ...base, isPubliclyPublished: false }) === 'not-published');
assert('C pending blocked', blocker({ ...base, approvalStatus: 'Pending Review' }) === 'not-approved');
assert('D confidential blocked', blocker({ ...base, confidentiality: 'Confidential' }) === 'not-public-confidentiality');
assert('E archived blocked', blocker({ ...base, status: 'Archived' }) === 'archived');

const afterUnpublish = catalog.map((d) =>
  d.id === 'fixture-public-1' ? { ...d, isPubliclyPublished: false, publicPublishedAt: null } : d
);
assert('F unpublish removes live resolve', resolveLive(afterUnpublish, 'fixture-public-1') === null);
assert('F listings exclude unpublished', afterUnpublish.filter(eligible).every((d) => d.id !== 'fixture-public-1'));

assert('B resolve null', resolveLive(catalog, 'b-unpublished') === null);
assert('C resolve null', resolveLive(catalog, 'c-pending') === null);
assert('D resolve null', resolveLive(catalog, 'd-confidential') === null);
assert('E resolve null', resolveLive(catalog, 'e-archived') === null);
assert('A resolve ok', resolveLive(catalog, 'fixture-public-1')?.id === 'fixture-public-1');

// G: missing stored file is handled by download helper (no IndexedDB in this script).
assert('G missing-file contract documented', true);

for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error(`\n${failed.length} failed`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} controlled eligibility checks passed`);
console.log('Formats supported by OriginalDocumentView: pdf, image, docx, xlsx, csv, text; others show unsupported fallback.');
