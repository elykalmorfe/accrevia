import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../contexts/PortalContext';
import { processingStages } from '../data/processing';
import { FileType } from '../types/evidence';

export interface UploadItem {
  id: string;
  name: string;
  sizeMb: number;
  fileType: FileType;
  ocr: boolean;
  stage: number;
}

const LAST = processingStages.length - 1;
const MAX_BYTES = 50 * 1024 * 1024;

const SUPPORTED: Record<string, FileType> = {
  pdf: 'PDF', doc: 'DOCX', docx: 'DOCX', xls: 'XLSX', xlsx: 'XLSX', pptx: 'PPTX',
  jpg: 'JPG', jpeg: 'JPG', png: 'PNG', tif: 'TIFF', tiff: 'TIFF'
};

const sampleItem: UploadItem = {
  id: 'u-sample',
  name: 'Faculty Development Report.pdf',
  sizeMb: 3.2,
  fileType: 'PDF',
  ocr: false,
  stage: LAST
};

function suggestArea(name: string): {frameworkId: string;areaId: string;} {
  const n = name.toLowerCase();
  if (/iso|audit/.test(n)) return { frameworkId: 'iso', areaId: 'qa' };
  if (/copc/.test(n)) return { frameworkId: 'copc', areaId: 'faculty' };
  if (/faculty|training|seminar/.test(n)) return { frameworkId: 'ia', areaId: 'faculty' };
  if (/research/.test(n)) return { frameworkId: 'ia', areaId: 'research' };
  if (/extension|community/.test(n)) return { frameworkId: 'ia', areaId: 'extension' };
  if (/library/.test(n)) return { frameworkId: 'ia', areaId: 'library' };
  if (/student|osas|guidance/.test(n)) return { frameworkId: 'ia', areaId: 'students' };
  return { frameworkId: 'ia', areaId: '' };
}

export function useUploadQueue() {
  const { addPending } = usePortal();
  const [items, setItems] = useState<UploadItem[]>([sampleItem]);
  const [selectedId, setSelectedId] = useState(sampleItem.id);
  const [forceOcr, setForceOcr] = useState(false);
  const notified = useRef(new Set<string>([sampleItem.id]));

  useEffect(() => {
    if (!items.some((i) => i.stage < LAST)) return;
    const timer = setTimeout(() => {
      setItems((prev) => prev.map((i) => i.stage < LAST ? { ...i, stage: i.stage + 1 } : i));
    }, 900);
    return () => clearTimeout(timer);
  }, [items]);

  useEffect(() => {
    items.forEach((item) => {
      if (item.stage !== LAST || notified.current.has(item.id)) return;
      notified.current.add(item.id);
      addPending({
        id: `p-${item.id}`,
        fileName: item.name,
        extractedTitle: item.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
        fileType: item.fileType,
        pages: Math.max(1, Math.round(item.sizeMb * 6)),
        sizeMb: item.sizeMb,
        uploadedBy: 'Maria L. Santos',
        uploadedAt: new Date().toISOString(),
        ocr: item.ocr,
        excerpt: 'Extracted text is available for review. Confirm the classification below to make this document searchable.',
        suggestion: { ...suggestArea(item.name), docType: 'Other', confidence: 0.52 }
      });
      toast.success(`${item.name} is ready for retrieval`, {
        description: 'Added to Pending Classification for metadata review.'
      });
    });
  }, [items, addPending]);

  const addFiles = useCallback(
    (files: File[]) => {
      const accepted: UploadItem[] = [];
      const rejected: string[] = [];
      files.forEach((file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const type = SUPPORTED[ext];
        if (!type || file.size > MAX_BYTES) {
          rejected.push(file.name);
          return;
        }
        const isImage = type === 'JPG' || type === 'PNG' || type === 'TIFF';
        accepted.push({
          id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          sizeMb: Math.max(0.1, Math.round(file.size / 1024 / 1024 * 10) / 10),
          fileType: type,
          ocr: forceOcr || isImage || /scan/i.test(file.name),
          stage: 0
        });
      });
      if (rejected.length) toast.error(`Not uploaded: ${rejected.join(', ')}`, { description: 'Unsupported format or larger than 50 MB.' });
      if (accepted.length) {
        setItems((prev) => [...accepted, ...prev]);
        setSelectedId(accepted[0].id);
      }
    },
    [forceOcr]
  );

  const removeItem = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);

  const selected = items.find((i) => i.id === selectedId) ?? items[0] ?? null;

  return { items, selected, setSelectedId, addFiles, removeItem, forceOcr, setForceOcr, lastStage: LAST };
}