/**
 * One-shot import: AACCUP zip → public/certificates/aaccup + COPC.xlsx Drive files → public/certificates/copc
 * Emits TypeScript manifests mapped to programAccreditationRecords ids.
 *
 * Usage: node scripts/import-certificates.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, '..');
const PUBLIC_AACCUP = path.join(FRONTEND, 'public', 'certificates', 'aaccup');
const PUBLIC_COPC = path.join(FRONTEND, 'public', 'certificates', 'copc');
const DATA_DIR = path.join(FRONTEND, 'src', 'data');

const ZIP =
  process.env.AACCUP_ZIP ||
  path.join(process.env.USERPROFILE || '', 'Downloads', 'AACCUP PROGRAM CERTIFICATION-20261113T074614Z-1-001.zip');
const COPC_XLSX = process.env.COPC_XLSX || path.join(process.env.USERPROFILE || '', 'Downloads', 'COPC.xlsx');
const RECORDS_TS = path.join(DATA_DIR, 'programAccreditationRecords.ts');

const CAMPUS_FOLDER = {
  'BISLIG CAMPUS': 'bislig',
  'CAGWAIT CAMPUS': 'cagwait',
  'CANTILAN CAMPUS': 'cantilan',
  'LIANGA CAMPUS': 'lianga',
  'SAN MIGUEL CAMPUS': 'san-miguel',
  'TAGBINA CAMPUS': 'tagbina',
  'TANDAG CAMPUS': 'tandag'
};

/** Zip / sheet short names → programAccreditationRecords id (per campus). */
const ZIP_ALIASES = {
  bislig: {
    'BS in Forestry': 'pa-bis-06',
    BSCE: 'pa-bis-02',
    'BSED-English': 'pa-bis-05',
    BSEE: 'pa-bis-03',
    BSME: 'pa-bis-04',
    BTVTED: 'pa-bis-01'
  },
  cagwait: {
    'BS Info. Tech': 'pa-cag-03',
    BSHM: 'pa-cag-01',
    BSIT: 'pa-cag-03'
  },
  cantilan: {
    'BS Industrial Technology': 'pa-can-07',
    'BS Info. Tech': 'pa-can-08',
    'BSBA-FM': 'pa-can-05',
    'BSBA-HRM': 'pa-can-04',
    BSCE: 'pa-can-03',
    BSCS: 'pa-can-06',
    'BSED Fil': 'pa-can-02',
    'BSED Math': 'pa-can-11',
    'BSED Science': 'pa-can-09',
    'BSED Technology & Livelihood': 'pa-can-10',
    'BSED-Eng': 'pa-can-01',
    BSHM: 'pa-can-13',
    BTTE: 'pa-can-12',
    MTTE: 'pa-can-14'
  },
  lianga: {
    BEED: 'pa-lia-05',
    'BS Fisheries': 'pa-lia-07',
    'BS in Env Science': 'pa-lia-09',
    'BSBA-Economics': 'pa-lia-02',
    'BSBA-FM': 'pa-lia-03',
    BSCS: 'pa-lia-01',
    'BSED-Science': 'pa-lia-06',
    BSHM: 'pa-lia-04',
    BSM: 'pa-lia-08'
  },
  'san-miguel': {
    BAT: null, // no matching record (BAT vs Agriculture Crop / Forestry)
    'BS in Forestry': 'pa-sm-03',
    BSA: 'pa-sm-02',
    BTLED: 'pa-sm-01'
  },
  tagbina: {
    BAT: 'pa-tag-02',
    BEED: 'pa-tag-03',
    'BSBA-FM': 'pa-tag-05',
    'BSBA-HRM': 'pa-tag-07',
    BSCS: 'pa-tag-06',
    'BSED-Bio Scie': 'pa-tag-04',
    'BSED-Science': 'pa-tag-04',
    BSHM: 'pa-tag-01'
  },
  tandag: {
    'BA in English': 'pa-tan-17',
    'BA-Economics': 'pa-tan-08',
    'BA-Pol. Scie': 'pa-tan-10',
    'Batsilyer sa sining ng Filipino': 'pa-tan-03',
    'BS Envi. Scie': 'pa-tan-02',
    'BS in Mathematics': 'pa-tan-14',
    'BS-Biology': 'pa-tan-04',
    BPA: 'pa-tan-19',
    'BSBA-FM': 'pa-tan-12',
    'BSBA-HRM': 'pa-tan-06',
    'BSBA-MM': 'pa-tan-07',
    BSHM: 'pa-tan-09',
    'BS Engineering': 'pa-tan-11',
    BSCS: 'pa-tan-13',
    'Bachelor of Early Childhood': 'pa-tan-05',
    BEED: 'pa-tan-15',
    BPED: 'pa-tan-01',
    'BSED Science, English & Filipino': 'pa-tan-16',
    'BSED-Mathematics': 'pa-tan-18',
    'EdD in Educational Managament': 'pa-tan-g02',
    'EdD-English': 'pa-tan-g03',
    MAED: 'pa-tan-g07',
    MAELT: 'pa-tan-g08',
    MBA: 'pa-tan-g04',
    MPA: 'pa-tan-g14',
    MSCS: 'pa-tan-g06',
    'MST-Filipino': 'pa-tan-g09',
    'MST-HE': 'pa-tan-g10',
    'MST-Mathematics': 'pa-tan-g11',
    'MST-Scie.Ed': 'pa-tan-g12',
    'MST-SS': 'pa-tan-g13',
    'PhD in Math': 'pa-tan-g01',
    'PhD Scie.Ed': 'pa-tan-g05'
  }
};

