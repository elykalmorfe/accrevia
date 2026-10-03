export type FrameworkCategory = 'Accreditation' | 'Compliance' | 'Quality Excellence' | 'Quality Management';

export interface Framework {
  id: string;
  name: string;
  shortName: string;
  category: FrameworkCategory;
  body: string;
  description: string;
  active: boolean;
  documentCount: number;
  lastUpdated: string;
}

export interface AccreditationArea {
  id: string;
  name: string;
  shortName: string;
  description: string;
}

export interface Criterion {
  id: string;
  code: string;
  name: string;
  frameworkId: string;
  areaId: string;
  description: string;
}

export interface EvidenceRequirement {
  id: string;
  name: string;
  description: string;
}

export interface Indicator {
  id: string;
  code: string;
  name: string;
  criterionId: string;
  requirements: EvidenceRequirement[];
}

export type DocumentStatus = 'Indexed' | 'Processing' | 'Pending Classification' | 'Failed' | 'Archived';

export type DocumentType =
'Report' |
'Certificate' |
'Policy' |
'Manual' |
'Memorandum' |
'Meeting Minutes' |
'Faculty Record' |
'Student Record' |
'Statistical Report' |
'Accomplishment Report' |
'Plan' |
'Photo / Documentation' |
'Other';

export type Confidentiality = 'Public' | 'Internal' | 'Confidential';

export type FileType = 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'JPG' | 'PNG' | 'TIFF';

export interface EvidenceDocument {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  frameworkId: string;
  areaId: string;
  criterionId: string;
  indicatorId: string;
  requirementId?: string;
  docType: DocumentType;
  academicYear: string;
  cycle: string;
  program: string;
  college: string;
  department: string;
  office: string;
  campus: string;
  documentDate: string;
  validUntil?: string;
  confidentiality: Confidentiality;
  status: DocumentStatus;
  dateAdded: string;
  fileType: FileType;
  pages: number;
  sizeMb: number;
  uploadedBy: string;
  passages: string[];
}

export interface PendingDocument {
  id: string;
  fileName: string;
  extractedTitle: string;
  fileType: FileType;
  pages: number;
  sizeMb: number;
  uploadedBy: string;
  uploadedAt: string;
  ocr: boolean;
  excerpt: string;
  suggestion: {
    frameworkId: string;
    areaId: string;
    docType: DocumentType;
    confidence: number;
  };
}

export interface DocumentMetadata {
  title: string;
  description: string;
  keywords: string;
  frameworkId: string;
  areaId: string;
  criterionId: string;
  indicatorId: string;
  docType: DocumentType | '';
  campus: string;
  college: string;
  department: string;
  program: string;
  office: string;
  academicYear: string;
  cycle: string;
  documentDate: string;
  validUntil: string;
  confidentiality: Confidentiality;
}

export interface Lookup {
  framework: (id: string) => Framework | undefined;
  area: (id: string) => AccreditationArea | undefined;
  criterion: (id: string) => Criterion | undefined;
  indicator: (id: string) => Indicator | undefined;
}