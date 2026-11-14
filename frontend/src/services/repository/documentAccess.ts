/**
 * Chunk 9.3 — document access helpers for verified static catalogs.
 * Classifies link accuracy without inventing Drive file IDs.
 */
import type { RepoDocumentItem } from '../../types/accreditationRepository';

export type DocumentLinkKind = 'drive-file' | 'drive-folder' | 'local-candidate' | 'none';

export type DocumentAccessMode = 'local-preview' | 'drive-file' | 'drive-folder' | 'metadata-only';

export type DocumentAccessHints = {
  linkKind: DocumentLinkKind;
  /** Candidate same-origin path from the catalog (may 404 until binaries are restored). */
  localCandidateUrl?: string;
  /** Verified individual Drive file URL, when present. */
  driveFileUrl?: string;
  /** Verified Drive folder URL, when present (not an individual document). */
  driveFolderUrl?: string;
  /** Primary external action URL (file preferred over folder). */
  primaryExternalUrl?: string;
  /** Primary CTA label for the external action. */
  primaryExternalLabel: string;
  /** True when a verified external URL may be opened. */
  canOpenExternal: boolean;
  /** True when no document or folder link is available. */
  linkUnavailable: boolean;
  /** Human-readable availability before local probing. */
  catalogHint: string;
  /** Short chip label for cards/lists. */
  availabilityLabel: string;
};

const FILE_URL_RE = /drive\.google\.com\/file\/d\//i;
const FOLDER_URL_RE = /drive\.google\.com\/drive\/folders\//i;
const OPEN_ID_FILE_RE = /drive\.google\.com\/open\?id=/i;

export function classifyDriveUrl(url?: string | null): 'drive-file' | 'drive-folder' | 'unknown' | 'none' {
  const u = url?.trim();
  if (!u) return 'none';
  if (FILE_URL_RE.test(u) || OPEN_ID_FILE_RE.test(u)) return 'drive-file';
  if (FOLDER_URL_RE.test(u)) return 'drive-folder';
  return 'unknown';
}

export function getDocumentAccessHints(doc: RepoDocumentItem): DocumentAccessHints {
  const localCandidateUrl = doc.localPreviewUrl?.trim() || undefined;
  const explicitFile = doc.driveFileUrl?.trim() || undefined;
  const external = doc.externalUrl?.trim() || undefined;

  const explicitKind = classifyDriveUrl(explicitFile);
  const externalKind = classifyDriveUrl(external);

  const driveFileUrl =
    explicitKind === 'drive-file'
      ? explicitFile
      : externalKind === 'drive-file'
        ? external
        : undefined;

  const driveFolderUrl =
    explicitKind === 'drive-folder'
      ? explicitFile
      : externalKind === 'drive-folder'
        ? external
        : undefined;

  // Never promote an unknown URL to an individual document link.
  const primaryExternalUrl = driveFileUrl || driveFolderUrl;
  const canOpenExternal = Boolean(primaryExternalUrl);
  const linkUnavailable = !canOpenExternal && !localCandidateUrl;

  let linkKind: DocumentLinkKind = 'none';
  if (driveFileUrl) linkKind = 'drive-file';
  else if (driveFolderUrl) linkKind = 'drive-folder';
  else if (localCandidateUrl) linkKind = 'local-candidate';

  let primaryExternalLabel = 'Document link unavailable';
  if (driveFileUrl) primaryExternalLabel = 'Open Document in Google Drive';
  else if (driveFolderUrl) primaryExternalLabel = 'Open Source Folder';

  let catalogHint = 'Document link unavailable. Verified title and metadata remain visible.';
  let availabilityLabel = 'Link unavailable';

  if (driveFileUrl && localCandidateUrl) {
    catalogHint =
      'Verified individual Google Drive document link is available. A local asset path is also listed and may support in-app preview if the file exists in this deployment.';
    availabilityLabel = 'Drive document + local path';
  } else if (driveFileUrl) {
    catalogHint =
      'Verified individual Google Drive document link is available. The file is not hosted inside this app.';
    availabilityLabel = 'Drive document';
  } else if (driveFolderUrl && localCandidateUrl) {
    catalogHint =
      'A verified Google Drive source folder is available (not the individual file). A local asset path is listed for preview only if that file exists in this deployment.';
    availabilityLabel = 'Source folder + local path';
  } else if (driveFolderUrl) {
    catalogHint =
      'Only a verified Google Drive source folder link is available. This is not an individual document URL.';
    availabilityLabel = 'Source folder only';
  } else if (localCandidateUrl) {
    catalogHint =
      'Catalog lists a local asset path. Preview is available only if that file exists in this deployment. No verified Google Drive document URL is attached.';
    availabilityLabel = 'Local path only';
  }

  return {
    linkKind,
    localCandidateUrl,
    driveFileUrl,
    driveFolderUrl,
    primaryExternalUrl,
    primaryExternalLabel,
    canOpenExternal,
    linkUnavailable,
    catalogHint,
    availabilityLabel
  };
}

export async function probeLocalPreview(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (head.ok) return true;
    const get = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } });
    return get.ok || get.status === 206;
  } catch {
    return false;
  }
}

export function resolveAccessMode(args: {
  localAvailable: boolean;
  driveFileUrl?: string;
  driveFolderUrl?: string;
}): DocumentAccessMode {
  if (args.localAvailable) return 'local-preview';
  if (args.driveFileUrl) return 'drive-file';
  if (args.driveFolderUrl) return 'drive-folder';
  return 'metadata-only';
}

export function isImagePath(url?: string, mimeType?: string): boolean {
  if (mimeType?.startsWith('image/')) return true;
  return Boolean(url && /\.(png|jpe?g|gif|webp)$/i.test(url));
}

export function isPdfPath(url?: string, mimeType?: string): boolean {
  if (mimeType?.includes('pdf')) return true;
  return Boolean(url && /\.pdf$/i.test(url));
}
