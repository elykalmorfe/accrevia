import React from 'react';
import { AlertTriangleIcon, FolderIcon, ShieldAlertIcon } from 'lucide-react';
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
      title={isProtected ? 'Protected System Folder' : `Delete Folder "${folder.name}"?`}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            {isProtected ? 'Close' : 'Cancel'}
          </button>
          {!isProtected && (
            <button
              type="button"
              onClick={() => {
                onConfirm(folder.id);
                onClose();
              }}
              className="btn btn-danger"
            >
              Delete Folder
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {isProtected ? (
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-xs text-brand-900">
            <div className="flex items-start gap-2.5">
              <ShieldAlertIcon className="h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="font-semibold text-sm">System Framework Folder</p>
                <p className="mt-1 text-ink-muted">
                  <strong>{folder.name}</strong> is a core university accreditation framework (AACCUP / CHED / PQA / ISO). System folders cannot be deleted to prevent data inconsistency in official audits.
                </p>
                <p className="mt-2 text-ink-muted">
                  Tip: You can use <strong>Edit Folder</strong> to modify its description, color, or upload guidelines.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-xs text-danger-900">
            <div className="flex items-start gap-2.5">
              <AlertTriangleIcon className="h-5 w-5 shrink-0 text-danger-600" />
              <div>
                <p className="font-semibold text-sm">Are you sure you want to delete this folder?</p>
                <p className="mt-1 text-ink-muted">
                  Folder <strong>{folder.name}</strong> will be removed from your directory.
                  {documentCount > 0 && (
                    <span className="block mt-1 font-medium text-danger-700">
                      Note: This folder currently contains {documentCount} document(s).
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 rounded-md border border-line bg-canvas p-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white shadow-xs">
            <FolderIcon className="h-5 w-5 text-brand-600" />
          </span>
          <div className="min-w-0 flex-1 text-xs">
            <p className="font-semibold text-ink truncate">{folder.name}</p>
            <p className="text-ink-muted">{folder.category} · {documentCount} document(s)</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
