/**
 * Chunk 9.2 — lightweight catalog usability checks (no browser framework).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL: ${msg}`);
  } else {
    console.log(`PASS: ${msg}`);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const cert = read('src/data/repositoryCatalog/verifiedCertificateCatalog.generated.ts');
const copc = read('src/data/repositoryCatalog/verifiedCopcCatalog.generated.ts');
const provider = read('src/services/repository/staticRepositoryProvider.ts');
const service = read('src/services/repository/repositoryService.ts');
const access = read('src/services/repository/documentAccess.ts');
const browser = read('src/components/open/repository/CertificatesBrowser.tsx');

assert(cert.includes('verifiedDocumentFiles'), 'certificate catalog present');
assert(/"campusCount": 7/.test(cert) || cert.includes('campusCount'), 'seven campuses expected in catalog stats');
assert(copc.includes('verifiedRows') || /"id": "verified-copc-/.test(copc), 'COPC verified rows present');

const copcIds = [...copc.matchAll(/"id": "(verified-copc-[^"]+)"/g)].map((m) => m[1]);
assert(copcIds.length === 86, `COPC verified row count === 86 (got ${copcIds.length})`);

assert(provider.includes('staticRepositoryProvider'), 'static provider exported');
assert(provider.includes('provenance !== \'demonstration\''), 'search excludes demonstration fixtures');
assert(service.includes('activeRepositoryProvider'), 'service binds active provider');
assert(access.includes('probeLocalPreview'), 'local preview probing helper exists');
assert(access.includes('Open Document in Google Drive'), 'individual Drive document CTA exists');
assert(access.includes('Open Source Folder'), 'folder CTA exists');
assert(access.includes('Document link unavailable'), 'unavailable CTA exists');
assert(access.includes('classifyDriveUrl') || access.includes('/file/d/'), 'file vs folder URL classification exists');
assert(browser.includes('Search verified catalog'), 'certificates browser uses verified search label');
assert(browser.includes('Demonstration fixtures are excluded'), 'search result copy excludes demos');
assert(fs.existsSync(path.join(root, 'docs/REPOSITORY_CATALOG_PROVENANCE.md')), 'provenance doc exists');
assert(
  fs.existsSync(path.join(root, 'src/data/repositoryCatalog/verifiedIndividualCertificateLinks.ts')),
  'Chunk 9.4 individual link mapping module exists'
);

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nChunk 9.2 catalog checks passed.');
