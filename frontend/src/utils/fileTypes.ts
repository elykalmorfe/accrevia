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
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return FILE_TYPE_BY_EXT[ext] ?? 'PDF';
}
