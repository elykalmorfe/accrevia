/**
 * Lightweight Chunk 8 validation (no test framework).
 * Checks security boundaries + mock COPC summary math + critical route strings.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');

let failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed += 1;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
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
    } else if (/\.(ts|tsx|js|jsx|mjs|css|json|md)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

// 1) Restricted Technical Review folder ID must not appear in frontend sources
const leakedId = '1IFJwa5fvhXKrnc1nIWPS5kyuOWJCvQ8X';
const files = walk(src);
const leaks = files.filter((f) => fs.readFileSync(f, 'utf8').includes(leakedId));
assert(leaks.length === 0, 'Restricted TR folder ID is not present in frontend src');

// 2) Mock COPC summary counts
const mock = read('src/services/repository/mockRepositoryData.ts');
const campuses = new Set([...mock.matchAll(/campus: '([^']+)'/g)].map((m) => m[1]));
const programs = new Set([...mock.matchAll(/program: '([^']+)'/g)].map((m) => m[1]));
const years = new Set([...mock.matchAll(/academicYear: '([^']+)'/g)].map((m) => m[1]));
const records = [...mock.matchAll(/id: 'sample-copc-/g)].length;
assert(records === 12, `COPC sample records === 12 (got ${records})`);
assert(campuses.size === 7, `COPC campuses === 7 (got ${campuses.size})`);
assert(programs.size === 10, `COPC programs === 10 (got ${programs.size})`);
assert(years.size === 3, `COPC years === 3 (got ${years.size})`);

// 3) Critical routes present
const app = read('src/App.tsx');
for (const route of [
  'path="/open"',
  'path="browse"',
  'path="requests"',
  'path="technical-review-access"',
  'path="/login"',
  'path="/register"'
]) {
  assert(app.includes(route), `App.tsx includes ${route}`);
}

// 4) Handoff document exists
assert(
  fs.existsSync(path.join(root, 'docs/BACKEND_INTEGRATION_HANDOFF.md')),
  'BACKEND_INTEGRATION_HANDOFF.md exists'
);

// 5) Sample COPC sheet labeled as reference in panel
const panel = read('src/components/open/repository/CopcRecordsPanel.tsx');
assert(panel.includes('Sample Google Sheets Reference'), 'COPC panel labels Sheets as sample reference');

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll Chunk 8 handoff checks passed.');
