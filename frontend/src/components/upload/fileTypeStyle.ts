import type { ElementType } from 'react';
import { FileImageIcon, FileSpreadsheetIcon, FileTextIcon, PresentationIcon } from 'lucide-react';
import type { FileType } from '../../types/evidence';
import { knownFileType } from '../../utils/fileTypes';

/** File-type chips use ocean brand weights so icons stay on-palette. */
export const FILE_TYPE_STYLE: Record<FileType, { icon: ElementType; className: string }> = {
  PDF: { icon: FileTextIcon, className: 'bg-brand-50 text-brand-700 ring-brand-100' },
  DOCX: { icon: FileTextIcon, className: 'bg-brand-50 text-brand-600 ring-brand-100' },
  XLSX: { icon: FileSpreadsheetIcon, className: 'bg-brand-100 text-brand-700 ring-brand-200' },
  PPTX: { icon: PresentationIcon, className: 'bg-brand-50 text-brand-800 ring-brand-200' },
  JPG: { icon: FileImageIcon, className: 'bg-brand-50 text-brand-600 ring-brand-100' },
  PNG: { icon: FileImageIcon, className: 'bg-brand-50 text-brand-600 ring-brand-100' },
  TIFF: { icon: FileImageIcon, className: 'bg-brand-100 text-brand-700 ring-brand-200' }
};

const FALLBACK_STYLE = { icon: FileTextIcon, className: 'bg-brand-50 text-brand-600 ring-brand-100' };

export function fileTypeStyle(typeOrName: string) {
  const type = (typeOrName in FILE_TYPE_STYLE ? typeOrName : knownFileType(typeOrName)) as FileType | null;
  return type ? FILE_TYPE_STYLE[type] : FALLBACK_STYLE;
}

export function formatSize(mb: number): string {
  return mb < 1 ? `${Math.max(1, Math.round(mb * 1024))} KB` : `${mb.toFixed(1)} MB`;
}

export function formatBytes(bytes: number): string {
  return formatSize(bytes / (1024 * 1024));
}
