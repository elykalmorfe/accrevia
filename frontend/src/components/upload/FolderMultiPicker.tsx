import { FolderIcon } from 'lucide-react';

interface FolderMultiPickerProps {
  parentName: string;
  folders: string[];
  selected: string[];
  looseFileCount: number;
  includeLoose: boolean;
  busy: boolean;
  onToggle: (name: string) => void;
  onSelectedChange: (names: string[]) => void;
  onIncludeLoose: (include: boolean) => void;
  onChooseDifferent: () => void;
  onCancel: () => void;
  onAdd: () => void;
}

export function FolderMultiPicker({
  parentName,
  folders,
  selected,
  looseFileCount,
  includeLoose,
  busy,
  onToggle,
  onSelectedChange,
  onIncludeLoose,
  onChooseDifferent,
  onCancel,
  onAdd
}: FolderMultiPickerProps) {
  const allSelected = folders.length > 0 && selected.length === folders.length;
  const addLabel =
    selected.length === 0 ? 'Add files' : selected.length === 1 ? 'Add 1 folder' : `Add ${selected.length} folders`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-900">Select folders in {parentName}</p>
          <p className="text-[11px] text-slate-500">
            {selected.length} of {folders.length} selected. These upload together.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelectedChange(allSelected ? [] : folders)}
          className="shrink-0 text-[12px] font-semibold text-brand-700 hover:underline"
        >
          {allSelected ? 'Clear' : 'Select all'}
        </button>
      </div>
      <ul className="max-h-52 divide-y divide-slate-100 overflow-y-auto">
        {folders.map((name) => {
          const checked = selected.includes(name);
          return (
            <li key={name}>
              <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(name)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                <FolderIcon className="h-4 w-4 shrink-0 text-amber-500" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-800">{name}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {looseFileCount > 0 && (
        <label className="flex cursor-pointer items-center gap-2.5 border-t border-slate-200 px-3 py-2 text-[12px] text-slate-700">
          <input
            type="checkbox"
            checked={includeLoose}
            onChange={(e) => onIncludeLoose(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600"
          />
          Also include {looseFileCount} {looseFileCount === 1 ? 'file' : 'files'} sitting in {parentName}
        </label>
      )}
      <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/80 px-3 py-2">
        <button type="button" onClick={onChooseDifferent} className="text-[12px] font-semibold text-slate-600 hover:text-slate-900 hover:underline">
          Choose a different folder
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="btn btn-secondary h-8 px-3 text-[12px]">
            Cancel
          </button>
          <button type="button" onClick={onAdd} disabled={busy || (selected.length === 0 && !includeLoose)} className="btn btn-primary h-8 px-3 text-[12px]">
            {busy ? 'Reading folders…' : addLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
