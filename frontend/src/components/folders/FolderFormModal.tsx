import React, { useEffect, useState } from 'react';
import {
  FolderPlusIcon,
  CheckIcon,
  CalendarIcon,
  FolderIcon,
  FileTextIcon,
  ClockIcon
} from 'lucide-react';
import { EvidenceFolder, FrameworkCategory } from '../../types/evidence';
import { Modal } from '../ui/Modal';
import { TextField } from '../ui/TextField';

interface FolderFormModalProps {
  open: boolean;
  folder?: EvidenceFolder | null;
  parentId?: string;
  frameworkId?: string;
  category?: FrameworkCategory | 'General / Custom';
  simplified?: boolean;
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
  frameworkId,
  category,
  simplified,
  initialAreaId,
  initialName,
  initialCode,
  onClose,
  onSave
}: FolderFormModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expiredDate, setExpiredDate] = useState('');
  const [hasNoDeadline, setHasNoDeadline] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setCode(folder.code || '');
      setDescription(folder.description || '');
      setStartDate(folder.startDate || folder.createdAt || new Date().toISOString().slice(0, 10));
      setExpiredDate(folder.expiredDate || '');
      setHasNoDeadline(folder.hasNoDeadline ?? (folder.expiredDate === null));
    } else {
      setName(initialName || '');
      setCode(initialCode || '');
      setDescription('');
      setStartDate(new Date().toISOString().slice(0, 10));
      setExpiredDate('');
      setHasNoDeadline(false);
    }
    setError('');
  }, [folder, open, initialName, initialCode]);

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a folder name.');
      return;
    }
    const safeCode = (code.trim() || folder?.code || initialCode || name.slice(0, 4)).toUpperCase();
    const folderToSave: EvidenceFolder = {
      id: folder ? folder.id : `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      code: safeCode,
      frameworkId: folder?.frameworkId || frameworkId || 'ia',
      category: folder?.category || category || 'Accreditation',
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
      title={folder ? 'Edit Evidence Folder' : 'Create Evidence Folder'}
      description={
        simplified
          ? (folder ? 'Update folder name, code, and guidelines.' : 'Create a new folder portfolio with guidelines.')
          : (folder ? 'Update folder name, code, timeline dates, and guidelines.' : 'Create a new evidence portfolio with designated start date and deadline.')
      }
      footer={
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary w-full sm:w-auto text-xs font-semibold h-9 px-4"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary w-full sm:w-auto text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs"
          >
            {folder ? (
              <>
                <CheckIcon className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </>
            ) : (
              <>
                <FolderPlusIcon className="h-3.5 w-3.5" />
                <span>Create Folder</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700 shadow-2xs">
            {error}
          </div>
        )}

        {/* 1. Folder Name & Code */}
        <div className="space-y-3">
          <TextField
            label="Folder Name"
            value={name}
            onChange={(val) => {
              setName(val);
              if (error) setError('');
              if (!folder && !code) {
                setCode(val.slice(0, 4).toUpperCase());
              }
            }}
            placeholder="e.g. Governance & Administrative Manual, OBE Syllabi Matrix"
            required
          />

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Folder Code / Acronym (Optional)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. GOV, OBE-2025"
              className="input text-xs w-full bg-white font-mono uppercase"
              maxLength={12}
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Short identifier used for indexing and quick search tags.
            </p>
          </div>
        </div>

        {/* 2. Timeline & Expiration Card (Hidden in simplified mode) */}
        {!simplified && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 sm:p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-800">Timeline & Expiration</span>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none font-medium bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
              <input
                type="checkbox"
                checked={hasNoDeadline}
                onChange={(e) => setHasNoDeadline(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
              />
              <span>No Deadline / Indefinite</span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input text-xs w-full bg-white font-medium"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Expired Date / Deadline
                {hasNoDeadline && <span className="text-slate-400 ml-1 font-normal">(None)</span>}
              </label>
              <input
                type="date"
                value={hasNoDeadline ? '' : expiredDate}
                disabled={hasNoDeadline}
                onChange={(e) => setExpiredDate(e.target.value)}
                className={`input text-xs w-full ${hasNoDeadline ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-dashed' : 'bg-white font-medium'}`}
                placeholder={hasNoDeadline ? 'No deadline' : ''}
              />
            </div>
          </div>

          {hasNoDeadline ? (
            <p className="text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/60 rounded-md p-1.5 flex items-center gap-1.5">
              <span>✓</span>
              <span>This folder will remain active indefinitely with no expiration date.</span>
            </p>
          ) : (
            <p className="text-[10px] text-slate-500">
              Set a deadline to help accreditation chairs track evidence submission timelines.
            </p>
          )}
        </div>
        )}

        {/* 3. Folder Description & Guidelines */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Folder Description & Guidelines
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="textarea text-xs w-full bg-white"
            placeholder="Explain what documents belong to this specific folder (e.g. BOR resolutions, approved university policies, annual accomplishment reports)..."
          />
        </div>
      </div>
    </Modal>
  );
}
