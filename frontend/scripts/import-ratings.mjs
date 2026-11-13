/**
 * Import AACCUP RATINGS zip → public/certificates/ratings + ratingsDocumentManifest.ts
 *
 * Usage: node scripts/import-ratings.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, '..');
const PUBLIC_RATINGS = path.join(FRONTEND, 'public', 'certificates', 'ratings');
const DATA_DIR = path.join(FRONTEND, 'src', 'data');
const RECORDS_TS = path.join(DATA_DIR, 'programAccreditationRecords.ts');

const ZIP =
  process.env.AACCUP_RATINGS_ZIP ||
  path.join(process.env.USERPROFILE || '', 'Downloads', 'AACCUP RATINGS-20261113T101041Z-1-001.zip');

const CAMPUS_FOLDER = {
  'BISLIG CAMPUS': 'bislig',
  'CAGWAIT CAMPUS': 'cagwait',
  'CANTILAN CAMPUS': 'cantilan',
  'LIANGA CAMPUS': 'lianga',
  'SAN MIGUEL CAMPUS': 'san-miguel',
  'TAGBINA CAMPUS': 'tagbina',
  'TANDAG CAMPUS': 'tandag'
};

/** Ratings zip folder names → program ids */
const ZIP_ALIASES = {
  bislig: {
    BSCE: 'pa-bis-02',
    'BSED-English': 'pa-bis-05',
    BSEE: 'pa-bis-03',
    BSF: 'pa-bis-06',
    BSME: 'pa-bis-04',
    BTVTED: 'pa-bis-01'
  },
  cagwait: {
    'BS information Technology': 'pa-cag-03',
    'BS Information Technology': 'pa-cag-03',
    BSHM: 'pa-cag-01',
    BSIT: 'pa-cag-03'
  },
  cantilan: {
    'BS in Industrial Tech': 'pa-can-07',
    'BS in Information Technology': 'pa-can-08',
    'BS-COMPUTER ENGINEERING': 'pa-can-03',
    'BSBA-FM': 'pa-can-05',
    'BSBA-HRM': 'pa-can-04',
    BSCRIM: 'pa-can-15',
    BSCS: 'pa-can-06',
    'BSED-English': 'pa-can-01',
    'BSED-FILIPINO': 'pa-can-02',
    'BSED-Math': 'pa-can-11',
    'BSED-Science': 'pa-can-09',
    'BSED-TLE': 'pa-can-10',
    BSHM: 'pa-can-13',
    BSTM: 'pa-can-16',
    BTTE: 'pa-can-12',
    MTTE: 'pa-can-14'
  },
  lianga: {
    BEED: 'pa-lia-05',
    'BS Environmental Science': 'pa-lia-09',
    'BS-FISHERIES': 'pa-lia-07',
    'BS-Marine Biology': 'pa-lia-08',
    'BSBA-Bus. Econ': 'pa-lia-02',
    'BSBA-FM': 'pa-lia-03',
    BSCS: 'pa-lia-01',
    'BSED-SCIENCE': 'pa-lia-06',
    BSHM: 'pa-lia-04',
    BSHRM: 'pa-lia-04'
  },
  'san-miguel': {
    BAT: null,
    BSA: 'pa-sm-02',
    BSF: 'pa-sm-03',
    BTLED: 'pa-sm-01'
  },
  tagbina: {
    BAT: 'pa-tag-02',
    'BEED-GE': 'pa-tag-03',
    'BS-Agri. Tech': 'pa-tag-02',
    'BSBA-FM': 'pa-tag-05',
    'BSBA-HRM': 'pa-tag-07',
    BSCS: 'pa-tag-06',
    'BSED-Science': 'pa-tag-04',
    BSHM: 'pa-tag-01'
  },
  tandag: {
    'BA-Economics': 'pa-tan-08',
    'BA-English Language': 'pa-tan-17',
    'BA-Political Science': 'pa-tan-10',
    'Batsilyer sa Sining ng Filipino': 'pa-tan-03',
    'BS Environmental Science': 'pa-tan-02',
    'BS-Biology': 'pa-tan-04',
    'BS-Mathematics': 'pa-tan-14',
    BPA: 'pa-tan-19',
    'BSBA-FM': 'pa-tan-12',
    'BSBA-HRM': 'pa-tan-06',
    'BSBA-MM': 'pa-tan-07',
    BSHM: 'pa-tan-09',
    // CET / CITE year folders map at college level below
    BECED: 'pa-tan-05',
    BEED: 'pa-tan-15',
    BPED: 'pa-tan-01',
    'BSED-English,Filipino&Science': 'pa-tan-16',
    'BSED-Math': 'pa-tan-18',
    'EdD-ELT': 'pa-tan-g03',
    'EdD-EM': 'pa-tan-g02',
    MAED: 'pa-tan-g07',
    MAELT: 'pa-tan-g08',
    MAFLT: 'pa-tan-g09',
    MAHET: 'pa-tan-g10',
    MASST: 'pa-tan-g13',
    MBA: 'pa-tan-g04',
    MPA: 'pa-tan-g14',
    MSCS: 'pa-tan-g06',
    'MST-Math': 'pa-tan-g11',
    MSTS: 'pa-tan-g12',
    'PhD-Math': 'pa-tan-g01',
    'PhD-Scie.Ed': 'pa-tan-g05'
  }
};

