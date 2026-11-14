/**
 * Controlled CHUNK 10 publishing workflow fixtures.
 * Does not write to localStorage, IndexedDB, or the live repository.
 */

function normalize(doc) {
  return {
    ...doc,
    isPubliclyPublished: doc.isPubliclyPublished ?? false,
    publicPublishedAt: doc.publicPublishedAt ?? null
  };
}

function eligible(doc) {
  const d = normalize(doc);
  return (
    d.confidentiality === 'Public' &&
    (d.approvalStatus ?? 'Pending Review') === 'Approved' &&
    d.status !== 'Archived' &&
    d.isPubliclyPublished === true
  );
}

function publish(doc, at = '2024-08-01T10:00:00.000Z') {
  return normalize({ ...doc, isPubliclyPublished: true, publicPublishedAt: at });
}

function unpublish(doc) {
  return normalize({ ...doc, isPubliclyPublished: false, publicPublishedAt: null });
}

const draft = {
  id: 'workflow-1',
  title: 'Faculty Development Manual',
  areaId: 'faculty',
  program: 'BS Information Technology',
  docType: 'Manual',
  confidentiality: 'Internal',
  status: 'Indexed',
  approvalStatus: 'Pending Review',
  isPubliclyPublished: false,
  publicPublishedAt: null
};

const checks = [];
const assert = (name, cond) => checks.push([name, !!cond]);

let doc = { ...draft };
assert('1 starts hidden', !eligible(doc));

doc = { ...doc, confidentiality: 'Public' };
assert('2 public alone still hidden', !eligible(doc));

doc = { ...doc, approvalStatus: 'Approved' };
assert('3 approved public still unpublished', !eligible(doc));

doc = publish(doc);
assert('4 published becomes eligible', eligible(doc));
assert('5 search/browse visibility', eligible(doc));
assert('6 area match', doc.areaId === 'faculty');
assert('7 program match', doc.program === 'BS Information Technology');
assert('8 recent sort key set', Boolean(doc.publicPublishedAt));

const confidential = publish({ ...doc, id: 'x1', confidentiality: 'Confidential' });
const pending = publish({ ...doc, id: 'x2', approvalStatus: 'Pending Review' });
const archived = publish({ ...doc, id: 'x3', status: 'Archived' });
const unpublished = unpublish({ ...doc, id: 'x4' });
assert('9 confidential never public', !eligible(confidential));
assert('10 pending never public', !eligible(pending));
assert('11 archived never public', !eligible(archived));
assert('12 unpublished never public', !eligible(unpublished));

doc = unpublish(doc);
assert('13 unpublish removes eligibility', !eligible(doc));
assert('14 preview/download gate fails after unpublish', !eligible(doc));

for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error(`\n${failed.length} failed`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} publishing workflow checks passed`);
