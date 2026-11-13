import { DragEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { CloudUploadIcon, FolderUpIcon, UploadIcon } from 'lucide-react';
import { filesFromDrop, filesFromInput, PendingUpload } from '../../utils/dropFiles';
import { uploadAcceptAttribute } from '../../utils/uploadRules';
import { getSettings } from '../../settings/portalSettings';

/** Drag state for any element that accepts dropped files; a depth counter keeps nested children from flickering it. */
export function useFileDrop(onFiles: (uploads: PendingUpload[]) => void, { allowFolders = true, disabled = false } = {}) {
  const [dragActive, setDragActive] = useState(false);
  const depth = useRef(0);

  const handlers = {
    onDragEnter: (e: DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      depth.current += 1;
      setDragActive(true);
    },
    onDragOver: (e: DragEvent) => e.preventDefault(),
    onDragLeave: () => {
      depth.current = Math.max(0, depth.current - 1);
      if (!depth.current) setDragActive(false);
    },
    onDrop: async (e: DragEvent) => {
      e.preventDefault();
      depth.current = 0;
      setDragActive(false);
      if (disabled) return;
      const uploads = await filesFromDrop(e, allowFolders);
      if (uploads.length) onFiles(uploads);
    }
  };

  return { dragActive, handlers };
}

function defaultHint(): string {
  const { allowedTypes, maxFileSizeMb } = getSettings().uploads;
  return `${allowedTypes.join(', ')} · up to ${maxFileSizeMb} MB each`;
}

interface CommonProps {
  onFiles: (uploads: PendingUpload[]) => void;
  /** Keep folder structure when folders are dropped. */
  allowFolders?: boolean;
  disabled?: boolean;
}

interface AreaProps extends CommonProps {
  variant: 'area';
  /** Shown in the overlay: "Drop to upload into …". */
  targetLabel: string;
  overlayHint?: string;
  className?: string;
  children: ReactNode;
}

interface BoxProps extends CommonProps {
  variant?: 'box';
  title?: ReactNode;
  hint?: ReactNode;
  browseLabel?: string;
  accept?: string;
  multiple?: boolean;
  /** Browse opens a folder picker instead of a file picker. */
  selectFolder?: boolean;
  compact?: boolean;
  className?: string;
}

export type UploadDropzoneProps = AreaProps | BoxProps;

export function UploadDropzone(props: UploadDropzoneProps) {
  return props.variant === 'area' ? <AreaDropzone {...props} /> : <BoxDropzone {...props} />;
}

function AreaDropzone({ onFiles, allowFolders = true, disabled, targetLabel, overlayHint, className = '', children }: AreaProps) {
  const { dragActive, handlers } = useFileDrop(onFiles, { allowFolders, disabled });
  return (
    <div
      {...handlers}
      className={`relative rounded-2xl border p-4 transition-colors ${
        dragActive ? 'border-brand-400 bg-brand-50/60' : 'border-line bg-canvas/60'
      } ${className}`}
    >
      {dragActive && (
        <div className="pointer-events-none absolute inset-2 z-10 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-400 bg-white/85 backdrop-blur-sm">
          <CloudUploadIcon className="h-10 w-10 animate-bounce text-brand-600" />
          <p className="mt-2 px-4 text-center text-[14px] font-bold text-brand-700">Drop to upload into “{targetLabel}”</p>
          <p className="text-[12px] text-ink-subtle">{overlayHint ?? (allowFolders ? 'Folder structure is preserved' : 'Files only')}</p>
        </div>
      )}
      {children}
    </div>
  );
}

function BoxDropzone({
  onFiles,
  allowFolders = false,
  disabled,
  title,
  hint,
  browseLabel,
  accept,
  multiple = true,
  selectFolder = false,
  compact = false,
  className = ''
}: BoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { dragActive, handlers } = useFileDrop(onFiles, { allowFolders: allowFolders || selectFolder, disabled });

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (selectFolder) {
      input.setAttribute('webkitdirectory', '');
      input.setAttribute('directory', '');
    } else {
      input.removeAttribute('webkitdirectory');
      input.removeAttribute('directory');
    }
  }, [selectFolder]);

  const browse = () => {
    if (!disabled) inputRef.current?.click();
  };

  const Icon = selectFolder ? FolderUpIcon : CloudUploadIcon;

  return (
    <div
      {...handlers}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={browse}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          browse();
        }
      }}
      className={`group flex flex-col items-center justify-center rounded-xl border-2 border-dashed text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-200 ${
        compact ? 'px-4 py-5' : 'px-6 py-8'
      } ${
        disabled
          ? 'cursor-not-allowed border-line bg-canvas/60 opacity-60'
          : dragActive
          ? 'cursor-copy border-brand-400 bg-brand-50/60'
          : 'cursor-pointer border-line bg-white/70 hover:border-brand-300 hover:bg-brand-50/30'
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={multiple || selectFolder}
        accept={selectFolder ? undefined : accept ?? uploadAcceptAttribute()}
        onChange={(e) => {
          const uploads = filesFromInput(e.target.files);
          e.target.value = '';
          if (uploads.length) onFiles(multiple || selectFolder ? uploads : uploads.slice(0, 1));
        }}
      />
      <span
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-500 text-white shadow-lg shadow-brand-500/30 transition-transform group-hover:scale-105 ${
          compact ? 'h-10 w-10' : 'h-12 w-12'
        }`}
      >
        <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
      </span>
      <p className={`mt-3 font-bold text-ink ${compact ? 'text-[13px]' : 'text-[14px]'}`}>
        {dragActive
          ? 'Drop to add'
          : title ?? (selectFolder ? 'Drag a folder here' : multiple ? 'Drag & drop files here' : 'Drag & drop a file here')}
      </p>
      <p className="mt-1 max-w-sm text-[12px] text-ink-muted">{hint ?? defaultHint()}</p>
      {!compact && (
        <span className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-[13px] font-semibold text-white shadow-sm shadow-brand-600/30 transition group-hover:bg-brand-700">
          <UploadIcon className="h-4 w-4" />
          {browseLabel ?? (selectFolder ? 'Choose folder' : multiple ? 'Browse files' : 'Choose file')}
        </span>
      )}
    </div>
  );
}
