/**
 * Import Summary of Findings & Recommendation folder → public/certificates/findings
 * + findingsDocumentManifest.ts
 *
 * Usage: node scripts/import-findings.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, '..');
const PUBLIC_FINDINGS = path.join(FRONTEND, 'public', 'certificates', 'findings');
const DATA_DIR = path.join(FRONTEND, 'src', 'data');
const RECORDS_TS = path.join(DATA_DIR, 'programAccreditationRecords.ts');

const SOURCE =
  process.env.AACCUP_FINDINGS_DIR ||
  path.join(
    process.env.USERPROFILE || '',
    'Downloads',
    'Summary of Findings & recommendation-20261122T113136Z-1-001',
    'Summary of Findings & recommendation'
  );

const CAMPUS_FOLDER = {
  'Tandag Campus': 'tandag',
  'Cantilan Campus': 'cantilan',
  'Cagwait Campus': 'cagwait',
  'Lianga Campus': 'lianga',
  'Tagbina Campus': 'tagbina',
  'San Miguel Campus': 'san-miguel',
  'Bislig Campus': 'bislig'
};

/** Filename stem (without extension) → program id */
const FILE_ALIASES = {
  tandag: {
    'AB in Economics': 'pa-tan-08',
    'BA-English Recommendation': 'pa-tan-17',
    'BA-Pol.Scie.-Recommendation': 'pa-tan-10',
    'BAPA-Recommendation': 'pa-tan-19',
    'BS in Civil Engineering': 'pa-tan-11',
    'BS in Computer Science': 'pa-tan-13',
    'BS-FM-Recommendation': 'pa-tan-12',
    'BS-HM': 'pa-tan-09',
    'BS-Mathematics': 'pa-tan-14',
    'BSED-Mathematics Recommendation': 'pa-tan-18'
  },
  cantilan: {
    'BSBA-FM-Recommendation': 'pa-can-05',
    'BSBA-HRDM-Recommendation': 'pa-can-04',
    BSCS: 'pa-can-06',
    'BSHRM-Recommendation': 'pa-can-13',
    'BSIT-Recommendation': 'pa-can-08',
    'BSIT-major Computer Technology,Automotive Technology, Architectural Drafting Technology, Electrical Technology,':
      'pa-can-07'
  },
  cagwait: {
    'BSIT-Recommendation': 'pa-cag-03'
  },
  lianga: {
    'BS-Marine Biology-Recommendation': 'pa-lia-08',
    'BSBA-Economics-Recommendation': 'pa-lia-02',
    'BSBA-FM-Recommendation': 'pa-lia-03'
  },
  tagbina: {
    'BEED-General Educ.-Recommendation': 'pa-tag-03',
    'BSBA-FM-Recommendation': 'pa-tag-05',
    'BSBA-HRDM-Recommendation': 'pa-tag-07',
    'BSCS-Recommendation': 'pa-tag-06',
    'BSED-Biological Science': 'pa-tag-04'
  }
};

const MEDIA_EXT = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.docx']);

function slug(s) {
  return (
    String(s)
      .normalize('NFKD')
      .replace(/[^\w\s.-]+/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 100) || 'file'
  );
}