/** College folders that are actually a single program with year periods as children */
const COLLEGE_PROGRAM = {
  tandag: {
    CET: 'pa-tan-11',
    CITE: 'pa-tan-13'
  }
};

const MEDIA_EXT = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.docx']);
const SKIP_EXT = new Set(['.zip', '.rar', '.7z']);

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
      .slice(0, 80) || 'file'
  );
}

function isPeriodFolder(name) {
  return /^\d{4}\s*[-–]\s*\d{4}$/.test(String(name).trim());
}

function normalizePeriod(name) {
  const m = String(name)
    .trim()
    .match(/(\d{4})\s*[-–]\s*(\d{4})/);
  return m ? `${m[1]}-${m[2]}` : String(name).trim();
}

function parsePrograms(ts) {
  const re =
    /id: '(pa-[^']+)'[\s\S]*?campusId: '([^']+)'[\s\S]*?programName: '([^']*(?:\\'[^']*)*)'[\s\S]*?status: '([^']+)'/g;
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

function copyFileSafe(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function extractZip(zipPath, destDir) {
  ensureDir(destDir);
  const ps = `
$ErrorActionPreference = 'Stop'
$zip = ${JSON.stringify(zipPath)}
$dest = ${JSON.stringify(destDir)}
if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
New-Item -ItemType Directory -Path $dest | Out-Null
Expand-Archive -LiteralPath $zip -DestinationPath $dest -Force
`;
  const tmpPs1 = path.join(FRONTEND, 'scripts', '_extract-ratings.ps1');
  fs.writeFileSync(tmpPs1, ps, 'utf8');
  try {
    execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tmpPs1], {
      stdio: 'inherit'
    });
  } finally {
    try {
      fs.unlinkSync(tmpPs1);
    } catch {
      /* ignore */
    }
  }
}

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function findRoot(extractRoot) {
  const direct = path.join(extractRoot, 'AACCUP RATINGS');
  if (fs.existsSync(direct)) return direct;
  for (const n of fs.readdirSync(extractRoot)) {
    const full = path.join(extractRoot, n);
    if (fs.statSync(full).isDirectory() && /rating/i.test(n)) return full;
  }
  return extractRoot;
}

function resolveProgramId(campusId, folderName) {
  const map = ZIP_ALIASES[campusId] || {};
  if (Object.prototype.hasOwnProperty.call(map, folderName)) return map[folderName];
  const key = Object.keys(map).find((k) => k.toLowerCase() === folderName.toLowerCase());
  if (key) return map[key];
  return undefined;
}

function collectMedia(dir) {
  return walkFiles(dir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return MEDIA_EXT.has(ext) && !SKIP_EXT.has(ext);
  });
}

function addEntry(manifest, programId, period, src, progFolder) {
  const periodSlug = slug(period);
  const destRel = path.posix.join(
    'certificates',
    'ratings',
    slug(programId.split('-')[1] || 'campus'), // placeholder overwritten below
    slug(progFolder),
    periodSlug,
    slug(path.parse(src).name) + path.extname(src).toLowerCase()
  );
  return { period, src, progFolder, periodSlug };
}

