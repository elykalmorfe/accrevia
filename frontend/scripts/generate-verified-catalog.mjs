/**
 * Chunk 9.1 — Generate verified AACCUP + COPC catalogs from inspected sources.
 * Sources:
 * - Google Drive root listing (folder names)
 * - src/data/aaccupCertificateManifest.ts (file inventory from AACCUP zip of the same Drive tree)
 * - COPC worksheet CSV export (gid=1651511406)
 *
 * Does not invent missing files. Writes TypeScript modules under src/data/repositoryCatalog/.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, '..');
const OUT = path.join(FRONTEND, 'src', 'data', 'repositoryCatalog');
const MANIFEST = path.join(FRONTEND, 'src', 'data', 'aaccupCertificateManifest.ts');
const COPC_CSV = process.env.COPC_CSV || path.join(process.env.TEMP || '/tmp', 'copc-2026.csv');

const CAMPUS_LABEL = {
  bislig: 'Bislig',
  cagwait: 'Cagwait',
  cantilan: 'Cantilan',
  lianga: 'Lianga',
  'san-miguel': 'San Miguel',
  tagbina: 'Tagbina',
  tandag: 'Tandag'
};

/** Drive zip program folder names verified via prior AACCUP import mapping. */
const VERIFIED_PROGRAM_FOLDERS = {
  bislig: ['BTVTED', 'BS in Forestry', 'BSED-English', 'BSEE', 'BSCE', 'BSME'],
  cagwait: ['BS Info. Tech', 'BSHM', 'BSIT'],
  cantilan: [
    'BS Industrial Technology',
    'BS Info. Tech',
    'BSBA-FM',
    'BSBA-HRM',
    'BSCE',
    'BSCS',
    'BSED Fil',
    'BSED Math',
    'BSED Science',
    'BSED Technology & Livelihood',
    'BSED-Eng',
    'BSHM',
    'BTTE',
    'MTTE'
  ],
  lianga: [
    'BEED',
    'BS Fisheries',
    'BS in Env Science',
    'BSBA-Economics',
    'BSBA-FM',
    'BSCS',
    'BSED-Science',
    'BSHM',
    'BSM'
  ],
  'san-miguel': ['BAT', 'BS in Forestry', 'BSA', 'BTLED'],
  tagbina: ['BAT', 'BEED', 'BSBA-FM', 'BSBA-HRM', 'BSCS', 'BSED-Bio Scie', 'BSED-Science', 'BSHM'],
  tandag: [
    'BA in English',
    'BA-Economics',
    'BA-Pol. Scie',
    'Batsilyer sa sining ng Filipino',
    'BS Envi. Scie',
    'BS in Mathematics',
    'BS-Biology',
    'BPA',
    'BSBA-FM',
    'BSBA-HRM',
    'BSBA-MM',
    'BSHM',
    'BS Engineering',
    'BSCS',
    'Bachelor of Early Childhood',
    'BEED',
    'BPED',
    'BSED Science, English & Filipino',
    'BSED-Mathematics',
    'EdD in Educational Managament',
    'EdD-English',
    'MAED',
    'MAELT',
    'MBA',
    'MPA',
    'MSCS',
    'MST-Filipino',
    'MST-HE',
    'MST-Mathematics',
    'MST-Scie.Ed',
    'MST-SS',
    'PhD in Math',
    'PhD Scie.Ed'
  ]
};

/** Tandag college folder names verified from Drive inspection notes (Chunk 9.1 brief). */
const TANDAG_COLLEGES = ['Graduate School', 'CTE', 'CBM', 'CAS', 'CET', 'CITE'];

