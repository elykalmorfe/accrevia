import { FileType } from '../types/evidence';

const FILE_TYPE_BY_EXT: Record<string, FileType> = {
  pdf: 'PDF',
  doc: 'DOCX',
  docx: 'DOCX',
  xls: 'XLSX',
  xlsx: 'XLSX',
  csv: 'XLSX',
  ppt: 'PPTX',
  pptx: 'PPTX',
  jpg: 'JPG',
  jpeg: 'JPG',
  png: 'PNG',
  tif: 'TIFF',
  tiff: 'TIFF'
};

export function fileTypeFromName(name: string): FileType {
  return knownFileType(name) ?? 'PDF';
}

/** File type for a recognised extension, or null when the extension is not supported. */
export function knownFileType(name: string): FileType | null {
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() ?? '' : '';
  return FILE_TYPE_BY_EXT[ext] ?? null;
}

export function extensionsFor(types: FileType[]): string[] {
  return Object.entries(FILE_TYPE_BY_EXT).filter(([, t]) => types.includes(t)).map(([ext]) => ext);
}
