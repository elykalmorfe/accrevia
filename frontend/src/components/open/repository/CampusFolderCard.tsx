import { ArrowRightIcon, FolderIcon, LucideIcon } from 'lucide-react';
import type { RepoFolderKind } from '../../../types/accreditationRepository';

const KIND_LABEL: Record<RepoFolderKind, string> = {
  campus: 'Campus',
  college: 'College',
  program: 'Academic program',
  year: 'Academic year',
  folder: 'Folder'
};

type CampusFolderCardProps = {
  name: string;
  kind: RepoFolderKind;
  description?: string;
  onOpen: () => void;
  icon?: LucideIcon;
};

export function CampusFolderCard({
  name,
  kind,
  description,
  onOpen,
  icon: Icon = FolderIcon
}: CampusFolderCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="panel panel-hover flex h-full w-full flex-col p-4 text-left no-underline transition sm:p-5"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-100 bg-brand-50 text-brand-700">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <p className="mt-3 text-[10.5px] font-bold uppercase tracking-wide text-ink-subtle">{KIND_LABEL[kind]}</p>
      <h3 className="mt-1 line-clamp-2 text-[14px] font-bold text-ink">{name}</h3>
      {description ? (
        <p className="mt-1.5 line-clamp-2 flex-1 text-[12px] font-medium leading-relaxed text-ink-muted">
          {description}
        </p>
      ) : (
        <span className="flex-1" aria-hidden="true" />
      )}
      <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700">
        Open
        <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </button>
  );
}
