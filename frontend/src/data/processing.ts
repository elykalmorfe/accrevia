import { ProcessingStage } from '../types/processing';

export const processingStages: ProcessingStage[] = [
{ key: 'upload', label: 'Upload', description: 'File received and stored securely' },
{ key: 'extract', label: 'OCR / Text Extraction', description: 'Text extracted from the file; scanned pages are read with OCR' },
{ key: 'clean', label: 'Text Cleaning', description: 'Headers, footers, and noise removed; text normalized' },
{ key: 'chunk', label: 'Document Chunking', description: 'Text split into passages for precise matching' },
{ key: 'embed', label: 'Embedding Generation', description: 'Passages converted into meaning-based representations' },
{ key: 'index', label: 'Vector Indexing', description: 'Passages added to the search index' },
{ key: 'ready', label: 'Ready for Retrieval', description: 'Document is searchable from the global search' }];