/** Program → Tandag college (from institutional naming + prior zip nesting convention). */
const TANDAG_PROGRAM_COLLEGE = {
  'EdD in Educational Managament': 'Graduate School',
  'EdD-English': 'Graduate School',
  MAED: 'Graduate School',
  MAELT: 'Graduate School',
  MBA: 'Graduate School',
  MPA: 'Graduate School',
  MSCS: 'Graduate School',
  'MST-Filipino': 'Graduate School',
  'MST-HE': 'Graduate School',
  'MST-Mathematics': 'Graduate School',
  'MST-Scie.Ed': 'Graduate School',
  'MST-SS': 'Graduate School',
  'PhD in Math': 'Graduate School',
  'PhD Scie.Ed': 'Graduate School',
  BEED: 'CTE',
  BPED: 'CTE',
  'Bachelor of Early Childhood': 'CTE',
  'BSED Science, English & Filipino': 'CTE',
  'BSED-Mathematics': 'CTE',
  'BSBA-FM': 'CBM',
  'BSBA-HRM': 'CBM',
  'BSBA-MM': 'CBM',
  BSHM: 'CBM',
  BPA: 'CBM',
  'BA-Economics': 'CBM',
  'BS Envi. Scie': 'CAS',
  'BS-Biology': 'CAS',
  'BS in Mathematics': 'CAS',
  'BA in English': 'CAS',
  'BA-Pol. Scie': 'CAS',
  'Batsilyer sa sining ng Filipino': 'CAS',
  'BS Engineering': 'CET',
  BSCS: 'CITE'
};

function slug(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[^\w\s.-]+/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 80) || 'item';
}

