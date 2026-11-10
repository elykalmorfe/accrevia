import type { ElementType } from 'react';
import { FileImageIcon, FileSpreadsheetIcon, FileTextIcon, PresentationIcon } from 'lucide-react';
import type { FileType } from '../../types/evidence';
import { knownFileType } from '../../utils/fileTypes';

export const FILE_TYPE_STYLE: Record<FileType, { icon: ElementType; className: string }> = {
  PDF: { icon: FileTextIcon, className: 'bg-rose-50 text-rose-600 ring-rose-100' },
  DOCX: { icon: FileTextIcon, className: 'bg-sky-50 text-sky-600 ring-sky-100' },
  XLSX: { icon: FileSpreadsheetIcon, className: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  PPTX: { icon: PresentationIcon, className: 'bg-orange-50 text-orange-600 ring-orange-100' },
  JPG: { icon: FileImageIcon, className: 'bg-violet-50 text-violet-600 ring-violet-100' },
  PNG: { icon: FileImageIcon, className: 'bg-violet-50 text-violet-600 ring-violet-100' },
  TIFF: { icon: FileImageIcon, className: 'bg-violet-50 text-violet-600 ring-violet-100' }
};

const FALLBACK_STYLE = { icon: FileTextIcon, className: 'bg-slate-50 text-slate-500 ring-slate-100' };

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
