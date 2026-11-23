import type { CampusId } from '../types/accreditation';
import type { EvidenceDocument, EvidenceFolder } from '../types/evidence';
import { isCampusMatch } from './campus';
import { isRootFrameworkFolder } from '../data/folders';

type CampusItem = { syncIssue?: string; campusId?: string; campus?: string; folderId?: string; parentId?: string };

/** Use the source record's campus, inheriting a folder's campus when needed. */
export function matchesRepositoryCampus(item: CampusItem, campus: CampusId | 'all', folders: EvidenceFolder[]): boolean {
  if (campus === 'all') return true;
  if (item.syncIssue === 'ambiguous-campus') return false;
  let current: CampusItem | undefined = item;
  const visited = new Set<string>();
  while (current) {
    if (current.campusId === '*') return true;
    if (current.campusId) return current.campusId === campus || isCampusMatch(current.campusId, campus);
    if (current.campus) return isCampusMatch(current.campus, campus);
    const parentId: string | undefined = current.folderId || current.parentId;
    if (!parentId || visited.has(parentId)) break;
    visited.add(parentId);
    current = folders.find((folder) => folder.id === parentId);
  }
  const folder = item as EvidenceFolder;
  if (isRootFrameworkFolder(folder)) return true;
  // Shared PA/COPC status folders are templates used by every campus.
  if (folder.isSystem && (folder.frameworkId === 'pa' || folder.frameworkId === 'copc')) return true;
  return campus === 'tandag';
}

/** Preserve real parent relationships; surface orphaned source folders at the framework root. */
export function repositoryChildren(parent: EvidenceFolder, folders: EvidenceFolder[], campus: CampusId | 'all', hiddenIds: string[] = []): EvidenceFolder[] {
  const hidden = new Set(hiddenIds);
  const visible = folders.filter((folder) => folder.frameworkId === parent.frameworkId &&
    (!hidden.has(folder.id) || !folder.libraryOnly) && matchesRepositoryCampus(folder, campus, folders));
  const ids = new Set(visible.map((folder) => folder.id));
  return visible.filter((folder) => {
    if (isRootFrameworkFolder(folder) || folder.id === parent.id) return false;
    if (!isRootFrameworkFolder(parent)) return folder.parentId === parent.id;
    return !folder.parentId || folder.parentId === parent.id || !ids.has(folder.parentId);
  });
}

export function repositoryDescendantIds(folderId: string, folders: EvidenceFolder[]): Set<string> {
  const ids = new Set([folderId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const folder of folders) {
      if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id);
        changed = true;
      }
    }
  }
  return ids;
}

/** Upload provenance selects records; the shared IDs keep both views in sync. */
export function uploadedFrameworkRecords(frameworkId: string, campus: CampusId | 'all', folders: EvidenceFolder[], documents: EvidenceDocument[]) {
  const uploadedIds = new Set<string>();
  for (const folder of folders) {
    if (folder.frameworkId === frameworkId && folder.libraryOnly) {
      for (const id of repositoryDescendantIds(folder.id, folders)) uploadedIds.add(id);
    }
  }
  const sharedDocuments = documents.filter(doc => doc.frameworkId === frameworkId && (doc.libraryOnly || !!doc.folderId && uploadedIds.has(doc.folderId)) && matchesRepositoryCampus(doc, campus, folders));
  const visibleIds = new Set(uploadedIds);
  const addAncestors = (id: string | undefined) => {
    const visited = new Set<string>();
    while (id && !visited.has(id)) {
      visited.add(id);
      const folder = folders.find(item => item.id === id && item.frameworkId === frameworkId);
      if (!folder || isRootFrameworkFolder(folder)) break;
      visibleIds.add(id);
      id = folder.parentId;
    }
  };
  for (const id of uploadedIds) addAncestors(id);
  for (const doc of sharedDocuments) addAncestors(doc.folderId);
  return {
    folders: folders.filter(folder => folder.frameworkId === frameworkId && visibleIds.has(folder.id) && matchesRepositoryCampus(folder, campus, folders)),
    documents: sharedDocuments
  };
}

/** Reuse directories across a batch while preserving each file's relative path. */
export function resolveUploadFolderPath(path: string | undefined, parentId: string, folders: EvidenceFolder[], buildFolder: (name: string, parentId: string) => EvidenceFolder, reusableIds?: Set<string>) {
  let folderId = parentId;
  const created: EvidenceFolder[] = [];
  const parts = (path || '').replace(/\\/g, '/').split('/').filter(Boolean).slice(0, -1);
  if (parts.some(part => part === '.' || part === '..')) throw new Error('Invalid upload folder path.');
  for (const name of parts) {
    let folder = [...folders.filter(item => !reusableIds || reusableIds.has(item.id)), ...created].find(item => item.parentId === folderId && item.name === name);
    if (!folder) {
      folder = buildFolder(name, folderId);
      created.push(folder);
    }
    folderId = folder.id;
  }
  return {folderId, created};
}

/** View-only area nodes reuse the source module's existing area catalog; nothing is inserted in storage. */
export function projectRepositoryAreas(folders: EvidenceFolder[], documents: EvidenceDocument[], catalogs: Record<string, {code: string; name: string}[]>, campuses: {id:string;name:string}[]) {
  const nodes: EvidenceFolder[] = [];
  const nodeFor = (framework: string, campus: string | undefined, area: string | undefined) => {
    const template = catalogs[framework]?.find(item => item.code.toLowerCase() === area?.toLowerCase());
    if (!template || !campus || campus === '*') return undefined;
    const id = `view-area:${framework}:${campus}:${template.code.toLowerCase()}`;
    if (!nodes.some(node => node.id === id)) nodes.push({id, name:template.name, code:template.code, frameworkId:framework,
      areaId:template.code.toLowerCase(), campusId:campus, campus:campuses.find(item => item.id === campus)?.name,
      parentId:`folder-${framework}`, category:'Accreditation',color:'blue',description:'',createdAt:'',isSystem:true,
      sourceModule:'accreditation',syncViewOnly:true});
    return id;
  };
  // Reuse the area definitions already used by each source module, including empty areas.
  for (const [framework,templates] of Object.entries(catalogs)) for (const campus of campuses) {
    for (const template of templates) nodeFor(framework,campus.id,template.code);
  }
  const projected = folders.map(folder => {
    if (isRootFrameworkFolder(folder)) return folder;
    if (!folder.parentId || folder.parentId === `folder-${folder.frameworkId}`) {
      const parentId = nodeFor(folder.frameworkId,folder.campusId,folder.areaId);
      if (parentId) return {...folder,parentId};
    }
    return folder;
  });
  const projectedDocs = documents.map(doc => {
    if (!doc.folderId || doc.folderId === `folder-${doc.frameworkId}`) {
      const folderId = nodeFor(doc.frameworkId,doc.campusId,doc.areaId);
      if (folderId) return {...doc,folderId};
    }
    return doc;
  });
  return {folders:[...projected,...nodes],documents:projectedDocs};
}
