import { campuses } from './accreditationData';
import type { RepoFolderNode } from '../types/accreditationRepository';

/** Display order requested for the AACCUP Certificates campus browser. */
const CAMPUS_ORDER = [
  'tandag',
  'bislig',
  'cagwait',
  'cantilan',
  'lianga',
  'san-miguel',
  'tagbina'
] as const;

/**
 * Campus root folders for the Accreditation Repository.
 * Children / documents intentionally empty until Google Drive is wired in Chunk 3.
 * Do not invent colleges, programs, years, or certificate files here.
 */
export function getCertificateCampusFolders(): RepoFolderNode[] {
  const byId = new Map(campuses.map((c) => [c.id, c]));
  return CAMPUS_ORDER.map((id) => {
    const campus = byId.get(id);
    const shortName =
      id === 'tandag'
        ? 'Tandag'
        : id === 'san-miguel'
          ? 'San Miguel'
          : campus?.shortName ?? id;
    return {
      id,
      name: shortName,
      kind: 'campus' as const,
      description: campus?.location,
      children: [],
      documents: []
    };
  });
}

/** Resolve a breadcrumb path of folder ids against a tree. */
export function resolveRepoPath(
  roots: RepoFolderNode[],
  pathIds: string[]
): { trail: RepoFolderNode[]; current: RepoFolderNode | null; missing: boolean } {
  if (pathIds.length === 0) {
    return { trail: [], current: null, missing: false };
  }

  const trail: RepoFolderNode[] = [];
  let level: RepoFolderNode[] | undefined = roots;

  for (const id of pathIds) {
    const next: RepoFolderNode | undefined = level?.find((n) => n.id === id);
    if (!next) {
      return { trail, current: trail[trail.length - 1] ?? null, missing: true };
    }
    trail.push(next);
    level = next.children;
  }

  return { trail, current: trail[trail.length - 1] ?? null, missing: false };
}

export function parseRepoPathParam(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split('/')
    .map((s) => decodeURIComponent(s.trim()))
    .filter(Boolean);
}

export function serializeRepoPath(pathIds: string[]): string {
  return pathIds.map((id) => encodeURIComponent(id)).join('/');
}
