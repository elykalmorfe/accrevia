import React from 'react';
import {
  AlertTriangleIcon,
  FolderIcon,
  ShieldAlertIcon,
  Trash2Icon,
  FileTextIcon,
  CalendarIcon,
  Building2Icon
} from 'lucide-react';
import { EvidenceFolder } from '../../types/evidence';
import { Modal } from '../ui/Modal';

interface DeleteFolderModalProps {
  open: boolean;
  folder: EvidenceFolder | null;
  documentCount: number;
  onClose: () => void;
  onConfirm: (folderId: string) => void;
}

export function DeleteFolderModal({
  open,
  folder,
  documentCount,
  onClose,
  onConfirm
}: DeleteFolderModalProps) {
  if (!folder) return null;

  const isProtected = folder.isSystem;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isProtected ? 'Protected System Folder' : 'Delete Evidence Folder'}
      description={
        isProtected
          ? 'Core university accreditation framework portfolios cannot be deleted.'
          : 'Please review folder details carefully before confirming deletion.'
      }
      size="md"
      footer={
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary w-full sm:w-auto text-xs font-semibold h-9 px-4"
          >
            {isProtected ? 'Close' : 'Cancel'}
          </button>
          {!isProtected && (
            <button
              type="button"
              onClick={() => {
                onConfirm(folder.id);
                onClose();
              }}
              className="btn btn-danger w-full sm:w-auto text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs"
            >
              <Trash2Icon className="h-3.5 w-3.5" />
              <span>Delete Folder</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Warning or Protected Banner */}
        {isProtected ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50/70 p-4 text-xs text-brand-900 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700 shrink-0">
                <ShieldAlertIcon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-brand-900">Official System Framework</p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>{folder.name}</strong> is a core university accreditation framework (AACCUP / CHED / PQA / ISO). System folders cannot be deleted to ensure data integrity during formal institutional accreditation audits.
                </p>
                <p className="text-[11px] text-brand-700 font-medium pt-1">
                  💡 Tip: You can use <strong>Edit Folder</strong> to update description, timeline, or color.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-danger-200 bg-danger-50/70 p-4 text-xs text-danger-900 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-100 text-danger-700 shrink-0">
                <AlertTriangleIcon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-danger-900">Are you sure you want to delete this folder?</p>
                <p className="text-slate-600 leading-relaxed">
                  This action cannot be undone. Folder <strong>{folder.name}</strong> will be permanently removed from your campus repository.
                </p>
                {documentCount > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-danger-800 font-semibold bg-danger-100/80 px-2.5 py-1 rounded-md border border-danger-200 text-[11px]">
                    <FileTextIcon className="h-3.5 w-3.5 text-danger-600 shrink-0" />
                    <span>Warning: This folder currently contains {documentCount} attached evidence document(s).</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Folder Details Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-2xs text-amber-600 shrink-0">
              <FolderIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs text-slate-800 truncate">{folder.name}</h4>
                <span className="font-mono text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                  {folder.code || 'FOLDER'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                {folder.description || 'No description provided.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70 text-[11px]">
            {folder.campus && (
              <span className="inline-flex items-center gap-1 text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                <Building2Icon className="h-3 w-3 text-brand-600" />
                <span>{folder.campus}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium">
              <FileTextIcon className="h-3 w-3 text-slate-500" />
              <span>{documentCount} document{documentCount === 1 ? '' : 's'}</span>
            </span>
            {(folder.startDate || folder.createdAt) && (
              <span className="inline-flex items-center gap-1 text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                <CalendarIcon className="h-3 w-3 text-slate-400" />
                <span>Created {folder.startDate || folder.createdAt}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
