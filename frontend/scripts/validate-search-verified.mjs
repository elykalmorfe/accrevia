/**
 * Validates verified catalog search wiring after the Document Search debug fix.
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

const searchMod = read('src/services/repository/verifiedCatalogSearch.ts');
const openSearch = read('src/pages/open/OpenSearch.tsx');
const provider = read('src/services/repository/staticRepositoryProvider.ts');
const globalSearch = read('src/components/layout/GlobalSearch.tsx');
const searchResults = read('src/pages/SearchResults.tsx');
const cert = read('src/data/repositoryCatalog/verifiedCertificateCatalog.generated.ts');
const copc = read('src/data/repositoryCatalog/verifiedCopcCatalog.generated.ts');

assert(searchMod.includes('searchVerifiedCatalog'), 'verified catalog search helper exists');
assert(searchMod.includes('matchesCampusFilter'), 'campus filter matcher exists');
// Faculty/Staff OpenSearch must NOT assume verified catalog rows are publicly authorized.
assert(
  !openSearch.includes('searchVerifiedCatalog'),
  'Faculty OpenSearch does not expose unverified-authorization catalog rows'
);
assert(openSearch.includes('facultyAccessVisibility'), 'Faculty OpenSearch uses access-visibility classification');
assert(openSearch.includes('searchDemoDocuments'), 'Faculty OpenSearch includes labeled demonstration documents');
assert(!openSearch.includes('usePublicDocuments'), 'OpenSearch no longer depends only on public evidence docs');
assert(provider.includes('matchesCampusFilter'), 'repository provider uses campus matcher');
assert(globalSearch.includes('searchVerifiedCatalog'), 'GlobalSearch includes verified hits (admin mode)');
assert(globalSearch.includes("portalMode === 'faculty'") || globalSearch.includes('portalMode = \'faculty\'') || globalSearch.includes('isFaculty'), 'GlobalSearch supports Faculty portal mode');
assert(globalSearch.includes('searchDemoDocuments'), 'Faculty GlobalSearch uses demonstration samples instead of unverified catalog');
assert(searchResults.includes('searchVerifiedCatalog'), 'SearchResults includes verified hits');
assert(!searchMod.includes('1IFJwa5fvhXKrnc1nIWPS5kyuOWJCvQ8X'), 'search module has no restricted TR id');

const catalogDocIds = [...cert.matchAll(/"id": "(verified-(?:doc|root-file)-[^"]+)"/g)].map((m) => m[1]);
assert(new Set(catalogDocIds).size === 154, `154 verified certificate docs searchable source (got ${new Set(catalogDocIds).size})`);

const copcIds = [...copc.matchAll(/"id": "(verified-copc-[^"]+)"/g)].map((m) => m[1]);
assert(copcIds.length === 86, `86 verified COPC rows searchable source (got ${copcIds.length})`);

const sampleTitle = 'Certification-across campuses-2023.pdf';
assert(cert.includes(sampleTitle), 'known certificate title present in catalog');

const sampleProgram = [...copc.matchAll(/"program": "([^"]+)"/g)].map((m) => m[1])[0];
assert(Boolean(sampleProgram), `sample COPC program present (${sampleProgram || 'none'})`);

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nVerified search wiring checks passed.');
