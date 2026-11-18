import type { CopcRecordRow, RepoFolderNode } from '../../types/accreditationRepository';

/** Public sample certificates folder used as a frontend reference only. */
export const SAMPLE_CERTIFICATES_FOLDER_URL =
  'https://drive.google.com/drive/folders/1ywYJOXOvErD9EqygvyqiQb5g-4PzEP_5';

/** COPC spreadsheet reference for prototype labeling (not live-fetched). */
export const SAMPLE_COPC_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1RjvN8ZUlqrnJ4tA6yyieHOSIPEF7DbLYniLjT1opvUI/edit';

/**
 * Restricted Technical Review Drive sources are backend-owned.
 * Never ship restricted folder IDs, file IDs, filenames, or Drive URLs in the Faculty/Staff frontend.
 */

/** Demonstration fixtures removed — verified catalogs only. */
export const mockCertificateTree: RepoFolderNode[] = [];

/** Demonstration COPC sample rows removed. */
export const mockCopcRecords: CopcRecordRow[] = [];

/** Explicit aliases for Chunk 9.1 provenance separation. */
export const demonstrationCertificateTree = mockCertificateTree;
export const demonstrationCopcRecords = mockCopcRecords;