function parsePrograms(ts) {
  const re =
    /id:\s*['"](pa-[^'"]+)['"][\s\S]*?campusId:\s*['"]([^'"]+)['"][\s\S]*?programName:\s*['"]([^'"]*)['"][\s\S]*?status:\s*['"]([^'"]+)['"]/g;
  const rows = [];
  let m;
  while ((m = re.exec(ts))) {
    rows.push({
      id: m[1],
      campusId: m[2],
      programName: m[3].replace(/\\'/g, "'"),
      status: m[4]
    });
  }
  return rows;
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function resolveProgramId(campusId, stem) {
  const map = FILE_ALIASES[campusId] || {};
  if (Object.prototype.hasOwnProperty.call(map, stem)) return map[stem];
  const key = Object.keys(map).find((k) => k.toLowerCase() === stem.toLowerCase());
  if (key) return map[key];
  // Fuzzy: strip -Recommendation suffix
  const stripped = stem.replace(/\s*-?\s*Recommendation$/i, '').trim();
  if (Object.prototype.hasOwnProperty.call(map, stripped)) return map[stripped];
  const soft = Object.keys(map).find(
    (k) =>
      k.toLowerCase().replace(/\s*-?\s*recommendation$/i, '') === stripped.toLowerCase() ||
      slug(k) === slug(stem) ||
      slug(k).includes(slug(stripped)) ||
      slug(stripped).includes(slug(k))
  );
  return soft ? map[soft] : undefined;
}

function findRoot(source) {
  if (!fs.existsSync(source)) return null;
  if (fs.existsSync(path.join(source, 'Tandag Campus'))) return source;
  const nested = path.join(source, 'Summary of Findings & recommendation');
  if (fs.existsSync(nested)) return nested;
  for (const n of fs.readdirSync(source)) {
    const full = path.join(source, n);
    if (fs.statSync(full).isDirectory() && /finding/i.test(n)) return full;
  }
  return source;
}

function main() {
  const root = findRoot(SOURCE);
  if (!root) throw new Error(`Findings folder not found: ${SOURCE}`);

  const programs = parsePrograms(fs.readFileSync(RECORDS_TS, 'utf8'));
  const byId = new Map(programs.map((p) => [p.id, p]));
  console.log('Programs in records:', programs.length);
  console.log('Findings root:', root);

  if (fs.existsSync(PUBLIC_FINDINGS)) fs.rmSync(PUBLIC_FINDINGS, { recursive: true, force: true });
  ensureDir(PUBLIC_FINDINGS);

  /** @type {Record<string, Array<{ path: string, fileName: string }>>} */
  const manifest = {};
  let copied = 0;
  let unmatched = 0;

  for (const [folderName, campusId] of Object.entries(CAMPUS_FOLDER)) {
    const campusPath = path.join(root, folderName);
    if (!fs.existsSync(campusPath)) continue;

    for (const entry of fs.readdirSync(campusPath, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!MEDIA_EXT.has(ext)) continue;
      const stem = path.parse(entry.name).name;
      const programId = resolveProgramId(campusId, stem);
      if (!programId) {
        unmatched += 1;
        console.warn(`Unmatched: ${campusId}/${entry.name}`);
        continue;
      }
      if (!byId.has(programId)) {
        console.warn('Alias points to missing id', programId, entry.name);
        continue;
      }

      const destRel = path.posix.join(
        'certificates',
        'findings',
        campusId,
        slug(stem) + ext
      );
      let destAbs = path.join(FRONTEND, 'public', destRel.replace(/\//g, path.sep));
      let finalRel = destRel;
      let n = 2;
      while (fs.existsSync(destAbs)) {
        const p = path.parse(destAbs);
        destAbs = path.join(p.dir, `${p.name}-${n}${p.ext}`);
        finalRel = path.posix.join(
          path.posix.dirname(destRel),
          `${path.parse(destRel).name}-${n}${path.extname(destRel)}`
        );
        n += 1;
      }
      ensureDir(path.dirname(destAbs));
      fs.copyFileSync(path.join(campusPath, entry.name), destAbs);
      copied += 1;
      if (!manifest[programId]) manifest[programId] = [];
      manifest[programId].push({
        path: '/' + finalRel.replace(/\\/g, '/'),
        fileName: entry.name
      });
    }
  }

  const outPath = path.join(DATA_DIR, 'findingsDocumentManifest.ts');
  const body = `/** Auto-generated by scripts/import-findings.mjs — do not edit by hand. */\n/** programId → Summary of Findings & Recommendation files */\nexport type FindingsDocEntry = { path: string; fileName: string };\nexport const findingsDocumentManifest = ${JSON.stringify(manifest, null, 2)} as const;\n`;
  fs.writeFileSync(outPath, body, 'utf8');
  console.log(`Findings: copied ${copied} files for ${Object.keys(manifest).length} programs (unmatched: ${unmatched})`);
  console.log('Wrote', path.relative(FRONTEND, outPath));
  console.log('Done.');
}

main();
