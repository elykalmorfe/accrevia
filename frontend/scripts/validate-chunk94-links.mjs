/**
 * Chunk 9.4 — verified individual certificate link mapping checks.
 * Ensures no fabricated Drive file IDs, no TR leaks, no conflicting mappings,
 * and that catalog counts remain unchanged while document actions still exist.
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

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, out);
    } else if (/\.(ts|tsx|js|jsx|mjs|md|json)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

const mappingPath = 'src/data/repositoryCatalog/verifiedIndividualCertificateLinks.ts';
const mapping = read(mappingPath);
const cert = read('src/data/repositoryCatalog/verifiedCertificateCatalog.generated.ts');
const copc = read('src/data/repositoryCatalog/verifiedCopcCatalog.generated.ts');
const access = read('src/services/repository/documentAccess.ts');
const meta = read('src/services/repository/documentMeta.ts');
const provenance = read('docs/REPOSITORY_CATALOG_PROVENANCE.md');

assert(fs.existsSync(path.join(root, mappingPath)), 'individual link mapping module exists');
assert(mapping.includes('verifiedIndividualCertificateLinkMappings'), 'mappings export exists');
assert(mapping.includes('publicationApprovalStatus'), 'publication approval field exists');
assert(mapping.includes('catalogRecordId'), 'catalogRecordId field exists');
assert(mapping.includes('applyApprovedDriveFileLink'), 'apply helper exists');
assert(mapping.includes('validateIndividualLinkMappings'), 'mapping validator helper exists');
assert(meta.includes('applyApprovedDriveFileLink'), 'enrichDocument applies approved mappings');

assert(access.includes('Open Document in Google Drive'), 'individual Drive document CTA preserved');
assert(access.includes('Open Source Folder'), 'folder CTA preserved');
assert(access.includes('Document link unavailable'), 'unavailable CTA preserved');
assert(access.includes('probeLocalPreview'), 'local preview probing preserved');

const catalogDocIds = [
  ...cert.matchAll(/"id": "(verified-(?:doc|root-file)-[^"]+)"/g)
].map((m) => m[1]);
const uniqueCatalogIds = new Set(catalogDocIds);
assert(
  uniqueCatalogIds.size === 154,
  `verified certificate document count unchanged === 154 (got ${uniqueCatalogIds.size})`
);

const copcIds = [...copc.matchAll(/"id": "(verified-copc-[^"]+)"/g)].map((m) => m[1]);
assert(copcIds.length === 86, `COPC verified row count unchanged === 86 (got ${copcIds.length})`);

// Extract object literals from the mappings array (empty is valid).
const arrayBodyMatch = mapping.match(
  /verifiedIndividualCertificateLinkMappings[^=]*=\s*(?:readonly\s*)?\[[\s\S]*?\];/
);
assert(Boolean(arrayBodyMatch), 'mappings array declaration found');

const fileUrlMatches = [...mapping.matchAll(/https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+/g)];
const folderAsFile = [...mapping.matchAll(/driveFileUrl:\s*['"][^'"]*\/folders\//g)];
assert(folderAsFile.length === 0, 'no folder URLs used as driveFileUrl');

// When empty, file URL count in mapping module comments/docs may be 0.
const mappingEntries = [...mapping.matchAll(/catalogRecordId:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
assert(
  mappingEntries.length === fileUrlMatches.length || mappingEntries.length === 0,
  'each mapping entry has a corresponding Drive file URL (or mappings are empty)'
);

const seen = new Set();
let duplicate = false;
for (const id of mappingEntries) {
  if (seen.has(id)) duplicate = true;
  seen.add(id);
  assert(uniqueCatalogIds.has(id), `mapping catalogRecordId exists in catalog: ${id}`);
}
assert(!duplicate, 'no duplicate catalogRecordId mappings');

const approvedCount = [...mapping.matchAll(/publicationApprovalStatus:\s*['"]approved['"]/g)].length;

// Chunk 9.4 blocker expectation: structure only until approvals arrive.
assert(
  mappingEntries.length === 0 && approvedCount === 0,
  `no fabricated / unapproved-filled mappings (entries=${mappingEntries.length}, approved=${approvedCount})`
);

const restrictedTrId = '1IFJwa5fvhXKrnc1nIWPS5kyuOWJCvQ8X';
assert(!mapping.includes(restrictedTrId), 'mapping module has no restricted TR folder ID');
assert(!cert.includes(restrictedTrId), 'certificate catalog has no restricted TR folder ID');

const srcFiles = walk(path.join(root, 'src'));
const leaks = srcFiles.filter((f) => fs.readFileSync(f, 'utf8').includes(restrictedTrId));
assert(leaks.length === 0, 'restricted TR folder ID absent from frontend src');

assert(provenance.includes('Publication-approved file URL'), 'provenance distinguishes publication-approved URLs');
assert(provenance.includes('Folder-only reference'), 'provenance distinguishes folder-only references');
assert(provenance.includes('Metadata-only record'), 'provenance distinguishes metadata-only records');
assert(
  provenance.includes('verifiedIndividualCertificateLinks'),
  'provenance documents the individual link mapping module'
);

// Coverage summary from catalog text (folder-only today).
const externalFolders = [...cert.matchAll(/"externalUrl": "https:\/\/drive\.google\.com\/drive\/folders\//g)]
  .length;
const localCandidates = [...cert.matchAll(/"localPreviewUrl":/g)].length;
const driveFileFields = [...cert.matchAll(/"driveFileUrl":/g)].length;
assert(driveFileFields === 0, 'generated catalog does not invent driveFileUrl fields');
assert(externalFolders > 0, `folder references present on catalog rows (got ${externalFolders})`);

console.log('\nChunk 9.4 coverage snapshot (catalog + empty approved mappings):');
console.log(`  approved individual file links: ${approvedCount}`);
console.log(`  folder URL fields on catalog rows: ${externalFolders}`);
console.log(`  localPreviewUrl candidates: ${localCandidates}`);
console.log(`  verified document IDs: ${uniqueCatalogIds.size}`);
console.log('  metadata-only (no folder, no approved file, no local): 0 expected for AACCUP verified rows');
console.log('  BLOCKER: publication-approved individual URLs not supplied — mapping left empty.');

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nChunk 9.4 individual link checks passed.');
