import { Building2Icon, FolderIcon, GraduationCapIcon, CalendarIcon } from 'lucide-react';
import type { RepoFolderKind, RepoFolderNode } from '../../../types/accreditationRepository';
import { CampusFolderCard } from './CampusFolderCard';

function iconForKind(kind: RepoFolderKind) {
  switch (kind) {
    case 'campus':
      return Building2Icon;
    case 'college':
      return FolderIcon;
    case 'program':
      return GraduationCapIcon;
    case 'year':
      return CalendarIcon;
    default:
      return FolderIcon;
  }
}

type RepoFolderGridProps = {
  folders: RepoFolderNode[];
  onOpen: (folder: RepoFolderNode) => void;
};

export function RepoFolderGrid({ folders, onOpen }: RepoFolderGridProps) {
  if (folders.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-4">
      {folders.map((folder) => (
        <CampusFolderCard
          key={folder.id}
          name={folder.name}
          kind={folder.kind}
          description={folder.description}
          icon={iconForKind(folder.kind)}
          onOpen={() => onOpen(folder)}
        />
      ))}
    </div>
  );
}
