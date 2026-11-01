import React, { useEffect, useState } from 'react';
import { EvidenceFolder } from '../../types/evidence';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';

interface FolderFormModalProps {
  open: boolean;
  folder?: EvidenceFolder | null;
  parentId?: string;
  initialAreaId?: string;
  initialName?: string;
  initialCode?: string;
  onClose: () => void;
  onSave: (folder: EvidenceFolder) => void;
}

export function FolderFormModal({
  open,
  folder,
  parentId,
  initialAreaId,
  initialName,
  initialCode,
  onClose,
  onSave
}: FolderFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expiredDate, setExpiredDate] = useState('');
  const [hasNoDeadline, setHasNoDeadline] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setDescription(folder.description);
      setStartDate(folder.startDate || folder.createdAt || new Date().toISOString().slice(0, 10));
      setExpiredDate(folder.expiredDate || '');
      setHasNoDeadline(folder.hasNoDeadline ?? (folder.expiredDate === null));
    } else {
      setName(initialName || '');
      setDescription('');
      setStartDate(new Date().toISOString().slice(0, 10));
      setExpiredDate('');
      setHasNoDeadline(false);
    }
    setError('');
  }, [folder, open, initialName]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a folder name.');
      return;
    }
    const safeCode = folder?.code || initialCode || name.slice(0, 4).toUpperCase();
    const folderToSave: EvidenceFolder = {
      id: folder ? folder.id : `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      code: safeCode,
      frameworkId: folder?.frameworkId || 'ia',
      category: folder?.category || 'Accreditation',
      description: description.trim(),
      isSystem: folder?.isSystem ?? false,
      color: folder?.color || 'blue',
      createdAt: folder?.createdAt || new Date().toISOString().slice(0, 10),
      parentId: folder?.parentId ?? parentId,
      areaId: folder?.areaId ?? initialAreaId,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      expiredDate: hasNoDeadline ? null : expiredDate || null,
      hasNoDeadline
    };
    onSave(folderToSave);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      footer={
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 w-full">
          <button type="button" onClick={onClose} className="btn btn-secondary w-full sm:w-auto text-xs">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="btn btn-primary w-full sm:w-auto text-xs">
            {folder ? 'Save Changes' : 'Create Folder'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">
            {error}
          </div>
        )}

        {/* 1. Folder Name */}
        <TextField
          label="Folder Name"
          value={name}
          onChange={(val) => {
            setName(val);
            if (error) setError('');
          }}
          placeholder="e.g. Governance & Administrative Operations Manual, OBE Syllabi Matrix"
          required
        />

        {/* 2. Timeline & Expiration */}
        <div className="rounded-lg border border-line bg-canvas/40 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink">Timeline & Expiration</span>
            <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer select-none font-medium">
              <input
                type="checkbox"
                checked={hasNoDeadline}
                onChange={(e) => setHasNoDeadline(e.target.checked)}
                className="rounded border-line text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
              <span>No Due Date / No Deadline</span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input text-xs"
                required
              />
            </div>

            <div>
              <label className="label">
                Expired Date / Deadline
                {hasNoDeadline && <span className="text-ink-subtle ml-1 font-normal">(None)</span>}
              </label>
              <input
                type="date"
                value={hasNoDeadline ? '' : expiredDate}
                disabled={hasNoDeadline}
                onChange={(e) => setExpiredDate(e.target.value)}
                className={`input text-xs ${hasNoDeadline ? 'bg-slate-100 text-ink-subtle cursor-not-allowed border-dashed' : ''}`}
                placeholder={hasNoDeadline ? 'No deadline' : ''}
              />
              {hasNoDeadline && (
                <p className="text-[10px] text-emerald-700 font-medium mt-1">
                  ✓ Folder remains active indefinitely with no deadline.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. Folder Description & Guidelines */}
        <div>
          <label className="label">Folder Description & Guidelines</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="textarea text-xs"
            placeholder="Explain what documents belong to this specific folder (e.g. BOR resolutions, approved policies, annual accomplishment reports)..."
          />
        </div>
      </div>
    </Modal>
  );
}
