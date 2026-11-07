import { toast } from 'sonner';
import { getSettings } from '../settings/portalSettings';
import { extensionsFor, knownFileType } from './fileTypes';

/** Value for an `<input type="file" accept>` that matches the allowed upload types. */
export function uploadAcceptAttribute(): string {
  return extensionsFor(getSettings().uploads.allowedTypes).map((ext) => `.${ext}`).join(',');
}

/**
 * Drops files whose type is not allowed or that exceed the size limit (Settings → Uploads & Files)
 * and tells the user which files were skipped.
 */
export function filterAllowedUploads<T>(items: T[], getFile: (item: T) => { name: string; size: number }): T[] {
  const { allowedTypes, maxFileSizeMb } = getSettings().uploads;
  const maxBytes = maxFileSizeMb * 1024 * 1024;
  const skipped: string[] = [];

  const accepted = items.filter((item) => {
    const { name, size } = getFile(item);
    if (name.startsWith('.')) return false;
    const type = knownFileType(name);
    if (!type || !allowedTypes.includes(type)) {
      skipped.push(`${name} (file type not allowed)`);
      return false;
    }
    if (size > maxBytes) {
      skipped.push(`${name} (larger than ${maxFileSizeMb} MB)`);
      return false;
    }
    return true;
  });

  if (skipped.length > 0) {
    const shown = skipped.slice(0, 3).join(', ');
    toast.error(`${skipped.length} file${skipped.length === 1 ? ' was' : 's were'} skipped`, {
      description: skipped.length > 3 ? `${shown}, and ${skipped.length - 3} more` : shown
    });
  }
  return accepted;
}

export interface NamingContext {
  campus?: string;
  area?: string;
  year?: string;
}

/** Builds a document title from the naming pattern, e.g. `{campus}_{area}_{name}`. */
export function applyNamingPattern(fileName: string, ctx: NamingContext, pattern = getSettings().uploads.namingPattern): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  const tokens: Record<string, string> = {
    name: base,
    campus: ctx.campus ?? '',
    area: ctx.area ?? '',
    year: ctx.year ?? getSettings().general.defaultAcademicYear,
    date: new Date().toISOString().slice(0, 10)
  };
  const result = (pattern || '{name}').
  replace(/\{(\w+)\}/g, (match, key: string) => key in tokens ? tokens[key] : match).
  replace(/([_\s-])\1+/g, '$1').
  replace(/^[_\s-]+|[_\s-]+$/g, '');
  return result || base;
}
