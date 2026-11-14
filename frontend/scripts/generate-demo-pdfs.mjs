/**
 * Generates fictional SAMPLE PDFs for Faculty/Staff document preview demos.
 * Does not use institutional certificates, seals, or confidential content.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/demo-documents');

const docs = [
  {
    file: 'demo-aaccup-level-ii-sample.pdf',
    title: 'Sample AACCUP Level II Certificate',
    lines: [
      'ACCREVIA DEMONSTRATION PACK',
      'Sample AACCUP Level II Certificate',
      'Fictional Program: Bachelor of Science in Sample Studies',
      'Fictional Campus: Riverside Demonstration Campus',
      'Document ID: DEMO-AACCUP-2024-001',
      'Issue date (fictional): 15 March 2024',
      'This page is invented layout content for UI preview only.'
    ]
  },
  {
    file: 'demo-aaccup-level-iii-sample.pdf',
    title: 'Sample AACCUP Level III Certificate',
    lines: [
      'ACCREVIA DEMONSTRATION PACK',
      'Sample AACCUP Level III Certificate',
      'Fictional Program: Bachelor of Arts in Civic Communication',
      'Fictional Campus: Harbor Demonstration Campus',
      'Document ID: DEMO-AACCUP-2023-014',
      'Issue date (fictional): 02 November 2023',
      'No authentic seals, signatures, or institutional seals are included.'
    ]
  },
  {
    file: 'demo-copc-sample-bsit.pdf',
    title: 'Sample COPC — BS Information Technology',
    lines: [
      'ACCREVIA DEMONSTRATION PACK',
      'Sample Certificate of Program Compliance (COPC)',
      'Fictional Program: Bachelor of Science in Information Technology',
      'Fictional Campus: Lakeside Demonstration Campus',
      'Document ID: DEMO-COPC-2025-007',
      'Worksheet note (fictional): Demo compliance entry for UI testing',
      'Not an official CHED / institutional COPC document.'
    ]
  },
  {
    file: 'demo-copc-sample-bsed.pdf',
    title: 'Sample COPC — Bachelor of Secondary Education',
    lines: [
      'ACCREVIA DEMONSTRATION PACK',
      'Sample Certificate of Program Compliance (COPC)',
      'Fictional Program: Bachelor of Secondary Education — Mathematics',
      'Fictional Campus: Upland Demonstration Campus',
      'Document ID: DEMO-COPC-2024-019',
      'This text is fabricated for Faculty/Staff preview demos only.'
    ]
  },
  {
    file: 'demo-faculty-qualification-summary.pdf',
    title: 'Sample Faculty Qualification Summary',
    lines: [
      'ACCREVIA DEMONSTRATION PACK',
      'Sample Faculty Qualification Summary',
      'Fictional faculty member: Alex Rivera (DEMO)',
      'Fictional unit: College of Applied Demonstration Sciences',
      'Document ID: DEMO-FQ-2024-003',
      'Credentials listed below are invented and anonymized.',
      'Highest degree (fictional): M.S. Applied Learning Systems'
    ]
  },
  {
    file: 'demo-faculty-development-record.pdf',
    title: 'Sample Faculty Development Record',
    lines: [
      'ACCREVIA DEMONSTRATION PACK',
      'Sample Faculty Development / Training Record',
      'Fictional participant: Jordan Lee (DEMO)',
      'Activity (fictional): Outcomes-Based Education Workshop',
      'Document ID: DEMO-FD-2025-011',
      'Date (fictional): 18 January 2025',
      'Hours (fictional): 16'
    ]
  },
  {
    file: 'demo-area-research-evidence.pdf',
    title: 'Sample Area III Research Evidence Packet',
    lines: [
      'ACCREVIA DEMONSTRATION PACK',
      'Sample Accreditation Supporting Evidence',
      'Area focus (fictional): Research Productivity Snapshot',
      'Document ID: DEMO-EVID-AREA3-2024-002',
      'Includes invented tables and narrative for layout testing.',
      'Do not treat figures as institutional performance data.'
    ]
  },
  {
    file: 'demo-curriculum-syllabus-evidence.pdf',
    title: 'Sample Curriculum & Syllabus Evidence',
    lines: [
      'ACCREVIA DEMONSTRATION PACK',
      'Sample Curriculum and Syllabus Evidence Extract',
      'Fictional course: DEMO 101 — Introduction to Quality Systems',
      'Document ID: DEMO-EVID-CURR-2023-008',
      'Syllabus excerpts are fictional placeholders for preview.'
    ]
  },
  {
    file: 'demo-qa-internal-audit-summary.pdf',
    title: 'Sample Internal Quality Audit Summary',
    lines: [
      'ACCREVIA DEMONSTRATION PACK',
      'Sample Institutional Quality Assurance Documentation',
      'Document type: Internal Audit Summary (Demonstration)',
      'Document ID: DEMO-QA-AUDIT-2024-005',
      'Findings listed are invented scenarios for UI rehearsal.',
      'Not a real audit report and not confidential TR content.'
    ]
  },
  {
    file: 'demo-qa-continual-improvement-plan.pdf',
    title: 'Sample Continual Improvement Plan',
    lines: [
      'ACCREVIA DEMONSTRATION PACK',
      'Sample Continual Improvement Plan (Quality Assurance)',
      'Document ID: DEMO-QA-CIP-2025-004',
      'Objectives and timelines are fictional demo content.',
      'Prepared solely to exercise ACCREVIA document preview.'
    ]
  }
];

function escapePdfText(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdf(title, lines) {
  const banner = 'SAMPLE DOCUMENT — FOR DEMONSTRATION ONLY';
  const contentLines = [
    'BT',
    '/F1 14 Tf',
    '50 740 Td',
    `(${escapePdfText(banner)}) Tj`,
    '/F1 11 Tf',
    '0 -28 Td',
    `(${escapePdfText(title)}) Tj`,
    '0 -22 Td',
    '(ACCREVIA Faculty/Staff mock preview asset) Tj',
    '0 -18 Td',
    '(Not an authentic institutional record.) Tj'
  ];

  let yOffsetFirst = true;
  for (const line of lines) {
    contentLines.push(yOffsetFirst ? '0 -28 Td' : '0 -16 Td');
    contentLines.push(`(${escapePdfText(line)}) Tj`);
    yOffsetFirst = false;
  }

  contentLines.push(
    '0 -36 Td',
    `(${escapePdfText(banner)}) Tj`,
    'ET'
  );

  const stream = contentLines.join('\n');
  const objects = [];
  objects.push('1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n');
  objects.push('2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n');
  objects.push(
    '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n'
  );
  objects.push(`4 0 obj<< /Length ${Buffer.byteLength(stream, 'utf8')} >>stream\n${stream}\nendstream\nendobj\n`);
  objects.push('5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n');

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }
  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return pdf;
}

fs.mkdirSync(outDir, { recursive: true });
for (const doc of docs) {
  const pdf = buildPdf(doc.title, doc.lines);
  fs.writeFileSync(path.join(outDir, doc.file), pdf, 'utf8');
  console.log('Wrote', doc.file);
}
console.log(`Generated ${docs.length} demo PDFs in ${outDir}`);