function copyToPublic(campusId, progFolder, period, src, manifest, programId) {
  const periodSlug = slug(period);
  let destRel = path.posix.join(
    'certificates',
    'ratings',
    campusId,
    slug(progFolder),
    periodSlug,
    slug(path.parse(src).name) + path.extname(src).toLowerCase()
  );
  let destAbs = path.join(FRONTEND, 'public', destRel.replace(/\//g, path.sep));
  let n = 2;
  while (fs.existsSync(destAbs)) {
    const p = path.parse(destAbs);
    destAbs = path.join(p.dir, `${p.name}-${n}${p.ext}`);
    destRel = path.posix.join(path.posix.dirname(destRel), `${path.parse(destRel).name}-${n}${path.extname(destRel)}`);
    n += 1;
  }
  copyFileSafe(src, destAbs);
  if (!manifest[programId]) manifest[programId] = [];
  manifest[programId].push({
    period: normalizePeriod(period),
    path: '/' + destRel.replace(/\\/g, '/'),
    fileName: path.basename(src)
  });
}

function importProgramTree(campusId, progFolder, progPath, programId, manifest) {
  // Root files → period "general"
  for (const f of fs.readdirSync(progPath, { withFileTypes: true })) {
    if (f.isFile()) {
      const ext = path.extname(f.name).toLowerCase();
      if (!MEDIA_EXT.has(ext) || SKIP_EXT.has(ext)) continue;
      copyToPublic(campusId, progFolder, 'general', path.join(progPath, f.name), manifest, programId);
    } else if (f.isDirectory()) {
      const periodName = f.name;
      const periodPath = path.join(progPath, f.name);
      if (isPeriodFolder(periodName)) {
        for (const file of collectMedia(periodPath)) {
          copyToPublic(campusId, progFolder, normalizePeriod(periodName), file, manifest, programId);
        }
      } else {
        // Nested (e.g. Industrial Tech → year → BSIT)
        for (const nested of collectMedia(periodPath)) {
          const rel = path.relative(periodPath, nested);
          const parts = rel.split(path.sep);
          const periodGuess = parts.find((p) => isPeriodFolder(p)) || periodName;
          copyToPublic(campusId, progFolder, normalizePeriod(periodGuess), nested, manifest, programId);
        }
      }
    }
  }
}

function main() {
  if (!fs.existsSync(ZIP)) throw new Error(`Ratings zip not found: ${ZIP}`);
  const programs = parsePrograms(fs.readFileSync(RECORDS_TS, 'utf8'));
  const byId = new Map(programs.map((p) => [p.id, p]));
  console.log('Programs in records:', programs.length);

  const extractTo = path.join(FRONTEND, '.tmp-ratings-extract');
  console.log('Extracting ratings zip…');
  extractZip(ZIP, extractTo);
  const root = findRoot(extractTo);
  console.log('Ratings root:', root);

  if (fs.existsSync(PUBLIC_RATINGS)) fs.rmSync(PUBLIC_RATINGS, { recursive: true, force: true });
  ensureDir(PUBLIC_RATINGS);

  /** @type {Record<string, Array<{ period: string, path: string, fileName: string }>>} */
  const manifest = {};
  let copied = 0;

  for (const campusFolder of Object.keys(CAMPUS_FOLDER)) {
    const campusId = CAMPUS_FOLDER[campusFolder];
    const campusPath = path.join(root, campusFolder);
    if (!fs.existsSync(campusPath)) {
      console.warn('Missing campus:', campusFolder);
      continue;
    }

    for (const entry of fs.readdirSync(campusPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const full = path.join(campusPath, entry.name);

      // College that IS the program (CET/CITE)
      const collegeProg = COLLEGE_PROGRAM[campusId]?.[entry.name];
      if (collegeProg) {
        if (!byId.has(collegeProg)) continue;
        const before = (manifest[collegeProg] || []).length;
        importProgramTree(campusId, entry.name, full, collegeProg, manifest);
        copied += (manifest[collegeProg] || []).length - before;
        continue;
      }

      const mapped = resolveProgramId(campusId, entry.name);
      if (mapped) {
        if (!byId.has(mapped)) {
          console.warn('Alias points to missing id', mapped, entry.name);
          continue;
        }
        const before = (manifest[mapped] || []).length;
        importProgramTree(campusId, entry.name, full, mapped, manifest);
        copied += (manifest[mapped] || []).length - before;
        continue;
      }
      if (mapped === null) continue;

      // Look one level deeper (Tandag colleges)
      for (const child of fs.readdirSync(full, { withFileTypes: true })) {
        if (!child.isDirectory()) continue;
        const pid = resolveProgramId(campusId, child.name);
        if (!pid) {
          if (pid === null) continue;
          console.warn(`Unmatched: ${campusId}/${entry.name}/${child.name}`);
          continue;
        }
        if (!byId.has(pid)) continue;
        const before = (manifest[pid] || []).length;
        importProgramTree(campusId, child.name, path.join(full, child.name), pid, manifest);
        copied += (manifest[pid] || []).length - before;
      }
    }
  }

  // Newest period first
  for (const list of Object.values(manifest)) {
    list.sort((a, b) => {
      const ay = Number((a.period.match(/(\d{4})/) || [])[1] || 0);
      const by = Number((b.period.match(/(\d{4})/) || [])[1] || 0);
      if (by !== ay) return by - ay;
      return a.fileName.localeCompare(b.fileName);
    });
  }

  const outPath = path.join(DATA_DIR, 'ratingsDocumentManifest.ts');
  const body = `/** Auto-generated by scripts/import-ratings.mjs — do not edit by hand. */\n/** programId → technical review / board action / ratings files by period */\nexport type RatingsDocEntry = { period: string; path: string; fileName: string };\nexport const ratingsDocumentManifest = ${JSON.stringify(manifest, null, 2)} as const;\n`;
  fs.writeFileSync(outPath, body, 'utf8');
  console.log(`Ratings: copied files into manifest for ${Object.keys(manifest).length} programs`);
  console.log('Wrote', path.relative(FRONTEND, outPath));

  try {
    fs.rmSync(extractTo, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  console.log('Done.');
}

main();
