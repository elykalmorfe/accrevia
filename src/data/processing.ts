import { ProcessingJob, ProcessingStage } from '../types/processing';

export const processingStages: ProcessingStage[] = [
{ key: 'upload', label: 'Upload', description: 'File received and stored securely' },
{ key: 'extract', label: 'OCR / Text Extraction', description: 'Text extracted from the file; scanned pages are read with OCR' },
{ key: 'clean', label: 'Text Cleaning', description: 'Headers, footers, and noise removed; text normalized' },
{ key: 'chunk', label: 'Document Chunking', description: 'Text split into passages for precise matching' },
{ key: 'embed', label: 'Embedding Generation', description: 'Passages converted into meaning-based representations' },
{ key: 'index', label: 'Vector Indexing', description: 'Passages added to the search index' },
{ key: 'ready', label: 'Ready for Retrieval', description: 'Document is searchable from the global search' }];


export const processingJobs: ProcessingJob[] = [
{ id: 'j-1', fileName: 'Faculty_Development_Report_2025.pdf', stage: 6, status: 'Completed', startedAt: '2026-10-01T08:02:00', ocr: false, pages: 48 },
{ id: 'j-2', fileName: 'Research_Journal_Vol12.pdf', stage: 4, status: 'Running', startedAt: '2026-10-01T08:31:00', ocr: false, pages: 186 },
{ id: 'j-3', fileName: 'Scanned_BOR_Resolutions_2024.pdf', stage: 1, status: 'Running', startedAt: '2026-10-01T08:36:00', ocr: true, pages: 52 },
{ id: 'j-4', fileName: 'Extension_Narrative_Q3.docx', stage: 0, status: 'Queued', startedAt: '2026-10-01T08:39:00', ocr: false, pages: 17 },
{ id: 'j-5', fileName: 'Library_Accession_List.xlsx', stage: 0, status: 'Queued', startedAt: '2026-10-01T08:40:00', ocr: false, pages: 9 },
{
  id: 'j-6', fileName: 'Old_Faculty_Records_1998.pdf', stage: 1, status: 'Failed', startedAt: '2026-10-01T07:48:00', ocr: true, pages: 74,
  note: 'Text recognition confidence was below the 60% threshold (41%). Re-scan at 300 DPI or retry with enhanced OCR.'
}];