import { DocumentMetadata, DocumentType, EvidenceDocument } from '../types/evidence';

export function emptyMetadata(): DocumentMetadata {
  return {
    title: '',
    description: '',
    keywords: '',
    frameworkId: '',
    areaId: '',
    criterionId: '',
    indicatorId: '',
    docType: '',
    campus: 'Main Campus (Tandag City)',
    college: 'University-wide',
    department: '—',
    program: 'Institution-wide',
    office: '',
    academicYear: '2025–2026',
    cycle: '',
    documentDate: '',
    validUntil: '',
    confidentiality: 'Internal'
  };
}

export function toMetadata(doc: EvidenceDocument): DocumentMetadata {
  return {
    title: doc.title,
    description: doc.description,
    keywords: doc.keywords.join(', '),
    frameworkId: doc.frameworkId,
    areaId: doc.areaId,
    criterionId: doc.criterionId,
    indicatorId: doc.indicatorId,
    docType: doc.docType,
    campus: doc.campus,
    college: doc.college,
    department: doc.department,
    program: doc.program,
    office: doc.office,
    academicYear: doc.academicYear,
    cycle: doc.cycle,
    documentDate: doc.documentDate,
    validUntil: doc.validUntil ?? '',
    confidentiality: doc.confidentiality
  };
}

export function metadataToPatch(meta: DocumentMetadata): Partial<EvidenceDocument> {
  return {
    title: meta.title.trim(),
    description: meta.description.trim(),
    keywords: meta.keywords.split(',').map((k) => k.trim()).filter(Boolean),
    frameworkId: meta.frameworkId,
    areaId: meta.areaId,
    criterionId: meta.criterionId,
    indicatorId: meta.indicatorId,
    docType: meta.docType as DocumentType,
    campus: meta.campus,
    college: meta.college,
    department: meta.department,
    program: meta.program,
    office: meta.office,
    academicYear: meta.academicYear,
    cycle: meta.cycle,
    documentDate: meta.documentDate,
    validUntil: meta.validUntil || undefined,
    confidentiality: meta.confidentiality
  };
}

export function missingRequiredFields(meta: DocumentMetadata): string[] {
  const missing: string[] = [];
  if (!meta.title.trim()) missing.push('Document title');
  if (!meta.frameworkId) missing.push('Framework');
  if (!meta.areaId) missing.push('Accreditation area');
  if (!meta.criterionId) missing.push('Criterion');
  if (!meta.indicatorId) missing.push('Indicator');
  if (!meta.docType) missing.push('Document type');
  return missing;
}