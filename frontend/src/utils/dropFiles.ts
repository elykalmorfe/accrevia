import type { DragEvent } from 'react';

export interface PendingUpload {
  file: File;
  /** Relative path including folders, e.g. `Level II/certificate.pdf`; just the file name for loose files. */
  path: string;
}

/** Reads dropped files and folders, keeping each file's folder path. */
export async function readDroppedItems(items: DataTransferItemList): Promise<PendingUpload[]> {
  const results: PendingUpload[] = [];

  const readAllEntries = (reader: FileSystemDirectoryReader) =>
    new Promise<FileSystemEntry[]>((resolve, reject) => {
      const all: FileSystemEntry[] = [];
      const readBatch = () =>
        reader.readEntries((batch) => {
          if (!batch.length) return resolve(all);
          all.push(...batch);
          readBatch();
        }, reject);
      readBatch();
    });

  const walk = async (entry: FileSystemEntry, prefix: string): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
      results.push({ file, path: `${prefix}${file.name}` });
    } else if (entry.isDirectory) {
      const children = await readAllEntries((entry as FileSystemDirectoryEntry).createReader());
      for (const child of children) await walk(child, `${prefix}${entry.name}/`);
    }
  };

  const entries = Array.from(items)
    .map((item) => item.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => !!e);
  for (const entry of entries) await walk(entry, '');
  return results;
}

/** Files from a drop event; folders are expanded only when `allowFolders` is set. */
export async function filesFromDrop(event: DragEvent, allowFolders: boolean): Promise<PendingUpload[]> {
  if (allowFolders && event.dataTransfer.items?.length) return readDroppedItems(event.dataTransfer.items);
  return Array.from(event.dataTransfer.files).map((file) => ({ file, path: file.name }));
}

export function filesFromInput(list: FileList | null): PendingUpload[] {
  return Array.from(list ?? []).map((file) => ({ file, path: file.webkitRelativePath || file.name }));
}
