import { XIcon } from 'lucide-react';
import { fileTypeStyle, formatBytes } from './fileTypeStyle';

export interface StagedFile {
  name: string;
  size: number;
  path?: string;
}

interface StagedFileListProps {
  items: StagedFile[];
  onRemove?: (index: number) => void;
  onClear?: () => void;
  title?: string;
}

export function StagedFileList({ items, onRemove, onClear, title = 'Ready for upload' }: StagedFileListProps) {
  if (items.length === 0) return null;
  const totalBytes = items.reduce((sum, i) => sum + i.size, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-canvas/60 px-3 py-2">
        <p className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
          <span className="h-2 w-2 rounded-full bg-success-600" aria-hidden="true" />
          {title} ({items.length} {items.length === 1 ? 'file' : 'files'} · {formatBytes(totalBytes)})
        </p>
        {onClear && (
          <button type="button" onClick={onClear} className="text-[11.5px] font-semibold text-danger-600 hover:underline">
            Clear all
          </button>
        )}
      </div>
      <ul className="max-h-52 divide-y divide-line overflow-y-auto">
        {items.map((item, index) => {
          const style = fileTypeStyle(item.name);
          const Icon = style.icon;
          return (
            <li key={`${item.path ?? item.name}-${index}`} className="flex items-center gap-2.5 px-3 py-2">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1 ${style.className}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink" title={item.path || item.name}>
                {item.path || item.name}
              </span>
              <span className="shrink-0 text-[11px] text-ink-subtle">{formatBytes(item.size)}</span>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={`Remove ${item.name}`}
                  className="rounded-md p-1 text-ink-subtle hover:bg-canvas hover:text-ink"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