const MEDIA_EXT = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp']);

function slug(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[^\w\s.-]+/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 80) || 'file';
}

function normalizeLevel(folderName) {
  const n = String(folderName || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/levei/g, 'level')
    .replace(/level-/g, 'level ');
  if (/candidate/.test(n)) return 'Candidate';
  if (/\blevel\s*(iv|4)\b/.test(n) || /\blevel\s*4\b/.test(n)) return 'Level 4';
  if (/\blevel\s*(iii|3)\b/.test(n)) return 'Level 3';
  if (/\blevel\s*(ii|2)\b/.test(n)) return 'Level 2';
  if (/\blevel\s*(i|1)\b/.test(n) || /\blevel\s*1\b/.test(n)) return 'Level 1';
  // Folders that are program names under colleges (Tandag) — treat files at program root as current-level unknown
  return null;
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
  const tmpPs1 = path.join(FRONTEND, 'scripts', '_extract-certs.ps1');
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

function findAaccupRoot(extractRoot) {
  const direct = path.join(extractRoot, 'AACCUP PROGRAM CERTIFICATION');
  if (fs.existsSync(direct)) return direct;
  const kids = fs.readdirSync(extractRoot).map((n) => path.join(extractRoot, n));
  for (const k of kids) {
    if (fs.statSync(k).isDirectory() && /aaccup/i.test(path.basename(k))) return k;
  }
  return extractRoot;
}

/**
 * Resolve program folder under campus (Tandag nests under college).
 * Returns: programId string | null (explicit skip) | undefined (unknown — try children).
 */
function resolveProgramId(campusId, folderName) {
  const map = ZIP_ALIASES[campusId] || {};
  if (Object.prototype.hasOwnProperty.call(map, folderName)) return map[folderName];
  const key = Object.keys(map).find((k) => k.toLowerCase() === folderName.toLowerCase());
  if (key) return map[key];
  return undefined;
}

function importAaccup(programs) {
  if (!fs.existsSync(ZIP)) throw new Error(`AACCUP zip not found: ${ZIP}`);
  const extractTo = path.join(FRONTEND, '.tmp-aaccup-extract');
  console.log('Extracting AACCUP zip…');
  extractZip(ZIP, extractTo);
  const root = findAaccupRoot(extractTo);
  console.log('AACCUP root:', root);

  if (fs.existsSync(PUBLIC_AACCUP)) fs.rmSync(PUBLIC_AACCUP, { recursive: true, force: true });
  ensureDir(PUBLIC_AACCUP);

  /** @type {Record<string, Array<{ level: string, path: string, fileName: string }>>} */
  const manifest = {};
  const byId = new Map(programs.map((p) => [p.id, p]));
  let copied = 0;
  let unmatched = 0;

  for (const campusFolder of Object.keys(CAMPUS_FOLDER)) {
    const campusId = CAMPUS_FOLDER[campusFolder];
    const campusPath = path.join(root, campusFolder);
    if (!fs.existsSync(campusPath)) {
      console.warn('Missing campus folder:', campusFolder);
      continue;
    }

    // Collect program directories: either direct children or grandchildren (Tandag colleges)
    const programDirs = [];
    for (const entry of fs.readdirSync(campusPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const full = path.join(campusPath, entry.name);
      const mapped = resolveProgramId(campusId, entry.name);
      if (mapped !== undefined && mapped !== null) {
        programDirs.push({ name: entry.name, full, programId: mapped });
        continue;
      }
      if (mapped === null) continue; // explicitly skipped
      // Look one level deeper (college → program)
      for (const child of fs.readdirSync(full, { withFileTypes: true })) {
        if (!child.isDirectory()) continue;
        const pid = resolveProgramId(campusId, child.name);
        if (pid) programDirs.push({ name: child.name, full: path.join(full, child.name), programId: pid });
        else if (pid === null) continue;
        else {
          // try alias miss
          unmatched += 1;
          console.warn(`Unmatched program folder: ${campusId}/${entry.name}/${child.name}`);
        }
      }
      if (mapped === undefined && !fs.readdirSync(full, { withFileTypes: true }).some((d) => d.isDirectory())) {
        unmatched += 1;
        console.warn(`Unmatched program folder: ${campusId}/${entry.name}`);
      }
    }

    for (const { name: progFolder, full: progPath, programId } of programDirs) {
      if (!byId.has(programId)) {
        console.warn('Alias points to missing program id', programId, progFolder);
        continue;
      }
      const program = byId.get(programId);
      const entries = [];

      // Files directly under program
      for (const f of fs.readdirSync(progPath, { withFileTypes: true })) {
        if (f.isFile()) {
          const ext = path.extname(f.name).toLowerCase();
          if (!MEDIA_EXT.has(ext)) continue;
          entries.push({ level: program.status, src: path.join(progPath, f.name), fileName: f.name, levelFolder: '_root' });
        } else if (f.isDirectory()) {
          const level = normalizeLevel(f.name) || program.status;
          const levelPath = path.join(progPath, f.name);
          for (const lf of walkFiles(levelPath)) {
            const ext = path.extname(lf).toLowerCase();
            if (!MEDIA_EXT.has(ext)) continue;
            entries.push({ level, src: lf, fileName: path.basename(lf), levelFolder: f.name });
          }
        }
      }

      for (const e of entries) {
        const levelSlug = slug(e.level);
        const destRel = path.posix.join(
          'certificates',
          'aaccup',
          campusId,
          slug(progFolder),
          levelSlug,
          slug(path.parse(e.fileName).name) + path.extname(e.fileName).toLowerCase()
        );
        const destAbs = path.join(FRONTEND, 'public', destRel.replace(/\//g, path.sep));
        // Avoid collisions
        let finalAbs = destAbs;
        let finalRel = destRel;
        let n = 2;
        while (fs.existsSync(finalAbs)) {
          const p = path.parse(destAbs);
          finalAbs = path.join(p.dir, `${p.name}-${n}${p.ext}`);
          finalRel = path.posix.join(path.posix.dirname(destRel), `${path.parse(destRel).name}-${n}${path.extname(destRel)}`);
          n += 1;
        }
        copyFileSafe(e.src, finalAbs);
        copied += 1;
        if (!manifest[programId]) manifest[programId] = [];
        manifest[programId].push({
          level: e.level,
          path: '/' + finalRel.replace(/\\/g, '/'),
          fileName: e.fileName
        });
      }
    }
  }

  // Prefer current-level files first in each list
  for (const [id, list] of Object.entries(manifest)) {
    const status = byId.get(id)?.status;
    list.sort((a, b) => {
      const aMatch = a.level === status ? 0 : 1;
      const bMatch = b.level === status ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.fileName.localeCompare(b.fileName);
    });
  }

  console.log(`AACCUP: copied ${copied} files for ${Object.keys(manifest).length} programs (unmatched folders noted: ${unmatched})`);
  try {
    fs.rmSync(extractTo, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  return manifest;
}

function campusFromHeader(text) {
  const t = String(text || '').toUpperCase();
  if (t.includes('TANDAG')) return 'tandag';
  if (t.includes('CANTILAN')) return 'cantilan';
  if (t.includes('CAGWAIT')) return 'cagwait';
  if (t.includes('SAN MIGUEL')) return 'san-miguel';
  if (t.includes('LIANGA')) return 'lianga';
  if (t.includes('TAGBINA')) return 'tagbina';
  if (t.includes('BISLIG')) return 'bislig';
  return null;
}

function decodeXml(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeName(s) {
  return decodeXml(s)
    .toLowerCase()
    .replace(/batsilyer ng sining sa filipino/g, 'batsilyer sa sining ng filipino')
    .replace(/pyschology/g, 'psychology')
    .replace(/humar/g, 'human')
    .replace(/agiriculture/g, 'agriculture')
    .replace(/criminilogy/g, 'criminology')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchProgram(programs, campusId, programName) {
  const candidates = programs.filter((p) => p.campusId === campusId);
  const target = normalizeName(programName);
  let hit = candidates.find((p) => normalizeName(p.programName) === target);
  if (hit) return hit;
  hit = candidates.find(
    (p) => normalizeName(p.programName).includes(target) || target.includes(normalizeName(p.programName))
  );
  if (hit) return hit;
  // token overlap
  const tokens = new Set(target.split(' ').filter((t) => t.length > 2));
  let best = null;
  let bestScore = 0;
  for (const p of candidates) {
    const pt = new Set(normalizeName(p.programName).split(' ').filter((t) => t.length > 2));
    let score = 0;
    for (const t of tokens) if (pt.has(t)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= Math.min(3, tokens.size) ? best : null;
}

async function downloadDriveFile(fileId, destBaseWithoutExt) {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${fileId}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // Google sometimes returns HTML confirm page for large files
  const head = buf.slice(0, 32).toString('utf8');
  if (head.includes('<!DOCTYPE') || head.includes('<html')) {
    // try confirm token
    const html = buf.toString('utf8');
    const conf = /confirm=([0-9A-Za-z_-]+)/.exec(html) || /name="confirm" value="([^"]+)"/.exec(html);
    if (!conf) throw new Error(`Drive HTML interstitial for ${fileId}`);
    const res2 = await fetch(
      `https://drive.google.com/uc?export=download&confirm=${conf[1]}&id=${fileId}`,
      { redirect: 'follow' }
    );
    if (!res2.ok) throw new Error(`HTTP ${res2.status} confirm for ${fileId}`);
    const buf2 = Buffer.from(await res2.arrayBuffer());
    return writeDownloaded(buf2, destBaseWithoutExt, res2.headers.get('content-type'));
  }
  return writeDownloaded(buf, destBaseWithoutExt, res.headers.get('content-type'));
}

function writeDownloaded(buf, destBaseWithoutExt, contentType) {
  let ext = '.pdf';
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('jpeg') || ct.includes('jpg')) ext = '.jpg';
  else if (ct.includes('png')) ext = '.png';
  else if (ct.includes('pdf')) ext = '.pdf';
  else if (buf[0] === 0xff && buf[1] === 0xd8) ext = '.jpg';
  else if (buf[0] === 0x89 && buf[1] === 0x50) ext = '.png';
  else if (buf.slice(0, 4).toString() === '%PDF') ext = '.pdf';
  const dest = destBaseWithoutExt + ext;
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, buf);
  return dest;
}

async function importCopc(programs) {
  if (!fs.existsSync(COPC_XLSX)) throw new Error(`COPC.xlsx not found: ${COPC_XLSX}`);
  ensureDir(PUBLIC_COPC);

  // Parse hyperlinks from xlsx package
  const tmp = path.join(FRONTEND, '.tmp-copc-xlsx');
  if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
  ensureDir(tmp);
  const zipCopy = path.join(tmp, 'copc.zip');
  fs.copyFileSync(COPC_XLSX, zipCopy);
  execFileSync(
    'powershell',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      `Expand-Archive -LiteralPath ${JSON.stringify(zipCopy)} -DestinationPath ${JSON.stringify(path.join(tmp, 'extracted'))} -Force`
    ],
    { stdio: 'inherit' }
  );

  const extracted = path.join(tmp, 'extracted');
  const relsXml = fs.readFileSync(path.join(extracted, 'xl/worksheets/_rels/sheet1.xml.rels'), 'utf8');
  const sheetXml = fs.readFileSync(path.join(extracted, 'xl/worksheets/sheet1.xml'), 'utf8');
  const ssXml = fs.readFileSync(path.join(extracted, 'xl/sharedStrings.xml'), 'utf8');

  // shared strings (simple)
  const texts = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let sm;
  while ((sm = siRe.exec(ssXml))) {
    const block = sm[1];
    const parts = [...block.matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((x) => x[1]);
    texts.push(parts.join(''));
  }

  const idToUrl = {};
  for (const m of relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"|Target="([^"]+)"[^>]*Id="(rId\d+)"/g)) {
    if (m[1]) idToUrl[m[1]] = m[2];
    else idToUrl[m[4]] = m[3];
  }
  for (const m of relsXml.matchAll(/<Relationship[^>]*\/>/g)) {
    const id = /Id="(rId\d+)"/.exec(m[0])?.[1];
    const target = /Target="([^"]+)"/.exec(m[0])?.[1];
    if (id && target) idToUrl[id] = target;
  }

  const cellMap = {};
  for (const m of sheetXml.matchAll(/<c r="([A-Z]+\d+)"([^>]*)>(?:(?:<f[\s\S]*?<\/f>)|(?:<f[^/]*\/>))?<v>([^<]*)<\/v><\/c>/g)) {
    const ref = m[1];
    const attrs = m[2];
    const v = m[3];
    cellMap[ref] = /t="s"/.test(attrs) ? texts[Number(v)] ?? v : v;
  }

  // Campus section headers live in column A (shared-string cells)
  let currentCampus = 'tandag';
  const rowCampus = {};
  const maxRow = Math.max(
    1,
    ...Object.keys(cellMap)
      .map((ref) => Number(/(\d+)$/.exec(ref)?.[1] || 0))
      .filter(Boolean)
  );
  for (let excelRow = 1; excelRow <= maxRow; excelRow++) {
    const header =
      campusFromHeader(cellMap[`A${excelRow}`]) ||
      campusFromHeader(cellMap[`B${excelRow}`]) ||
      campusFromHeader(decodeXml(cellMap[`A${excelRow}`])) ||
      campusFromHeader(decodeXml(cellMap[`B${excelRow}`]));
    if (header) currentCampus = header;
    rowCampus[excelRow] = currentCampus;
  }

  /** @type {Record<string, { path: string, driveUrl: string, label: string }>} */
  const manifest = {};
  let ok = 0;
  let fail = 0;

  const hyperlinks = [...sheetXml.matchAll(/<hyperlink r:id="(rId\d+)" ref="([A-Z]+)(\d+)"/g)];
  for (const h of hyperlinks) {
    const rid = h[1];
    const col = h[2];
    const row = Number(h[3]);
    const url = idToUrl[rid];
    if (!url || !/^https?:/i.test(url)) continue;
    const fileId = /\/d\/([^/]+)/.exec(url)?.[1];
    if (!fileId) continue;
    const programName = decodeXml(cellMap[`B${row}`] || '');
    const label = decodeXml(cellMap[`${col}${row}`] || programName);
    const campusId = rowCampus[row] || 'tandag';
    const program = matchProgram(programs, campusId, programName);
    if (!program) {
      console.warn(`COPC unmatched: [${campusId}] ${programName}`);
      fail += 1;
      continue;
    }
    // Prefer first successful file per program (don't overwrite with later campuses incorrectly)
    if (manifest[program.id] && fs.existsSync(path.join(FRONTEND, 'public', manifest[program.id].path.replace(/^\//, '')))) {
      continue;
    }
    const destBase = path.join(PUBLIC_COPC, campusId, slug(program.programName));
    try {
      if (fs.existsSync(destBase + '.pdf') || fs.existsSync(destBase + '.jpg') || fs.existsSync(destBase + '.png')) {
        const existing = ['.pdf', '.jpg', '.png'].map((e) => destBase + e).find((p) => fs.existsSync(p));
        const rel = '/' + path.relative(path.join(FRONTEND, 'public'), existing).split(path.sep).join('/');
        manifest[program.id] = { path: rel, driveUrl: url, label: String(label) };
        ok += 1;
        continue;
      }
      console.log(`Downloading COPC ${program.id}…`);
      const saved = await downloadDriveFile(fileId, destBase);
      const rel = '/' + path.relative(path.join(FRONTEND, 'public'), saved).split(path.sep).join('/');
      manifest[program.id] = { path: rel, driveUrl: url, label: String(label) };
      ok += 1;
    } catch (err) {
      console.warn(`COPC download failed ${program.id} (${fileId}):`, err.message);
      // Still record Drive URL so UI can fall back
      manifest[program.id] = {
        path: '',
        driveUrl: url,
        label: String(label)
      };
      fail += 1;
    }
  }

  console.log(`COPC: ${ok} files ready, ${fail} unmatched/failed (manifest entries: ${Object.keys(manifest).length})`);
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  return manifest;
}

function writeTsManifest(filePath, exportName, data, typeComment) {
  const json = JSON.stringify(data, null, 2);
  const body = `/** Auto-generated by scripts/import-certificates.mjs — do not edit by hand. */\n${typeComment}\nexport const ${exportName} = ${json} as const;\n`;
  fs.writeFileSync(filePath, body, 'utf8');
  console.log('Wrote', path.relative(FRONTEND, filePath));
}

async function main() {
  const programs = parsePrograms(fs.readFileSync(RECORDS_TS, 'utf8'));
  console.log('Programs in records:', programs.length);

  const aaccup = importAaccup(programs);
  writeTsManifest(
    path.join(DATA_DIR, 'aaccupCertificateManifest.ts'),
    'aaccupCertificateManifest',
    aaccup,
    '/** programId → certificate files by accreditation level */\nexport type AaccupCertEntry = { level: string; path: string; fileName: string };'
  );

  const copc = await importCopc(programs);
  writeTsManifest(
    path.join(DATA_DIR, 'copcCertificateManifest.ts'),
    'copcCertificateManifest',
    copc,
    '/** programId → local path (if downloaded) + Drive URL */\nexport type CopcCertEntry = { path: string; driveUrl: string; label: string };'
  );

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