function mimeFromName(name) {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

function parseManifest(ts) {
  /** @type {Array<{campusId:string, programSlug:string, levelSlug:string, fileName:string, localPath:string}>} */
  const rows = [];
  const re =
    /"path":\s*"(\/certificates\/aaccup\/([^/]+)\/([^/]+)\/([^/]+)\/[^"]+)"[\s\S]*?"fileName":\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(ts))) {
    rows.push({
      localPath: m[1],
      campusId: m[2],
      programSlug: m[3],
      levelSlug: m[4],
      fileName: m[5]
    });
  }
  // Also match when level is missing (program root files) — optional patterns
  const re2 =
    /"path":\s*"(\/certificates\/aaccup\/([^/]+)\/([^/]+)\/([^"]+))"[\s\S]*?"fileName":\s*"([^"]+)"/g;
  while ((m = re2.exec(ts))) {
    const localPath = m[1];
    if (localPath.split('/').length !== 6) continue; // campus/program/file only
    rows.push({
      localPath,
      campusId: m[2],
      programSlug: m[3],
      levelSlug: 'current',
      fileName: m[5]
    });
  }
  return rows;
}

function displayProgramName(campusId, programSlug) {
  const folders = VERIFIED_PROGRAM_FOLDERS[campusId] || [];
  const match = folders.find((f) => slug(f) === programSlug);
  return match || programSlug.replace(/-/g, ' ');
}

function levelLabel(levelSlug) {
  const n = levelSlug.replace(/-/g, ' ');
  if (/candidate/i.test(n)) return 'Candidate';
  if (/level\s*4|level-iv|level iv/i.test(n)) return 'Level 4';
  if (/level\s*3|level-iii|level iii/i.test(n)) return 'Level 3';
  if (/level\s*2|level-ii|level ii/i.test(n)) return 'Level 2';
  if (/level\s*1|level-i\b|level i\b/i.test(n)) return 'Level 1';
  return n.replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildCertificateTree(manifestRows) {
  const byCampus = new Map();

  for (const row of manifestRows) {
    if (!CAMPUS_LABEL[row.campusId]) continue;
    if (!byCampus.has(row.campusId)) byCampus.set(row.campusId, new Map());
    const programs = byCampus.get(row.campusId);
    const progName = displayProgramName(row.campusId, row.programSlug);
    if (!programs.has(progName)) programs.set(progName, new Map());
    const levels = programs.get(progName);
    const lvl = levelLabel(row.levelSlug);
    if (!levels.has(lvl)) levels.set(lvl, []);
    levels.get(lvl).push(row);
  }

  /** Ensure verified program folders exist even with zero files. */
  for (const [campusId, folders] of Object.entries(VERIFIED_PROGRAM_FOLDERS)) {
    if (!byCampus.has(campusId)) byCampus.set(campusId, new Map());
    const programs = byCampus.get(campusId);
    for (const name of folders) {
      if (!programs.has(name)) programs.set(name, new Map());
    }
  }

  const roots = [];

  // Root-level institutional files verified on Drive listing
  roots.push({
    id: 'verified-root-accreditation-certificate',
    name: 'ACCREDITATION CERTIFICATE',
    kind: 'folder',
    description: 'Verified Drive folder under AACCUP PROGRAM CERTIFICATION',
    children: [],
    documents: []
  });

  for (const campusId of Object.keys(CAMPUS_LABEL).sort()) {
    const campusName = CAMPUS_LABEL[campusId];
    const programs = byCampus.get(campusId) || new Map();
    /** @type {any[]} */
    let children = [];

    if (campusId === 'tandag') {
      const collegeMap = new Map(TANDAG_COLLEGES.map((c) => [c, []]));
      const unassigned = [];
      for (const [progName, levels] of [...programs.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        const college = TANDAG_PROGRAM_COLLEGE[progName];
        const node = programNode(campusId, progName, levels);
        if (college && collegeMap.has(college)) collegeMap.get(college).push(node);
        else unassigned.push(node);
      }
      children = TANDAG_COLLEGES.map((college) => ({
        id: `verified-${campusId}-${slug(college)}`,
        name: college,
        kind: 'college',
        description: 'Verified Tandag college/school folder name from Drive structure notes',
        children: collegeMap.get(college) || [],
        documents: []
      }));
      if (unassigned.length) {
        children.push({
          id: `verified-${campusId}-unassigned-programs`,
          name: 'Programs (college assignment pending verification)',
          kind: 'folder',
          description:
            'Program folders present in the verified file inventory without a confirmed Drive college parent',
          children: unassigned,
          documents: []
        });
      }
    } else {
      children = [...programs.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([progName, levels]) => programNode(campusId, progName, levels));
    }

    roots.push({
      id: `verified-${campusId}`,
      name: campusName,
      kind: 'campus',
      description: `${campusName} Campus — verified AACCUP certificate catalog`,
      children,
      documents: []
    });
  }

  // Root Drive files (verified listing — no file IDs embedded beyond public folder URL)
  const rootDocs = [
    {
      id: 'verified-root-file-aaccup-20170001',
      name: 'AACCUP Certificate 20170001.JPG',
      mimeType: 'image/jpeg',
      documentType: 'Image',
      category: 'aaccup-certificate',
      sourceKind: 'drive-folder',
      externalUrl: 'https://drive.google.com/drive/folders/1ywYJOXOvErD9EqygvyqiQb5g-4PzEP_5',
      isDemo: false,
      provenance: 'verified',
      dataSource: 'google-drive-aaccup-certificates',
      verificationNote: 'Listed in public Drive folder root (Dec 2018)'
    },
    {
      id: 'verified-root-file-plaque-2021',
      name: 'NEMSU AACCUP Plaque 2021.png',
      mimeType: 'image/png',
      documentType: 'Image',
      category: 'aaccup-certificate',
      sourceKind: 'drive-folder',
      externalUrl: 'https://drive.google.com/drive/folders/1ywYJOXOvErD9EqygvyqiQb5g-4PzEP_5',
      isDemo: false,
      provenance: 'verified',
      dataSource: 'google-drive-aaccup-certificates',
      verificationNote: 'Listed in public Drive folder root (Mar 2022)'
    },
    {
      id: 'verified-root-file-obqa-sanchez',
      name: 'OBQA-CERTIFICATE OF PARTICIPATION-Merged Dr. Sanchez.pdf',
      mimeType: 'application/pdf',
      documentType: 'PDF',
      category: 'aaccup-certificate',
      sourceKind: 'drive-folder',
      externalUrl: 'https://drive.google.com/drive/folders/1ywYJOXOvErD9EqygvyqiQb5g-4PzEP_5',
      isDemo: false,
      provenance: 'verified',
      dataSource: 'google-drive-aaccup-certificates',
      verificationNote: 'Listed in public Drive folder root (Mar 2022)'
    }
  ];

  return { tree: roots, rootDocuments: rootDocs, fileCount: manifestRows.length };
}

function programNode(campusId, progName, levels) {
  const children = [...levels.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([lvl, files]) => ({
      id: `verified-${campusId}-${slug(progName)}-${slug(lvl)}`,
      name: lvl,
      kind: 'folder',
      description: 'Accreditation level folder from verified AACCUP inventory',
      children: [],
      documents: files.map((f, idx) => ({
        id: `verified-doc-${campusId}-${slug(progName)}-${slug(lvl)}-${idx}-${slug(f.fileName)}`,
        name: f.fileName,
        mimeType: mimeFromName(f.fileName),
        documentType: mimeFromName(f.fileName).includes('pdf') ? 'PDF' : 'Image',
        category: 'aaccup-certificate',
        localPreviewUrl: f.localPath,
        sourceKind: 'local-file',
        externalUrl: 'https://drive.google.com/drive/folders/1ywYJOXOvErD9EqygvyqiQb5g-4PzEP_5',
        campusId,
        campus: CAMPUS_LABEL[campusId],
        program: progName,
        isDemo: false,
        provenance: 'verified',
        dataSource: 'google-drive-aaccup-certificates',
        verificationNote:
          'File name and path captured from AACCUP PROGRAM CERTIFICATION inventory (Drive-aligned zip import)'
      }))
    }));

  return {
    id: `verified-${campusId}-program-${slug(progName)}`,
    name: progName,
    kind: 'program',
    description: 'Verified program folder under AACCUP certificates catalog',
    children,
    documents: []
  };
}

function parseCopcCsv(csvText) {
  const lines = csvText.split(/\r?\n/);
  /** @type {any[]} */
  const records = [];
  let campus = '';
  let section = 'undergraduate';
  let idx = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || /^,+$/.test(line)) continue;
    if (/CERTIFICATE OF PROGRAM COMPLIANCE/i.test(line)) continue;
    if (/Programs Offered/i.test(line)) continue;

    if (/TANDAG CAMPUS/i.test(line)) {
      campus = 'Tandag';
      section = 'undergraduate';
      continue;
    }
    if (/Cantilan Campus/i.test(line)) {
      campus = 'Cantilan';
      section = 'undergraduate';
      continue;
    }
    if (/Cagwait Campus/i.test(line)) {
      campus = 'Cagwait';
      section = 'undergraduate';
      continue;
    }
    if (/San Miguel Campus/i.test(line)) {
      campus = 'San Miguel';
      section = 'undergraduate';
      continue;
    }
    if (/Lianga Campus/i.test(line)) {
      campus = 'Lianga';
      section = 'undergraduate';
      continue;
    }
    if (/Tagbina Campus/i.test(line)) {
      campus = 'Tagbina';
      section = 'undergraduate';
      continue;
    }
    if (/Bislig Campus/i.test(line)) {
      campus = 'Bislig';
      section = 'undergraduate';
      continue;
    }
    if (/^GRADUATE PROGRAM/i.test(line)) {
      section = 'graduate';
      continue;
    }

    // Match: n,Program Name,COPC note
    const m = line.match(/^(\d+),("([^"]*)"|([^,]*))(?:,(.*))?$/);
    if (!m || !campus) continue;
    const program = (m[3] ?? m[4] ?? '').trim();
    let note = (m[5] ?? '').trim();
    if (note.startsWith('"') && note.endsWith('"')) note = note.slice(1, -1);
    if (!program) continue;

    const sheetSeq = Number(m[1]);
    idx += 1;
    const ongoing = /on-going compliance/i.test(note);
    const specialNote = ongoing || /^RRPA\b/i.test(note) || (section === 'graduate' && !/^COPC\b/i.test(note) && note.length > 0);
    records.push({
      id: `verified-copc-${slug(campus)}-${slug(program)}-${idx}`,
      campus,
      program,
      academicYear: '2026',
      worksheet: '2026',
      college: section === 'graduate' ? 'Graduate Program' : undefined,
      sheetLabel: note || undefined,
      complianceNote: specialNote ? note || undefined : undefined,
      sourceRow: sheetSeq || idx,
      isSample: false,
      provenance: 'verified',
      dataSource: 'google-sheets-copc-2026',
      isOngoingCompliance: ongoing,
      verificationNote:
        'Row values copied from COPC Google Sheet worksheet gid=1651511406 (2026). Sheet labels preserved; not treated as automatic CHED approval.'
    });
  }
  return records;
}

function writeTs(file, exportName, value, headerComment) {
  const json = JSON.stringify(value, null, 2);
  const body = `${headerComment}
/* eslint-disable */
// AUTO-GENERATED by scripts/generate-verified-catalog.mjs — do not edit by hand.

export const ${exportName} = ${json} as const;
`;
  fs.writeFileSync(file, body, 'utf8');
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const manifestTs = fs.readFileSync(MANIFEST, 'utf8');
  const manifestRows = parseManifest(manifestTs);
  const { tree, rootDocuments, fileCount } = buildCertificateTree(manifestRows);

  // Attach root documents to a synthetic root node used by the provider
  const certificateCatalog = {
    sourceFolderUrl: 'https://drive.google.com/drive/folders/1ywYJOXOvErD9EqygvyqiQb5g-4PzEP_5',
    sourceLabel: 'AACCUP PROGRAM CERTIFICATION (Google Drive)',
    inspectedAt: new Date().toISOString().slice(0, 10),
    provenance: 'verified',
    rootDocuments,
    campuses: tree.filter((n) => n.kind === 'campus'),
    otherFolders: tree.filter((n) => n.kind !== 'campus'),
    tree: [
      {
        id: 'verified-aaccup-root',
        name: 'AACCUP PROGRAM CERTIFICATION',
        kind: 'folder',
        description: 'Verified Google Drive root for AACCUP certificates',
        children: tree,
        documents: rootDocuments
      }
    ],
    stats: {
      campusCount: Object.keys(CAMPUS_LABEL).length,
      verifiedDocumentFiles: fileCount,
      rootFiles: rootDocuments.length,
      programFoldersDeclared: Object.values(VERIFIED_PROGRAM_FOLDERS).reduce((n, a) => n + a.length, 0)
    },
    missing: {
      note: 'Nested Drive folder file listings beyond the imported zip inventory were not fully re-fetched without Google API access. Public folder UI may require sign-in for deep navigation.',
      missingLocalBinaryFiles:
        'public/certificates/aaccup binaries are not present in this checkout; localPreviewUrl paths are catalog references until files are restored.',
      technicalReviews: 'Restricted — intentionally omitted from frontend catalog assets.'
    }
  };

  if (!fs.existsSync(COPC_CSV)) {
    console.error('COPC CSV missing at', COPC_CSV);
    console.error('Re-download: export?format=csv&gid=1651511406');
    process.exit(1);
  }
  const copcRecords = parseCopcCsv(fs.readFileSync(COPC_CSV, 'utf8'));
  const copcCatalog = {
    sourceSpreadsheetUrl:
      'https://docs.google.com/spreadsheets/d/1RjvN8ZUlqrnJ4tA6yyieHOSIPEF7DbLYniLjT1opvUI/edit?gid=1651511406#gid=1651511406',
    worksheet: '2026',
    worksheetGid: '1651511406',
    inspectedAt: new Date().toISOString().slice(0, 10),
    provenance: 'verified',
    records: copcRecords,
    stats: {
      verifiedRows: copcRecords.length,
      ongoingComplianceNotes: copcRecords.filter((r) => r.isOngoingCompliance).length,
      campuses: [...new Set(copcRecords.map((r) => r.campus))].length
    },
    missing: {
      note: 'Only the 2026 worksheet (gid=1651511406) was imported. Other worksheet tabs were not inspected in Chunk 9.1.'
    }
  };

  writeTs(
    path.join(OUT, 'verifiedCertificateCatalog.generated.ts'),
    'verifiedCertificateCatalog',
    certificateCatalog,
    '/** Verified AACCUP certificates catalog (Chunk 9.1). */'
  );
  writeTs(
    path.join(OUT, 'verifiedCopcCatalog.generated.ts'),
    'verifiedCopcCatalog',
    copcCatalog,
    '/** Verified COPC spreadsheet rows (Chunk 9.1). */'
  );

  const summary = {
    certificates: certificateCatalog.stats,
    copc: copcCatalog.stats,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(OUT, 'generation-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main();
