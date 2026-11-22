import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { usePortal } from '../../contexts/PortalContext';
import { CampusId, COPCRecord, COPCRequirementItem, RequirementVerificationStatus } from '../../types/accreditation';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  SearchIcon,
  FileTextIcon,
  XIcon,
  EyeIcon,
  UploadIcon,
  PencilIcon,
  AwardIcon,
  PrinterIcon,
  DownloadIcon,
  ShieldCheckIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileCheckIcon
} from 'lucide-react';
import { deleteStoredFile, getStoredFile, persistUpload } from '../../utils/fileStore';
import { fileTypeFromName } from '../../utils/fileTypes';
import type { EvidenceDocument } from '../../types/evidence';
import { UploadDropzone } from '../../components/upload/UploadDropzone';
import { FileList, FileRow, FileRowAction } from '../../components/upload/FileRow';
import { useInstitutionalMutationAccess } from '../../hooks/useInstitutionalMutationAccess';
import { isUrl } from '../../utils/programAccreditation';
import { isLocalCertificatePath } from '../../utils/linkedCertificates';
import { fetchRepositoryFile, isRepositoryFile } from '../../utils/repositoryFiles';
import { CopcDocumentsModal } from '../../components/accreditation/CopcDocumentsModal';

function borResHref(value?: string): string | undefined {
  const v = (value || '').trim();
  if (!v) return undefined;
  if (isUrl(v) || isLocalCertificatePath(v) || v.startsWith('/')) return v;
  return undefined;
}

/** Starting zoom so the 640px-wide paper preview fits narrow screens. */
function fitPaperZoom(): number {
  const available = window.innerWidth - 72;
  return available >= 640 ? 100 : Math.max(40, Math.floor((available / 640) * 100));
}

export function COPCView() {
  const {
    campuses,
    copcRecords,
    updateCOPCRecord,
    updateCOPCRequirement,
    addDocument,
    currentUser,
    selectedCampus,
    setSelectedCampus
  } = usePortal();
  const { canMutate } = useInstitutionalMutationAccess();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Certificate / BOR / Requirements Viewer Modal (same chrome for Certificate Number & BOR Resolution)
  const [viewingCertificateCopc, setViewingCertificateCopc] = useState<COPCRecord | null>(null);
  const [viewModalTab, setViewModalTab] = useState<'certificate' | 'bor' | 'requirements'>('certificate');
  const [selectedPreviewReq, setSelectedPreviewReq] = useState<COPCRequirementItem | null>(null);
  const [docsModalCopc, setDocsModalCopc] = useState<COPCRecord | null>(null);
  const [docsModalFolder, setDocsModalFolder] = useState<'certificate' | 'bor'>('certificate');

  const openCopcDocs = (copc: COPCRecord, folder: 'certificate' | 'bor' = 'certificate') => {
    setDocsModalFolder(folder);
    setDocsModalCopc(copc);
  };

  const [officialCertUrl, setOfficialCertUrl] = useState<string | null>(null);
  const [officialCertKind, setOfficialCertKind] = useState<'pdf' | 'image' | null>(null);
  const [officialCertLoading, setOfficialCertLoading] = useState(false);
  const [officialCertMissing, setOfficialCertMissing] = useState(false);

  const [borDocUrl, setBorDocUrl] = useState<string | null>(null);
  const [borDocKind, setBorDocKind] = useState<'pdf' | 'image' | null>(null);
  const [borDocLoading, setBorDocLoading] = useState(false);
  const [borDocMissing, setBorDocMissing] = useState(false);

  const certificateKind = (blob: Blob, name: string): 'pdf' | 'image' | null => {
    const type = (blob.type || '').toLowerCase();
    if (type.includes('html') || type.startsWith('text/')) return null;
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
    return null;
  };

  const loadOfficialCertificate = async (copc: COPCRecord) => {
    setOfficialCertLoading(true);
    setOfficialCertUrl(null);
    setOfficialCertKind(null);
    setOfficialCertMissing(false);
    const key = `${copc.id}-COPC-CERT`;
    const link = copc.documentLink?.trim();
    try {
      const stored = await getStoredFile(key);
      if (stored?.blob && await isRepositoryFile(stored.blob, stored.name || link || '')) {
        const kind = certificateKind(stored.blob, stored.name || link || '');
        if (kind) {
          setOfficialCertUrl(URL.createObjectURL(stored.blob));
          setOfficialCertKind(kind);
          setOfficialCertLoading(false);
          return;
        }
        deleteStoredFile(key).catch(() => undefined);
      }
    } catch {
      // fall through to documentLink
    }

    if (link?.startsWith('/certificates/') || link?.startsWith('blob:')) {
      try {
        if (link.startsWith('blob:')) {
          setOfficialCertUrl(link);
          setOfficialCertKind(/\.(png|jpe?g|gif|webp)(\?|$)/i.test(link) ? 'image' : 'pdf');
          setOfficialCertLoading(false);
          return;
        }
        const blob = await fetchRepositoryFile(link);
        if (blob) {
          const name = link.split('/').pop() || '';
          const kind = certificateKind(blob, name);
          if (kind) {
            persistUpload(key, blob, name);
            setOfficialCertUrl(URL.createObjectURL(blob));
            setOfficialCertKind(kind);
            setOfficialCertLoading(false);
            return;
          }
        }
      } catch {
        // ignore
      }
      setOfficialCertMissing(true);
    } else if (link) {
      setOfficialCertMissing(true);
    }
    setOfficialCertLoading(false);
  };

  const loadBorDocument = async (copc: COPCRecord) => {
    setBorDocLoading(true);
    setBorDocUrl(null);
    setBorDocKind(null);
    setBorDocMissing(false);
    const href = borResHref(copc.borRes);
    if (!href) {
      setBorDocMissing(true);
      setBorDocLoading(false);
      return;
    }
    try {
      if (isUrl(href)) {
        setBorDocUrl(href);
        setBorDocKind('pdf');
        setBorDocLoading(false);
        return;
      }
      const blob = isLocalCertificatePath(href)
        ? await fetchRepositoryFile(href)
        : await fetch(href).then((response) => response.ok ? response.blob() : undefined);
      if (!blob || !(await isRepositoryFile(blob, href))) {
        setBorDocMissing(true);
        setBorDocLoading(false);
        return;
      }
      const kind = certificateKind(blob, href);
      if (!kind) {
        setBorDocMissing(true);
        setBorDocLoading(false);
        return;
      }
      setBorDocUrl(URL.createObjectURL(blob));
      setBorDocKind(kind);
    } catch {
      setBorDocMissing(true);
    }
    setBorDocLoading(false);
  };

  const closeViewModal = () => {
    if (officialCertUrl?.startsWith('blob:')) URL.revokeObjectURL(officialCertUrl);
    if (borDocUrl?.startsWith('blob:')) URL.revokeObjectURL(borDocUrl);
    setOfficialCertUrl(null);
    setOfficialCertKind(null);
    setBorDocUrl(null);
    setBorDocKind(null);
    setViewingCertificateCopc(null);
  };

  const handleOpenView = (
    copc: COPCRecord,
    defaultTab: 'certificate' | 'bor' | 'requirements' = 'certificate'
  ) => {
    if (officialCertUrl?.startsWith('blob:')) URL.revokeObjectURL(officialCertUrl);
    if (borDocUrl?.startsWith('blob:')) URL.revokeObjectURL(borDocUrl);
    setOfficialCertUrl(null);
    setBorDocUrl(null);
    setViewingCertificateCopc(copc);
    setViewModalTab(defaultTab);
    setSelectedPreviewReq(null);
    if (defaultTab === 'bor') {
      void loadBorDocument(copc);
      void loadOfficialCertificate(copc);
    } else {
      void loadOfficialCertificate(copc);
      if (borResHref(copc.borRes)) void loadBorDocument(copc);
    }
  };

  // Real PDF Document Viewer Modal State (shows actual uploaded file or authentic CHED compliance PDF)
  const [activePdfDoc, setActivePdfDoc] = useState<{
    copcRecord: COPCRecord;
    req: COPCRequirementItem;
    reqIdx: number;
    blobUrl?: string;
  } | null>(null);
  const [uploadedBlobMap, setUploadedBlobMap] = useState<Record<string, string>>({});
  const [pdfZoom, setPdfZoom] = useState<number>(fitPaperZoom);

  const openPdfViewer = async (copc: COPCRecord, req: COPCRequirementItem, reqIdx: number) => {
    const key = `${copc.id}-${req.code}`;
    let blobUrl = uploadedBlobMap[key] || (req.documentUrl?.startsWith('blob:') ? req.documentUrl : undefined);
    if (!blobUrl) {
      try {
        const stored = await getStoredFile(key);
        if (stored?.blob) {
          const loadedUrl = URL.createObjectURL(stored.blob);
          blobUrl = loadedUrl;
          setUploadedBlobMap((prev) => ({ ...prev, [key]: loadedUrl }));
        }
      } catch {
        // Fallback to simulated PDF view
      }
    }
    setActivePdfDoc({
      copcRecord: copc,
      req,
      reqIdx,
      blobUrl
    });
    setPdfZoom(fitPaperZoom());
  };

  const handleSwitchPdfReq = (delta: number) => {
    if (!activePdfDoc) return;
    const reqs = activePdfDoc.copcRecord.requirements;
    const newIdx = (activePdfDoc.reqIdx + delta + reqs.length) % reqs.length;
    const targetReq = reqs[newIdx];
    openPdfViewer(activePdfDoc.copcRecord, targetReq, newIdx);
  };

  const handleDownloadPdf = () => {
    if (!activePdfDoc) return;
    const fileName = activePdfDoc.req.documentName || `${activePdfDoc.req.code}_Compliance_Evidence.pdf`;
    if (activePdfDoc.blobUrl) {
      const a = document.createElement('a');
      a.href = activePdfDoc.blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`Downloaded ${fileName}`);
    } else {
      window.print();
    }
  };

  // Edit Modal State (can edit Program Details, Uploaded Certificate, and 5/5 Requirements Audit)
  const [editingCopc, setEditingCopc] = useState<COPCRecord | null>(null);
  const [editActiveTab, setEditActiveTab] = useState<'details' | 'requirements'>('details');
  const [editForm, setEditForm] = useState({
    copcStatus: 'Compliant' as 'Compliant' | 'Pending Review' | 'Non-Compliant' | 'Not Applicable (Under 5 years)',
    certificateNumber: '',
    dateIssued: '',
    cmoNo: '',
    borRes: '',
    certFileName: '',
    documentLink: '',
    remarks: ''
  });
  const [editReqs, setEditReqs] = useState<COPCRequirementItem[]>([]);
  const [editSelectedReqCode, setEditSelectedReqCode] = useState<string>('COPC-CURR');
  const [editSimulatedUploading, setEditSimulatedUploading] = useState<boolean>(false);

  // Dedicated Upload Modal State
  const [uploadCopc, setUploadCopc] = useState<COPCRecord | null>(null);
  const [selectedReqCode, setSelectedReqCode] = useState<string>('COPC-CURR');
  const [uploadDocName, setUploadDocName] = useState<string>('');
  const [uploadDocUrl, setUploadDocUrl] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<RequirementVerificationStatus>('Approved');
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [simulatedUploading, setSimulatedUploading] = useState<boolean>(false);
  const [showDropzone, setShowDropzone] = useState<boolean>(false);
  // Guarantee window and body scrolling is smoothly unlocked whenever no modals are active
  useEffect(() => {
    const hasAnyModal = Boolean(
      viewingCertificateCopc || activePdfDoc || uploadCopc || editingCopc
    );
    if (!hasAnyModal) {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewingCertificateCopc, activePdfDoc, uploadCopc, editingCopc]);

  const handleOpenUpload = (copc: COPCRecord) => {
    if (!canMutate) return;
    setUploadCopc(copc);
    setSelectedReqCode('COPC-CERT');
    const certName = copc.certificateNumber
      ? `${copc.programName.replace(/[^a-zA-Z0-9]/g, '_')}_Official_COPC_Certificate.pdf`
      : '';
    setUploadDocName(certName);
    setUploadDocUrl(copc.documentLink || '');
    setUploadStatus(copc.copcStatus === 'Compliant' ? 'Approved' : 'Under Review');
    setUploadNotes(copc.remarks || '');
    setShowDropzone(!copc.documentLink && !copc.certificateNumber);
  };

  const handleSelectReqTab = (code: string) => {
    if (!uploadCopc) return;
    setSelectedReqCode(code);

    if (code === 'COPC-CERT') {
      const certName = uploadCopc.certificateNumber
        ? `${uploadCopc.programName.replace(/[^a-zA-Z0-9]/g, '_')}_Official_COPC_Certificate.pdf`
        : '';
      setUploadDocName(certName);
      setUploadDocUrl(uploadCopc.documentLink || '');
      setUploadStatus(uploadCopc.copcStatus === 'Compliant' ? 'Approved' : 'Under Review');
      setUploadNotes(uploadCopc.remarks || '');
      setShowDropzone(!uploadCopc.documentLink && !uploadCopc.certificateNumber);
      return;
    }

    const target = uploadCopc.requirements.find((r) => r.code === code);
    if (target) {
      setUploadDocName(target.documentName || '');
      setUploadDocUrl(target.documentUrl || '');
      setUploadStatus(target.status === 'Pending' ? 'Approved' : target.status);
      setUploadNotes(target.deficiencyNote || '');
      // If already uploaded, hide dropzone; if pending/empty, show dropzone
      setShowDropzone(!target.isSubmitted && !target.documentName);
    }
  };

  const copyIntoCopcFolder = (file: File, record: COPCRecord) => {
    const id = `doc-copc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const today = new Date().toISOString().slice(0, 10);
    const document: EvidenceDocument = {
      id,
      title: file.name.replace(/\.[^.]+$/, '') || file.name,
      description: `${record.programName} COPC file`,
      keywords: ['COPC', 'CHED', record.programName],
      frameworkId: 'copc',
      areaId: 'copc',
      criterionId: '',
      indicatorId: '',
      docType: 'Certificate',
      academicYear: String(new Date().getFullYear()),
      cycle: 'CHED COPC',
      program: record.programName,
      college: '—',
      department: '—',
      office: 'Quality Assurance Office',
      campus: record.campusName,
      campusId: record.campusId,
      documentDate: today,
      confidentiality: 'Internal',
      status: 'Indexed',
      dateAdded: today,
      fileType: fileTypeFromName(file.name),
      pages: 1,
      sizeMb: Math.round((file.size / (1024 * 1024)) * 10) / 10 || 0.1,
      uploadedBy: currentUser.name,
      passages: [`COPC file for ${record.programName}`],
      folderId: 'folder-copc',
      approvalStatus: 'Approved'
    };
    persistUpload(id, file, file.name);
    addDocument(document);
  };

  const attachFileToUploadCopc = (file: File) => {
    if (!uploadCopc) return;
    setSimulatedUploading(true);
    const blobUrl = URL.createObjectURL(file);
    const key = `${uploadCopc.id}-${selectedReqCode}`;
    setUploadedBlobMap((prev) => ({ ...prev, [key]: blobUrl }));
    persistUpload(key, file, file.name);
    copyIntoCopcFolder(file, uploadCopc);

    setTimeout(() => {
      setUploadDocName(file.name);
      setUploadDocUrl(blobUrl);
      setUploadStatus('Approved');
      setSimulatedUploading(false);
      setShowDropzone(false);

      if (selectedReqCode === 'COPC-CERT') {
        const certNumber =
          uploadCopc.certificateNumber ||
          `CHED-RO13-COPC-No. 2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const dateIssued = uploadCopc.dateIssued || new Date().toISOString().split('T')[0];

        updateCOPCRecord(uploadCopc.id, {
          documentLink: blobUrl,
          certificateNumber: certNumber,
          dateIssued: dateIssued,
          copcStatus: 'Compliant'
        });

        setUploadCopc((prev) =>
          prev
            ? {
                ...prev,
                documentLink: blobUrl,
                certificateNumber: certNumber,
                dateIssued: dateIssued,
                copcStatus: 'Compliant'
              }
            : null
        );
        toast.success(`Attached official certificate "${file.name}"`);
      } else {
        const currentReq = uploadCopc.requirements.find((r) => r.code === selectedReqCode);
        if (currentReq) {
          updateCOPCRequirement(uploadCopc.id, currentReq.id, {
            documentName: file.name,
            documentUrl: blobUrl,
            status: 'Approved',
            isSubmitted: true
          });

          const updatedReqs = uploadCopc.requirements.map((r) =>
            r.id === currentReq.id
              ? {
                  ...r,
                  documentName: file.name,
                  documentUrl: blobUrl,
                  status: 'Approved' as RequirementVerificationStatus,
                  isSubmitted: true
                }
              : r
          );

          const approvedCount = updatedReqs.filter((r) => r.status === 'Approved').length;
          let newStatus = uploadCopc.copcStatus;
          let newCert = uploadCopc.certificateNumber;
          let newDate = uploadCopc.dateIssued;
          let newDocLink = uploadCopc.documentLink;

          if (approvedCount === 5 && uploadCopc.copcStatus !== 'Compliant') {
            newStatus = 'Compliant';
            newCert = newCert || `CHED-RO13-COPC-No. 2026-${Math.floor(1000 + Math.random() * 9000)}`;
            newDate = newDate || new Date().toISOString().split('T')[0];
            newDocLink =
              newDocLink ||
              `https://drive.google.com/file/d/accrevia-copc-certificate-${uploadCopc.programId}/view`;

            updateCOPCRecord(uploadCopc.id, {
              copcStatus: 'Compliant',
              certificateNumber: newCert,
              dateIssued: newDate,
              documentLink: newDocLink
            });
            toast.success(
              `All 5 mandatory areas verified! ${uploadCopc.programName} marked as Compliant with CHED COPC.`
            );
          } else {
            toast.success(`Attached "${file.name}" (${approvedCount} of 5 areas verified)`);
          }

          setUploadCopc((prev) =>
            prev
              ? {
                  ...prev,
                  copcStatus: newStatus,
                  certificateNumber: newCert,
                  dateIssued: newDate,
                  documentLink: newDocLink,
                  requirements: updatedReqs
                }
              : null
          );
        }
      }
    }, 350);
  };

  const openRequirementFile = (req: COPCRequirementItem) => {
    if (!uploadCopc) return;
    const rIdx = uploadCopc.requirements.findIndex((r) => r.code === req.code);
    openPdfViewer(uploadCopc, { ...req, documentName: uploadDocName || req.documentName }, rIdx >= 0 ? rIdx : 0);
  };

  const handleSaveUploadRequirement = () => {
    if (!canMutate) return;
    if (!uploadCopc) return;

    // Handle Official Certificate tab save
    if (selectedReqCode === 'COPC-CERT') {
      const docLink =
        uploadDocUrl ||
        (uploadDocName
          ? `https://drive.google.com/file/d/accrevia-copc-certificate-${uploadCopc.programId}/view`
          : undefined);
      updateCOPCRecord(uploadCopc.id, {
        documentLink: docLink,
        remarks: uploadNotes.trim() || undefined
      });
      setUploadCopc((prev) =>
        prev
          ? {
              ...prev,
              documentLink: docLink,
              remarks: uploadNotes.trim() || undefined
            }
          : null
      );
      toast.success(
        uploadDocName
          ? `Uploaded Certificate "${uploadDocName}" for ${uploadCopc.programName}`
          : 'Certificate details updated'
      );
      setUploadCopc(null);
      return;
    }

    const currentReq = uploadCopc.requirements.find((r) => r.code === selectedReqCode);
    if (!currentReq) return;

    const hasEvidence = Boolean(uploadDocName.trim() || uploadDocUrl.trim());
    if (!hasEvidence) {
      toast.error('Please choose a file to attach for this requirement.');
      return;
    }

    const docUrl =
      uploadDocUrl ||
      (uploadDocName
        ? `https://drive.google.com/file/d/accrevia-${uploadCopc.programId}-${selectedReqCode.toLowerCase()}/view`
        : undefined);

    updateCOPCRequirement(uploadCopc.id, currentReq.id, {
      documentName: uploadDocName.trim() || undefined,
      documentUrl: docUrl,
      status: 'Approved',
      deficiencyNote: uploadNotes.trim() || currentReq.deficiencyNote || undefined,
      isSubmitted: true
    });

    const updatedReqs = uploadCopc.requirements.map((r) =>
      r.id === currentReq.id
        ? {
            ...r,
            documentName: uploadDocName.trim() || undefined,
            documentUrl: docUrl,
            status: 'Approved' as RequirementVerificationStatus,
            deficiencyNote: uploadNotes.trim() || currentReq.deficiencyNote || undefined,
            isSubmitted: true
          }
        : r
    );

    const approvedCount = updatedReqs.filter((r) => r.status === 'Approved').length;
    let newCert = uploadCopc.certificateNumber;
    let newDate = uploadCopc.dateIssued;
    let newDocLink = uploadCopc.documentLink;

    if (approvedCount === 5 && uploadCopc.copcStatus !== 'Compliant') {
      newCert = newCert || `CHED-RO13-COPC-No. 2026-${Math.floor(1000 + Math.random() * 9000)}`;
      newDate = newDate || new Date().toISOString().split('T')[0];
      newDocLink =
        newDocLink ||
        `https://drive.google.com/file/d/accrevia-copc-certificate-${uploadCopc.programId}/view`;

      updateCOPCRecord(uploadCopc.id, {
        copcStatus: 'Compliant',
        certificateNumber: newCert,
        dateIssued: newDate,
        documentLink: newDocLink
      });
      toast.success(`All 5 areas verified! ${uploadCopc.programName} marked as Compliant with CHED COPC.`);
    } else {
      toast.success(`Requirement evidence saved (${approvedCount} of 5 areas verified)`);
    }

    setUploadCopc(null);
  };

  // Open Edit Modal with full support for editing Certificate and 5/5 Requirements Audit
  const handleOpenEdit = (copc: COPCRecord) => {
    if (!canMutate) return;
    setEditingCopc(copc);
    setEditActiveTab('details');
    setEditForm({
      copcStatus: copc.copcStatus,
      certificateNumber: copc.certificateNumber || '',
      dateIssued: copc.dateIssued || '',
      cmoNo: copc.cmoNo || '',
      borRes: copc.borRes || '',
      certFileName: copc.certificateNumber
        ? `${copc.programName.replace(/[^a-zA-Z0-9]/g, '_')}_Official_COPC_Certificate.pdf`
        : '',
      documentLink: copc.documentLink || '',
      remarks: copc.remarks || ''
    });
    setEditReqs(copc.requirements.map((r) => ({ ...r })));
    setEditSelectedReqCode('COPC-CURR');
  };

  const handleEditCertFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingCopc) {
      setEditSimulatedUploading(true);
      const blobUrl = URL.createObjectURL(file);
      const key = `${editingCopc.id}-COPC-CERT`;
      setUploadedBlobMap((prev) => ({ ...prev, [key]: blobUrl }));
      persistUpload(key, file, file.name);
      copyIntoCopcFolder(file, editingCopc);

      setTimeout(() => {
        setEditForm((prev) => ({
          ...prev,
          certFileName: file.name,
          documentLink: blobUrl
        }));
        setEditSimulatedUploading(false);
        toast.success(`Attached certificate file "${file.name}"`);
      }, 350);
    }
    e.target.value = '';
  };

  const handleEditReqFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingCopc) {
      setEditSimulatedUploading(true);
      const blobUrl = URL.createObjectURL(file);
      const key = `${editingCopc.id}-${editSelectedReqCode}`;
      setUploadedBlobMap((prev) => ({ ...prev, [key]: blobUrl }));
      persistUpload(key, file, file.name);
      copyIntoCopcFolder(file, editingCopc);

      setTimeout(() => {
        setEditReqs((prev) =>
          prev.map((r) =>
            r.code === editSelectedReqCode
              ? {
                  ...r,
                  documentName: file.name,
                  documentUrl: blobUrl,
                  status: 'Approved',
                  isSubmitted: true
                }
              : r
          )
        );
        setEditSimulatedUploading(false);
        toast.success(`Attached file "${file.name}" for ${editSelectedReqCode}`);
      }, 350);
    }
    e.target.value = '';
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    if (!canMutate) return;
    e.preventDefault();
    if (!editingCopc) return;

    const approvedCount = editReqs.filter((r) => r.status === 'Approved').length;
    let finalStatus = editForm.copcStatus;
    let finalCert = editForm.certificateNumber.trim() || undefined;
    let finalDate = editForm.dateIssued.trim() || undefined;
    let finalDocLink = editForm.documentLink.trim() || undefined;

    // If user approved all 5 requirements, ensure status is compliant
    if (approvedCount === 5 && finalStatus !== 'Compliant') {
      finalStatus = 'Compliant';
      finalCert = finalCert || `CHED-RO13-COPC-No. 2026-${Math.floor(1000 + Math.random() * 9000)}`;
      finalDate = finalDate || new Date().toISOString().split('T')[0];
      finalDocLink =
        finalDocLink ||
        `https://drive.google.com/file/d/accrevia-copc-certificate-${editingCopc.programId}/view`;
    }

    // 1. Update program record
    updateCOPCRecord(editingCopc.id, {
      copcStatus: finalStatus,
      certificateNumber: finalCert,
      dateIssued: finalDate,
      cmoNo: editForm.cmoNo.trim() || undefined,
      borRes: editForm.borRes.trim() || undefined,
      documentLink: finalDocLink,
      remarks: editForm.remarks.trim() || undefined
    });

    // 2. Update all 5 requirements in requirements audit
    editReqs.forEach((req) => {
      updateCOPCRequirement(editingCopc.id, req.id, {
        documentName: req.documentName,
        documentUrl: req.documentUrl,
        status: req.status,
        deficiencyNote: req.deficiencyNote,
        isSubmitted: Boolean(req.documentName || req.documentUrl)
      });
    });

    toast.success(`Updated COPC record for ${editingCopc.programName}`);
    setEditingCopc(null);
  };

  const selectedCampusObj = useMemo(() => {
    return campuses.find((c) => c.id === selectedCampus) || null;
  }, [campuses, selectedCampus]);

  const campusCopcRecords = useMemo(() => {
    if (selectedCampus === 'all') return copcRecords;
    return copcRecords.filter((rec) => rec.campusId === selectedCampus);
  }, [copcRecords, selectedCampus]);

  const totalPrograms = campusCopcRecords.length;
  const compliantCount = campusCopcRecords.filter((r) => r.copcStatus === 'Compliant').length;
  const withoutCopcCount = campusCopcRecords.filter((r) => r.copcStatus !== 'Compliant').length;
  const pendingCount = campusCopcRecords.filter(
    (r) => r.copcStatus === 'Pending Review'
  ).length;
  const compliantRate = totalPrograms > 0 ? ((compliantCount / totalPrograms) * 100).toFixed(1) : '0';

  const institutionalCompliantCount = useMemo(() => {
    return copcRecords.filter((r) => r.copcStatus === 'Compliant').length;
  }, [copcRecords]);

  const filtered = useMemo(() => {
    return copcRecords.filter((rec) => {
      if (selectedCampus !== 'all' && rec.campusId !== selectedCampus) return false;
      if (selectedStatus === 'Compliant' && rec.copcStatus !== 'Compliant') return false;
      if (selectedStatus === 'without-copc' && rec.copcStatus === 'Compliant') return false;
      if (
        selectedStatus === 'Pending Review' &&
        rec.copcStatus !== 'Pending Review'
      )
        return false;
      if (
        selectedStatus !== 'all' &&
        selectedStatus !== 'Compliant' &&
        selectedStatus !== 'without-copc' &&
        selectedStatus !== 'Pending Review' &&
        rec.copcStatus !== selectedStatus
      )
        return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          rec.programName.toLowerCase().includes(q) ||
          rec.campusName.toLowerCase().includes(q) ||
          (rec.certificateNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [copcRecords, selectedCampus, selectedStatus, search]);

  return (
    <>
      <PageHeader title="Certificate of Program Compliance (COPC)" />

      {/* Institutional COPC Summary Cards */}
      <div className="mb-6 grid gap-3.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Card 1: Total Programs */}
        <button
          type="button"
          onClick={() => setSelectedStatus('all')}
          className={`panel p-4 text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedStatus === 'all'
              ? 'border-slate-300 ring-1 ring-slate-400/20 shadow-2xs'
              : 'hover:border-slate-300 shadow-2xs'
          }`}
          title="Click to view all programs"
        >
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Total Programs</span>
            <p className="mt-1.5 text-2xl font-black text-ink">{totalPrograms}</p>
          </div>
          <p className="text-[11px] text-ink-subtle mt-1 line-clamp-1">
            {selectedCampus === 'all'
              ? 'University-wide degree offerings'
              : `Degree offerings in ${selectedCampusObj?.name || 'campus'}`}
          </p>
        </button>

        {/* Card 2: Programs with Active COPC */}
        <button
          type="button"
          onClick={() => setSelectedStatus(selectedStatus === 'Compliant' ? 'all' : 'Compliant')}
          className={`panel p-4 text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedStatus === 'Compliant'
              ? 'border-success-500 bg-success-50/50 ring-2 ring-success-400/30 shadow-xs'
              : 'hover:border-success-300 shadow-2xs'
          }`}
          title="Click to filter programs with Active COPC"
        >
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Programs with Active COPC
            </span>
            <p className="mt-1.5 text-2xl font-black text-success-700">{compliantCount}</p>
          </div>
          <p className="text-[11px] text-ink-subtle mt-1 line-clamp-1">Issued by CHED Regional Office</p>
        </button>

        {/* Card 3: Without COPC */}
        <button
          type="button"
          onClick={() => setSelectedStatus(selectedStatus === 'without-copc' ? 'all' : 'without-copc')}
          className={`panel p-4 text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedStatus === 'without-copc'
              ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-400/30 shadow-xs'
              : 'hover:border-brand-300 shadow-2xs'
          }`}
          title="Click to filter programs without COPC"
        >
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Without COPC</span>
            <p className="mt-1.5 text-2xl font-black text-brand-800">{withoutCopcCount}</p>
          </div>
          <p className="text-[11px] text-ink-subtle mt-1 line-clamp-1">Lacking active certification</p>
        </button>

        {/* Card 4: Institutional COPC Compliance */}
        <div className="panel p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider truncate">
              {selectedCampus === 'all'
                ? 'Institutional COPC Compliance'
                : `${selectedCampusObj?.shortName || 'Campus'} COPC Compliance`}
            </span>
            <p className="mt-1.5 text-2xl font-black text-brand-700">{compliantRate}%</p>
          </div>
          <p className="text-[11px] text-ink-subtle mt-1 line-clamp-1">Target: 100% compliance</p>
        </div>

        {/* Card 5: Under Evaluation / Pending */}
        <button
          type="button"
          onClick={() => setSelectedStatus(selectedStatus === 'Pending Review' ? 'all' : 'Pending Review')}
          className={`panel p-4 text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedStatus === 'Pending Review'
              ? 'border-warning-500 bg-brand-50/50 ring-2 ring-warning-400/30 shadow-xs'
              : 'hover:border-warning-300 shadow-2xs'
          }`}
          title="Click to filter pending applications"
        >
          <div>
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Under Evaluation / Pending
            </span>
            <p className="mt-1.5 text-2xl font-black text-warning-700">{pendingCount}</p>
          </div>
          <p className="text-[11px] text-ink-subtle mt-1 line-clamp-1">Submitted renewal applications</p>
        </button>
      </div>

      {/* Campus COPC Breakdown (Master Reference with All Campuses Option) */}
      <div className="mb-6 panel p-4 border border-line/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Campus COPC Compliance Distribution (Master Reference)
            </h3>
            <p className="text-[11px] text-ink-subtle mt-0.5">
              Click any campus or <strong>All Campuses</strong> to filter compliance statistics and degree programs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-0.5 text-[11px] font-bold text-brand-800">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-pulse" />
              {selectedCampus === 'all' ? 'All Campuses Scope' : `${selectedCampusObj?.shortName || 'Selected'} Scope`}
            </span>
          </div>
        </div>

        {/* 8-Card Campus Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* Card 0: All Campuses Selector */}
          <button
            type="button"
            onClick={() => setSelectedCampus('all')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedCampus === 'all'
                ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/30 shadow-xs'
                : 'border-line hover:border-slate-300 bg-white shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-ink truncate">All Campuses</span>
              <span className="rounded bg-brand-100 text-brand-800 px-1 py-0.2 text-[10px] font-bold">7</span>
            </div>
            <div className="mt-2">
              <span className="text-lg font-black text-brand-700">
                {institutionalCompliantCount} / {copcRecords.length}
              </span>
              <p className="text-[10px] text-ink-subtle mt-0.5">Total offerings</p>
            </div>
          </button>

          {/* Cards 1-7: Individual Campuses */}
          {campuses.map((camp) => {
            const campRecords = copcRecords.filter((r) => r.campusId === camp.id);
            const campCompliant = campRecords.filter((r) => r.copcStatus === 'Compliant').length;
            const campTotal = campRecords.length;
            const isAllCompliant = campTotal > 0 && campCompliant === campTotal;
            const isSelected = selectedCampus === camp.id;

            return (
              <button
                key={camp.id}
                type="button"
                onClick={() => setSelectedCampus(camp.id as CampusId)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/30 shadow-xs'
                    : 'border-line hover:border-slate-300 bg-white shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-ink truncate">{camp.shortName}</span>
                  {isAllCompliant ? (
                    <span className="rounded bg-success-50 text-success-700 border border-success-200 px-1 py-0.2 text-[10px] font-bold">
                      100%
                    </span>
                  ) : (
                    <span className="rounded bg-brand-50 text-brand-800 border border-brand-200 px-1 py-0.2 text-[10px] font-bold">
                      Pending
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-lg font-black text-ink">
                    {campCompliant} / {campTotal}
                  </span>
                  <p className="text-[10px] text-ink-subtle mt-0.5">programs compliant</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-4 panel p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-ink-subtle" />
            <input
              type="text"
              placeholder="Search program or certificate number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 [&>select]:flex-1 sm:[&>select]:flex-none">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input select select-sm h-9 w-auto text-xs hover:border-brand-300"
            >
              <option value="all">All Statuses</option>
              <option value="Compliant">Active COPC (Compliant)</option>
              <option value="without-copc">Without COPC</option>
              <option value="Pending Review">Pending Review</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-ink-muted border-t border-line pt-2 gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>
              Showing <strong className="text-ink">{filtered.length}</strong> of{' '}
              <strong className="text-ink">{totalPrograms}</strong> programs
              {selectedCampus !== 'all' ? ` in ${selectedCampusObj?.shortName}` : ' across all campuses'}
            </span>
            {selectedStatus !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedStatus('all')}
                className="inline-flex items-center gap-1 rounded bg-brand-50 text-brand-900 border border-brand-300 px-1.5 py-0.2 text-[10.5px] font-bold hover:bg-brand-100 transition-colors cursor-pointer"
                title="Clear status filter"
              >
                Status: {selectedStatus === 'without-copc' ? 'Without COPC' : selectedStatus}
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </div>
          <span className="text-success-700 font-medium">
            {selectedCampus === 'all' ? 'Institutional' : selectedCampusObj?.shortName || 'Campus'} Rate: {compliantRate}% Compliant with CHED PSGs
          </span>
        </div>
      </div>

      {/* COPC Programs Table */}
      <div className="panel overflow-hidden">
        {/* Desktop Table View (lg+) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="bg-canvas border-b border-line text-ink-muted">
              <tr>
                <th className="th py-3 w-10">#</th>
                <th className="th py-3 min-w-[240px]">Degree Program</th>
                <th className="th py-3">Campus</th>
                <th className="th py-3">COPC Status</th>
                <th className="th py-3">Certificate Number</th>
                <th className="th py-3">Date Issued</th>
                <th className="th py-3">CHED CMO Policy</th>
                <th className="th py-3">BOR Resolution</th>
                <th className="th py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((copc, idx) => {
                return (
                  <tr key={copc.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="td py-3 font-mono text-ink-subtle text-xs">{idx + 1}</td>

                    <td className="td py-3">
                      <div className="font-semibold text-ink leading-snug">{copc.programName}</div>
                      <div className="mt-0.5 text-[11px] text-ink-muted">{copc.degreeLevel}</div>
                    </td>

                    <td className="td py-3 whitespace-nowrap text-ink-muted">
                      {copc.campusName.replace(' Campus', '')}
                    </td>

                    <td className="td py-3 whitespace-nowrap">
                      {copc.copcStatus === 'Compliant' ? (
                        <Badge tone="success" dot>
                          Compliant
                        </Badge>
                      ) : (
                        <Badge tone="warning" dot>
                          Pending Review
                        </Badge>
                      )}
                    </td>

                    <td className="td py-3 whitespace-nowrap">
                      {copc.certificateNumber || copc.documentLink ? (
                        <button
                          type="button"
                          onClick={() => handleOpenView(copc, 'certificate')}
                          className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2 py-0.5 text-[11.5px] font-semibold text-brand-700 transition hover:border-brand-300 cursor-pointer"
                          title="View Official COPC Certificate"
                        >
                          <AwardIcon className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                          <span className="font-mono">{copc.certificateNumber || 'View'}</span>
                        </button>
                      ) : canMutate ? (
                        <button
                          type="button"
                          onClick={() => openCopcDocs(copc, 'certificate')}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/80 rounded-md px-2 py-0.5 transition-colors cursor-pointer"
                          title="Upload into Certificate Number folder"
                        >
                          <UploadIcon className="h-3 w-3" />
                          <span>Upload Certificate</span>
                        </button>
                      ) : (
                        <span className="text-ink-subtle text-xs">—</span>
                      )}
                    </td>

                    <td className="td py-3 whitespace-nowrap text-xs text-ink-muted">
                      {copc.dateIssued || '—'}
                    </td>

                    <td className="td py-3 text-xs text-ink-muted truncate max-w-[150px]">
                      {copc.cmoNo || '—'}
                    </td>

                    <td className="td py-3 text-xs whitespace-nowrap">
                      {borResHref(copc.borRes) ? (
                        <button
                          type="button"
                          onClick={() => handleOpenView(copc, 'bor')}
                          className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2 py-0.5 text-[11.5px] font-semibold text-brand-700 transition hover:border-brand-300 cursor-pointer"
                          title="View Board of Regents Resolution"
                        >
                          <FileCheckIcon className="h-3 w-3 shrink-0" />
                          View
                        </button>
                      ) : canMutate ? (
                        <button
                          type="button"
                          onClick={() => openCopcDocs(copc, 'bor')}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/80 rounded-md px-2 py-0.5 transition-colors cursor-pointer"
                          title="Upload into BOR Resolution folder"
                        >
                          <UploadIcon className="h-3 w-3" />
                          <span>Upload BOR</span>
                        </button>
                      ) : (
                        <span className="text-ink-muted truncate max-w-[150px] inline-block">{copc.borRes || '—'}</span>
                      )}
                    </td>

                    <td className="td py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center divide-x divide-line overflow-hidden rounded-lg bg-white ring-1 ring-inset ring-line shadow-2xs">
                        {/* Eye icon: views uploaded certificate and 5/5 requirements audit */}
                        <button
                          type="button"
                          onClick={() => handleOpenView(copc, 'certificate')}
                          className="flex h-7 w-7 items-center justify-center text-ink-muted hover:bg-slate-50 hover:text-brand-700 transition-colors cursor-pointer"
                          title="View official certificate"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                        </button>
                        {canMutate && (
                          <button
                            type="button"
                            onClick={() => openCopcDocs(copc, 'certificate')}
                            className="flex h-7 w-7 items-center justify-center text-ink-muted hover:bg-slate-50 hover:text-brand-700 transition-colors cursor-pointer"
                            title="Open COPC Certificate Number / BOR folders"
                          >
                            <UploadIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {canMutate && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(copc)}
                            className="flex h-7 w-7 items-center justify-center text-ink-muted hover:bg-slate-50 hover:text-brand-700 transition-colors cursor-pointer"
                            title="Edit COPC record"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Card View (< lg viewports) */}
        <div className="divide-y divide-line lg:hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted">
              No programs matched the selected search criteria.
            </div>
          ) : (
            filtered.map((copc, idx) => {
              return (
                <div key={copc.id} className="p-4 hover:bg-canvas/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-ink-subtle font-mono">
                        <span>#{idx + 1}</span>
                        <span>·</span>
                        <span>{copc.campusName.replace(' Campus', '')}</span>
                      </div>
                      <h4 className="font-semibold text-ink text-sm mt-0.5 leading-snug">
                        {copc.programName}
                      </h4>
                      <p className="text-xs text-ink-muted mt-0.5">{copc.degreeLevel}</p>
                    </div>

                    <div className="shrink-0">
                      {copc.copcStatus === 'Compliant' ? (
                        <Badge tone="success" dot>
                          Compliant
                        </Badge>
                      ) : (
                        <Badge tone="warning" dot>
                          Pending Review
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-canvas/60 p-2.5 rounded-lg border border-line">
                    <div>
                      <span className="text-[11px] text-ink-muted">Certificate No:</span>
                      {copc.certificateNumber || copc.documentLink ? (
                        <button
                          type="button"
                          onClick={() => handleOpenView(copc, 'certificate')}
                          className="inline-flex items-center gap-1 rounded-md border border-line bg-canvas px-2 py-0.5 text-[11.5px] font-semibold text-brand-700 transition hover:border-brand-300 mt-0.5 cursor-pointer"
                          title="View Official Certificate"
                        >
                          <AwardIcon className="h-3 w-3 shrink-0" />
                          <span className="font-mono truncate">{copc.certificateNumber || 'View'}</span>
                        </button>
                      ) : canMutate ? (
                        <button
                          type="button"
                          onClick={() => openCopcDocs(copc, 'certificate')}
                          className="text-[11px] font-semibold text-brand-700 hover:underline mt-0.5 flex items-center gap-1 cursor-pointer"
                          title="Upload into Certificate Number folder"
                        >
                          <UploadIcon className="h-3 w-3" />
                          <span>Upload Certificate</span>
                        </button>
                      ) : (
                        <p className="font-medium text-ink-subtle mt-0.5">—</p>
                      )}
                    </div>
                    <div>
                      <span className="text-[11px] text-ink-muted">Date Issued:</span>
                      <p className="font-medium text-ink truncate mt-0.5">
                        {copc.dateIssued || '—'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[11px] text-ink-muted">CMO / BOR:</span>
                      <p className="font-medium text-ink truncate mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span>{copc.cmoNo || '—'}</span>
                        <span className="text-ink-subtle">·</span>
                        {borResHref(copc.borRes) ? (
                          <button
                            type="button"
                            onClick={() => handleOpenView(copc, 'bor')}
                            className="inline-flex items-center gap-1 text-brand-700 font-semibold hover:underline cursor-pointer"
                            title="View Board of Regents Resolution"
                          >
                            <FileCheckIcon className="h-3 w-3" />
                            BOR View
                          </button>
                        ) : canMutate ? (
                          <button
                            type="button"
                            onClick={() => openCopcDocs(copc, 'bor')}
                            className="inline-flex items-center gap-1 text-brand-700 font-semibold hover:underline cursor-pointer"
                            title="Upload into BOR Resolution folder"
                          >
                            <UploadIcon className="h-3 w-3" />
                            Upload BOR
                          </button>
                        ) : (
                          <span>{copc.borRes || '—'}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-ink-muted font-medium">Actions:</span>
                    <div className="inline-flex items-center divide-x divide-line overflow-hidden rounded-lg bg-white ring-1 ring-inset ring-line shadow-2xs">
                      {/* Eye icon: opens the uploaded certificate & requirements viewer */}
                      <button
                        type="button"
                        onClick={() => handleOpenView(copc, 'certificate')}
                        className="flex h-8 px-2.5 items-center gap-1.5 text-xs text-ink-muted hover:bg-slate-50 hover:text-brand-700 transition-colors cursor-pointer"
                        title="View official certificate"
                      >
                        <EyeIcon className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                      {canMutate && (
                        <button
                          type="button"
                          onClick={() => openCopcDocs(copc, 'certificate')}
                          className="flex h-8 px-2.5 items-center gap-1.5 text-xs text-ink-muted hover:bg-slate-50 hover:text-brand-700 transition-colors cursor-pointer"
                          title="Open COPC Certificate Number / BOR folders"
                        >
                          <UploadIcon className="h-3.5 w-3.5" />
                          <span>Upload</span>
                        </button>
                      )}
                      {canMutate && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(copc)}
                          className="flex h-8 px-2.5 items-center gap-1.5 text-xs text-ink-muted hover:bg-slate-50 hover:text-brand-700 transition-colors cursor-pointer"
                          title="Edit COPC Record"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* View Uploaded Certificate & Requirements Audit Files Modal (Triggered by Eye Icon or Requirements cell) */}
      {viewingCertificateCopc && (
        <Modal
          open={!!viewingCertificateCopc}
          onClose={closeViewModal}
          zIndex="z-[60]"
          title={
            viewModalTab === 'bor'
              ? 'Board of Regents Resolution'
              : viewModalTab === 'certificate'
                ? 'Official Certificate of Program Compliance (COPC)'
                : 'Requirements Audit Uploaded Files'
          }
          description={`${viewingCertificateCopc.programName} · ${viewingCertificateCopc.campusName}`}
          size="xl"
          footer={
            <div className="flex w-full items-center justify-between gap-2">
              {canMutate && viewModalTab !== 'bor' && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingCertificateCopc;
                      closeViewModal();
                      handleOpenUpload(target);
                    }}
                    className="btn btn-primary btn-sm inline-flex items-center gap-1.5 shadow-2xs font-semibold cursor-pointer"
                  >
                    <UploadIcon className="h-3.5 w-3.5" />
                    <span>{viewModalTab === 'certificate' ? 'Upload / Replace Certificate' : 'Upload Evidence'}</span>
                  </button>
                </div>
              )}
              {viewModalTab === 'bor' && <div />}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (viewModalTab === 'bor' && borDocUrl) {
                      window.open(borDocUrl, '_blank', 'noopener,noreferrer');
                      return;
                    }
                    window.print();
                  }}
                  className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PrinterIcon className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="btn btn-secondary btn-sm cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Modal Tabs Header: Official Certificate · BOR Resolution */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setViewModalTab('certificate')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewModalTab === 'certificate'
                      ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/30 shadow-2xs'
                      : 'text-ink-muted hover:bg-slate-100 hover:text-ink'
                  }`}
                >
                  <AwardIcon className="h-3.5 w-3.5" />
                  <span>Official Certificate</span>
                </button>
                {borResHref(viewingCertificateCopc.borRes) && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewModalTab('bor');
                      if (!borDocUrl && !borDocLoading) void loadBorDocument(viewingCertificateCopc);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      viewModalTab === 'bor'
                        ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/30 shadow-2xs'
                        : 'text-ink-muted hover:bg-slate-100 hover:text-ink'
                    }`}
                  >
                    <FileCheckIcon className="h-3.5 w-3.5" />
                    <span>BOR Resolution</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge tone={viewingCertificateCopc.copcStatus === 'Compliant' ? 'success' : 'warning'} dot>
                  {viewingCertificateCopc.copcStatus}
                </Badge>
              </div>
            </div>

            {/* TAB: BOR Resolution — same viewer chrome as Official Certificate */}
            {viewModalTab === 'bor' && (
              borDocLoading ? (
                <div className="flex items-center justify-center rounded-2xl border border-line bg-white py-20 text-sm text-ink-muted">
                  Loading Board of Regents Resolution…
                </div>
              ) : borDocMissing && !borDocUrl ? (
                <div className="rounded-xl border border-dashed border-line bg-canvas/60 px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-ink">BOR Resolution file is not available</p>
                  <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-muted">
                    This program is linked to a BOR Resolution, but that file could not be loaded.
                  </p>
                </div>
              ) : borDocUrl && borDocKind === 'image' ? (
                <div className="space-y-2">
                  <p className="text-xs text-ink-muted">Board of Regents Resolution on file.</p>
                  <div className="flex justify-center rounded-xl border border-line bg-white p-3">
                    <img
                      src={borDocUrl}
                      alt={`BOR – ${viewingCertificateCopc.programName}`}
                      className="max-h-[min(78vh,720px)] max-w-full rounded-lg object-contain"
                    />
                  </div>
                </div>
              ) : borDocUrl ? (
                <div className="space-y-2">
                  <p className="text-xs text-ink-muted">Board of Regents Resolution on file.</p>
                  <iframe
                    title={`BOR – ${viewingCertificateCopc.programName}`}
                    src={`${borDocUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="h-[min(78vh,720px)] w-full rounded-xl border border-line bg-white"
                  />
                </div>
              ) : null
            )}

            {/* TAB 1: Official Certificate — real file when available */}
            {viewModalTab === 'certificate' && (
              officialCertLoading ? (
                <div className="flex items-center justify-center rounded-2xl border border-line bg-white py-20 text-sm text-ink-muted">
                  Loading official certificate…
                </div>
              ) : officialCertMissing && !officialCertUrl ? (
                <div className="rounded-xl border border-dashed border-line bg-canvas/60 px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-ink">Certificate file is not available</p>
                  <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-muted">
                    This program is linked to a scanned certificate, but that file is not in this copy of the app.
                  </p>
                </div>
              ) : officialCertUrl && officialCertKind === 'image' ? (
                <div className="space-y-2">
                  <p className="text-xs text-ink-muted">Official CHED COPC certificate on file.</p>
                  <div className="flex justify-center rounded-xl border border-line bg-white p-3">
                    <img
                      src={officialCertUrl}
                      alt={`COPC – ${viewingCertificateCopc.programName}`}
                      className="max-h-[min(78vh,720px)] max-w-full rounded-lg object-contain"
                    />
                  </div>
                </div>
              ) : officialCertUrl ? (
                <div className="space-y-2">
                  <p className="text-xs text-ink-muted">Official CHED COPC certificate on file.</p>
                  <iframe
                    title={`COPC – ${viewingCertificateCopc.programName}`}
                    src={`${officialCertUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="h-[min(78vh,720px)] w-full rounded-xl border border-line bg-white"
                  />
                </div>
              ) : (
              <div className="relative rounded-2xl border-4 border-double border-brand-600/40 bg-gradient-to-b from-brand-50/30 via-white to-brand-50/20 p-6 sm:p-10 text-center shadow-xs overflow-hidden">
                {/* Subtle decorative watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                  <AwardIcon className="w-96 h-96 text-brand-900" />
                </div>

                {/* Certificate Header */}
                <div className="relative space-y-1">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-800 ring-4 ring-brand-50 shadow-xs mb-3">
                    <AwardIcon className="h-6 w-6" />
                  </div>
                  <p className="text-[11px] font-bold tracking-widest text-ink-muted uppercase">
                    Republic of the Philippines
                  </p>
                  <p className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                    Office of the President
                  </p>
                  <h3 className="text-sm font-extrabold tracking-wider text-ink uppercase">
                    Commission on Higher Education
                  </h3>
                  <p className="text-xs text-brand-700 font-semibold tracking-wide">
                    CHED Regional Office XIII (Caraga)
                  </p>
                </div>

                {/* Certificate Title */}
                <div className="relative my-6 py-3 border-y-2 border-brand-600/30">
                  <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wide text-ink">
                    CERTIFICATE OF PROGRAM COMPLIANCE
                  </h2>
                  <p className="text-xs font-mono font-bold tracking-widest text-brand-700 mt-1 uppercase">
                    {viewingCertificateCopc.certificateNumber || 'Pending CHED Regional Issuance'}
                  </p>
                </div>

                {/* Certificate Body Text */}
                <div className="relative space-y-4 text-xs leading-relaxed text-ink-muted max-w-xl mx-auto">
                  <p className="italic">This is to certify that the degree program</p>

                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-ink tracking-tight font-serif">
                      {viewingCertificateCopc.programName}
                    </h1>
                    <p className="text-xs font-semibold text-brand-700 mt-0.5">
                      {viewingCertificateCopc.degreeLevel} Program
                    </p>
                  </div>

                  <p>
                    offered by the{' '}
                    <strong className="text-ink">North Eastern Mindanao State University</strong> at its{' '}
                    <strong className="text-ink">{viewingCertificateCopc.campusName}</strong> has fully complied
                    with the Policies, Standards, and Guidelines (PSGs) set forth by the Commission under:
                  </p>

                  <div className="inline-block rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-1.5 font-mono text-xs font-bold text-ink">
                    {viewingCertificateCopc.cmoNo || 'CHED Memorandum Order Policies'}
                  </div>

                  <p>
                    and is officially recognized and confirmed compliant pursuant to Board of Regents Resolution:
                  </p>

                  {borResHref(viewingCertificateCopc.borRes) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setViewModalTab('bor');
                        if (!borDocUrl && !borDocLoading) void loadBorDocument(viewingCertificateCopc);
                      }}
                      className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline cursor-pointer"
                    >
                      <FileCheckIcon className="h-4 w-4" />
                      View Board of Regents Resolution
                    </button>
                  ) : (
                    <p className="font-semibold text-ink">
                      {viewingCertificateCopc.borRes || 'BOR Res. Pending Ratification'}
                    </p>
                  )}
                </div>

                {/* Certificate Verification Badge & Signatures */}
                <div className="relative mt-8 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="text-left">
                    <span className="text-[10px] text-ink-subtle uppercase tracking-wider block">Date Issued:</span>
                    <span className="text-xs font-bold text-ink">
                      {viewingCertificateCopc.dateIssued || 'Pending Final Evaluation'}
                    </span>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-success-700 font-semibold">
                      <ShieldCheckIcon className="h-4 w-4" />
                      <span>
                        {viewingCertificateCopc.copcStatus === 'Compliant'
                          ? 'Official CHED COPC Certified'
                          : 'Evaluation in Progress'}
                      </span>
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <div className="border-b border-slate-400 w-48 sm:ml-auto mb-1"></div>
                    <p className="text-xs font-bold text-ink">DR. GEORGE M. COLORADO, CESO III</p>
                    <p className="text-[10px] text-ink-subtle">Director IV, CHED Regional Office XIII</p>
                  </div>
                </div>
              </div>
              )
            )}

          </div>
        </Modal>
      )}

      {/* Real PDF Document Viewer Modal (shows actual uploaded file or authentic CHED compliance PDF) */}
      {activePdfDoc && (
        <Modal
          open={!!activePdfDoc}
          onClose={() => setActivePdfDoc(null)}
          zIndex="z-[70]"
          title={`PDF Preview: ${activePdfDoc.req.documentName || `${activePdfDoc.req.code}.pdf`}`}
          description={`${activePdfDoc.copcRecord.programName} · Parameter 0${activePdfDoc.reqIdx + 1} (${activePdfDoc.req.category})`}
          size="xl"
          footer={
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <span className="font-semibold text-ink">
                  Requirement 0{activePdfDoc.reqIdx + 1} of {activePdfDoc.copcRecord.requirements.length}
                </span>
                <span>·</span>
                <span className="font-mono text-[11px] truncate max-w-[200px]">
                  {activePdfDoc.req.documentName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-secondary btn-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PrinterIcon className="h-3.5 w-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePdfDoc(null)}
                  className="btn btn-secondary btn-sm cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-3">
            {/* Dark PDF Viewer Top Controls Bar */}
            <div className="rounded-xl bg-slate-900 text-white p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-md">
              {/* Left: Document info & badge */}
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="bg-red-600 text-white font-black px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase shrink-0">
                  PDF
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate max-w-[260px] sm:max-w-md">
                    {activePdfDoc.req.documentName || `${activePdfDoc.req.code}_Compliance_Evidence.pdf`}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    0{activePdfDoc.reqIdx + 1} · {activePdfDoc.req.category} · {activePdfDoc.copcRecord.campusName}
                  </p>
                </div>
              </div>

              {/* Middle: Document navigation */}
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => handleSwitchPdfReq(-1)}
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Previous Requirement PDF"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span className="text-xs font-mono font-medium text-slate-200 px-2">
                  {activePdfDoc.reqIdx + 1} / {activePdfDoc.copcRecord.requirements.length}
                </span>
                <button
                  type="button"
                  onClick={() => handleSwitchPdfReq(1)}
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Next Requirement PDF"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Right: Zoom controls */}
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setPdfZoom((z) => Math.max(40, z - 15))}
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOutIcon className="h-3.5 w-3.5" />
                </button>
                <span className="text-[11px] font-mono text-slate-300 px-1.5 w-11 text-center">
                  {pdfZoom}%
                </span>
                <button
                  type="button"
                  onClick={() => setPdfZoom((z) => Math.min(150, z + 15))}
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomInIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Dark Reader Viewport */}
            <div className="rounded-xl bg-[#525659] p-3 sm:p-6 overflow-auto max-h-[72dvh] flex justify-center shadow-inner">
              {activePdfDoc.blobUrl ? (
                <iframe
                  src={activePdfDoc.blobUrl}
                  title={activePdfDoc.req.documentName || 'Uploaded PDF'}
                  className="w-full h-[70vh] rounded bg-white shadow-2xl border-0"
                />
              ) : (
                /* Authentic A4 CHED Compliance PDF Sheet */
                <div
                  style={{ zoom: pdfZoom / 100 }}
                  className="light-island w-full min-w-[640px] max-w-[780px] shrink-0 bg-white text-slate-900 shadow-2xl rounded-sm p-10 font-serif relative border border-slate-300 min-h-[960px] select-text"
                >
                  {/* Subtle diagonal official watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none rotate-[-30deg]">
                    <span className="text-7xl font-sans font-black tracking-widest text-slate-900">
                      CHED · RQAT VERIFIED
                    </span>
                  </div>

                  {/* PDF Letterhead */}
                  <div className="relative text-center border-b-2 border-slate-900 pb-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-800 ring-2 ring-brand-200 mb-2">
                      <AwardIcon className="h-6 w-6" />
                    </div>
                    <p className="text-[10px] font-sans font-bold tracking-widest text-slate-500 uppercase">
                      Republic of the Philippines
                    </p>
                    <p className="text-xs font-sans font-extrabold tracking-wide text-slate-900 uppercase">
                      Commission on Higher Education · Regional Office XIII
                    </p>
                    <h3 className="text-sm font-sans font-black tracking-wide text-brand-900 uppercase mt-0.5">
                      North Eastern Mindanao State University
                    </h3>
                    <p className="text-[11px] font-sans text-slate-600">
                      {activePdfDoc.copcRecord.campusName} · Surigao del Sur, Philippines
                    </p>
                    <p className="text-[10px] font-sans font-semibold text-brand-700 tracking-wider uppercase mt-1">
                      Office of the Vice President for Academic Affairs & Quality Assurance
                    </p>
                  </div>

                  {/* Document Control Bar */}
                  <div className="relative my-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5 font-sans text-[10.5px]">
                    <div>
                      <span className="text-slate-500">Document ID: </span>
                      <span className="font-mono font-bold text-slate-800">
                        NEMSU-RO13-COPC-{activePdfDoc.req.code}-2026-V1
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Academic Year: </span>
                      <span className="font-bold text-slate-800">2025–2026 Cycle</span>
                    </div>
                    <div className="flex items-center gap-1 text-success-700 font-bold">
                      <ShieldCheckIcon className="h-3.5 w-3.5" />
                      <span>CHED RQAT AUDIT COMPLIANT</span>
                    </div>
                  </div>

                  {/* Document Title Banner */}
                  <div className="relative my-5 text-center bg-slate-50 border border-slate-200/80 rounded-md p-3.5">
                    <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-brand-700">
                      Certificate of Program Compliance (COPC) Evidence Dossier
                    </p>
                    <h2 className="text-base sm:text-lg font-serif font-black tracking-tight text-slate-900 mt-1 uppercase">
                      Parameter 0{activePdfDoc.reqIdx + 1}: {activePdfDoc.req.category} Alignment Matrix
                    </h2>
                    <p className="font-mono text-xs font-bold text-slate-700 mt-1">
                      {activePdfDoc.req.documentName}
                    </p>
                  </div>

                  {/* Degree Program Metadata */}
                  <div className="relative mb-5 grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans text-[11px] bg-slate-100/60 p-3 rounded border border-slate-200">
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase font-semibold">Degree Program:</span>
                      <span className="font-bold text-slate-900">{activePdfDoc.copcRecord.programName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase font-semibold">Degree Level:</span>
                      <span className="font-semibold text-slate-800">{activePdfDoc.copcRecord.degreeLevel}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase font-semibold">CHED Policy (CMO):</span>
                      <span className="font-bold text-brand-800">{activePdfDoc.copcRecord.cmoNo || 'CHED PSG Mandate'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block uppercase font-semibold">BOR Approval:</span>
                      {(() => {
                        const href = borResHref(activePdfDoc.copcRecord.borRes);
                        if (href) {
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-brand-800 hover:underline"
                            >
                              View BOR Resolution
                            </a>
                          );
                        }
                        return (
                          <span className="font-semibold text-slate-800">
                            {activePdfDoc.copcRecord.borRes || 'BOR Confirmed'}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Parameter-Specific Authentic Table Content */}
                  <div className="relative my-4 space-y-4 font-sans">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
                      I. Detailed Regulatory Verification Breakdown
                    </h4>

                    {/* 01 Curriculum Alignment Table */}
                    {activePdfDoc.req.code === 'COPC-CURR' && (
                      <div className="overflow-hidden border border-slate-300 rounded text-[11px]">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                            <tr>
                              <th className="p-2 border-r border-slate-300">Course Category / Module</th>
                              <th className="p-2 border-r border-slate-300 text-center">CMO Min Units</th>
                              <th className="p-2 border-r border-slate-300 text-center">NEMSU Units</th>
                              <th className="p-2 text-center">Compliance Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-medium">General Education (GE) Curriculum</td>
                              <td className="p-2 border-r border-slate-200 text-center">36 units</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">36 units</td>
                              <td className="p-2 text-center text-success-700 font-bold">✓ Compliant</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-medium">Professional Core & Theoretical Foundations</td>
                              <td className="p-2 border-r border-slate-200 text-center">42 units</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">42 units</td>
                              <td className="p-2 text-center text-success-700 font-bold">✓ Compliant</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-medium">Major Specialization Courses & Laboratories</td>
                              <td className="p-2 border-r border-slate-200 text-center">60 units</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">60 units</td>
                              <td className="p-2 text-center text-success-700 font-bold">✓ Compliant</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-medium">Institutional Electives & Mandated Subjects</td>
                              <td className="p-2 border-r border-slate-200 text-center">12 units</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">12 units</td>
                              <td className="p-2 text-center text-success-700 font-bold">✓ Compliant</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-medium">Teaching Internship & Practicum (360 hours)</td>
                              <td className="p-2 border-r border-slate-200 text-center">6 units</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">6 units</td>
                              <td className="p-2 text-center text-success-700 font-bold">✓ Compliant</td>
                            </tr>
                            <tr className="bg-slate-50 font-bold">
                              <td className="p-2 border-r border-slate-200">TOTAL PROGRAM CURRICULUM UNITS</td>
                              <td className="p-2 border-r border-slate-200 text-center">150–160</td>
                              <td className="p-2 border-r border-slate-200 text-center font-black text-brand-900">156 units</td>
                              <td className="p-2 text-center text-success-700 font-black">100% COMPLIANT</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 02 Faculty Qualifications Table */}
                    {activePdfDoc.req.code === 'COPC-FAC' && (
                      <div className="overflow-hidden border border-slate-300 rounded text-[11px]">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                            <tr>
                              <th className="p-2 border-r border-slate-300">Faculty Member Name</th>
                              <th className="p-2 border-r border-slate-300">Rank & Status</th>
                              <th className="p-2 border-r border-slate-300">Highest Aligned Degree</th>
                              <th className="p-2 text-center">PRC Licensure</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">Dr. Maria Elena V. Santos</td>
                              <td className="p-2 border-r border-slate-200">Professor VI (Permanent)</td>
                              <td className="p-2 border-r border-slate-200">Ed.D. in Physical Education (UP Diliman)</td>
                              <td className="p-2 text-center font-mono font-bold text-brand-800">PRC No. 048291</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">Prof. Roberto C. Mendoza</td>
                              <td className="p-2 border-r border-slate-200">Assoc. Professor III (Permanent)</td>
                              <td className="p-2 border-r border-slate-200">MS in Physical Education (UST)</td>
                              <td className="p-2 text-center font-mono font-bold text-brand-800">PRC No. 072194</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">Asst. Prof. Grace T. Alcantara</td>
                              <td className="p-2 border-r border-slate-200">Asst. Professor II (Permanent)</td>
                              <td className="p-2 border-r border-slate-200">MA in Education - PE (MSU-IIT)</td>
                              <td className="p-2 text-center font-mono font-bold text-brand-800">PRC No. 091423</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">Inst. Jomar K. Dela Torre</td>
                              <td className="p-2 border-r border-slate-200">Instructor III (Permanent)</td>
                              <td className="p-2 border-r border-slate-200">MS in Physical Education (Completed CAR)</td>
                              <td className="p-2 text-center font-mono font-bold text-brand-800">PRC No. 110482</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">Inst. Liezl D. Morales</td>
                              <td className="p-2 border-r border-slate-200">Instructor I (Permanent)</td>
                              <td className="p-2 border-r border-slate-200">Master of Physical Education (NEMSU)</td>
                              <td className="p-2 text-center font-mono font-bold text-brand-800">PRC No. 129401</td>
                            </tr>
                            <tr className="bg-slate-50 font-bold">
                              <td colSpan={3} className="p-2 border-r border-slate-200">FACULTY DEGREE COMPLIANCE (100% MASTERS / PH.D.)</td>
                              <td className="p-2 text-center text-success-700 font-black">100% COMPLIANT</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 03 Specialized Laboratories Table */}
                    {activePdfDoc.req.code === 'COPC-LAB' && (
                      <div className="overflow-hidden border border-slate-300 rounded text-[11px]">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                            <tr>
                              <th className="p-2 border-r border-slate-300">Specialized Facility / Hall</th>
                              <th className="p-2 border-r border-slate-300">Floor Area</th>
                              <th className="p-2 border-r border-slate-300">Key Equipment & Calibration</th>
                              <th className="p-2 text-center">Safety Rating</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">Human Performance & Fitness Testing Lab</td>
                              <td className="p-2 border-r border-slate-200 text-center">120 sq.m</td>
                              <td className="p-2 border-r border-slate-200">Monark Ergometer 828E, Brower Gates, Calipers</td>
                              <td className="p-2 text-center text-success-700 font-bold">Passed (Calibrated)</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">Sports Anatomy & Kinesiology Lab</td>
                              <td className="p-2 border-r border-slate-200 text-center">95 sq.m</td>
                              <td className="p-2 border-r border-slate-200">Musculoskeletal Models, Digital Goniometers</td>
                              <td className="p-2 text-center text-success-700 font-bold">Passed</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">University Gymnasium & Martial Arts Dojo</td>
                              <td className="p-2 border-r border-slate-200 text-center">850 sq.m</td>
                              <td className="p-2 border-r border-slate-200">Competition Tatami Mats, Olympic Barbell Sets</td>
                              <td className="p-2 text-center text-success-700 font-bold">Certified Standard</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">Sports Rehabilitation & Athletic Training</td>
                              <td className="p-2 border-r border-slate-200 text-center">60 sq.m</td>
                              <td className="p-2 border-r border-slate-200">Ultrasound Units, Hydrocollator, TENS Machine</td>
                              <td className="p-2 text-center text-success-700 font-bold">Passed (Calibrated)</td>
                            </tr>
                            <tr className="bg-slate-50 font-bold">
                              <td colSpan={3} className="p-2 border-r border-slate-200">LABORATORY COMPLIANCE AGAINST CHED PSG STANDARDS</td>
                              <td className="p-2 text-center text-success-700 font-black">100% COMPLIANT</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 04 Library Holdings Table */}
                    {activePdfDoc.req.code === 'COPC-LIB' && (
                      <div className="overflow-hidden border border-slate-300 rounded text-[11px]">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                            <tr>
                              <th className="p-2 border-r border-slate-300">Cluster / Subject Area</th>
                              <th className="p-2 border-r border-slate-300 text-center">Title Count</th>
                              <th className="p-2 border-r border-slate-300 text-center">Copyright 2020–2025</th>
                              <th className="p-2 text-center">Subscribed E-Journals</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">PE Foundations, History & Principles</td>
                              <td className="p-2 border-r border-slate-200 text-center">210 titles</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">88 titles</td>
                              <td className="p-2 text-center text-brand-800 font-medium">ProQuest Central</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">Biomechanics, Anatomy & Exercise Physiology</td>
                              <td className="p-2 border-r border-slate-200 text-center">185 titles</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">72 titles</td>
                              <td className="p-2 text-center text-brand-800 font-medium">ScienceDirect Elsevier</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">Sports Officiating, Coaching & Management</td>
                              <td className="p-2 border-r border-slate-200 text-center">160 titles</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">64 titles</td>
                              <td className="p-2 text-center text-brand-800 font-medium">EBSCOhost Academic</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">Philippine Traditional Games & Folk Dance</td>
                              <td className="p-2 border-r border-slate-200 text-center">145 titles</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">59 titles</td>
                              <td className="p-2 text-center text-brand-800 font-medium">Phil. E-Journals</td>
                            </tr>
                            <tr className="bg-slate-50 font-bold">
                              <td colSpan={3} className="p-2 border-r border-slate-200">TOTAL PROFESSIONAL COLLECTION</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">1,842 titles</td>
                              <td className="p-2 border-r border-slate-200 text-center font-black text-brand-900">78.4% Recent</td>
                              <td className="p-2 text-center text-success-700 font-black">ADEQUATE & COMPLIANT</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 05 Practicum / OJT Industry Table */}
                    {(activePdfDoc.req.code === 'COPC-OJT' || activePdfDoc.req.code === 'COPC-PRAC') && (
                      <div className="overflow-hidden border border-slate-300 rounded text-[11px]">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                            <tr>
                              <th className="p-2 border-r border-slate-300">Host Training Partner Agency</th>
                              <th className="p-2 border-r border-slate-300">Partnership Scope</th>
                              <th className="p-2 border-r border-slate-300 text-center">MOA Validity</th>
                              <th className="p-2 text-center">Legal / Notary Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">DepEd Division of Surigao del Sur (Tandag Pilot High)</td>
                              <td className="p-2 border-r border-slate-200">Practice Teaching Internship (360 hrs)</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">2024–2029</td>
                              <td className="p-2 text-center text-success-700 font-bold">Notarized & Active</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">Surigao del Sur Provincial Sports Development Office</td>
                              <td className="p-2 border-r border-slate-200">Athletic Coaching & Event Management</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">2023–2028</td>
                              <td className="p-2 text-center text-success-700 font-bold">Notarized & Active</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">NEMSU Laboratory Secondary High School</td>
                              <td className="p-2 border-r border-slate-200">Pre-Service Clinical Internship</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">2024–2027</td>
                              <td className="p-2 text-center text-success-700 font-bold">Internal MOA Active</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-r border-slate-200 font-semibold">Philippine Red Cross - Surigao del Sur Chapter</td>
                              <td className="p-2 border-r border-slate-200">Sports First Aid & Emergency Response</td>
                              <td className="p-2 border-r border-slate-200 text-center font-bold">2024–2028</td>
                              <td className="p-2 text-center text-success-700 font-bold">Notarized & Active</td>
                            </tr>
                            <tr className="bg-slate-50 font-bold">
                              <td colSpan={3} className="p-2 border-r border-slate-200">STUDENT INTERNSHIP PROGRAM COMPLIANCE (SIPP CMO COMPLIANT)</td>
                              <td className="p-2 text-center text-success-700 font-black">100% COMPLIANT</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* RQAT Reviewer Findings & Verification Certification */}
                  <div className="relative my-6 rounded border border-slate-200 bg-slate-50 p-3.5 font-sans text-xs space-y-1.5">
                    <p className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">
                      II. Formal Institutional Declaration & RQAT Verification
                    </p>
                    <p className="text-slate-600 leading-relaxed italic text-[11px]">
                      "This evidence dossier and all associated academic records for {activePdfDoc.req.category} have been thoroughly inspected and verified compliant with the minimum Policies, Standards, and Guidelines (PSGs) pursuant to {activePdfDoc.copcRecord.cmoNo || 'applicable CHED CMO Policies'}."
                    </p>
                    {activePdfDoc.req.deficiencyNote && (
                      <div className="mt-2 p-2 bg-white rounded border border-slate-200 text-[11px] text-slate-800">
                        <span className="font-bold text-brand-800">Auditor Notes: </span>
                        {activePdfDoc.req.deficiencyNote}
                      </div>
                    )}
                  </div>

                  {/* Signatures & Official RQAT Stamp */}
                  <div className="relative mt-8 pt-4 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end font-sans">
                    <div className="text-center">
                      <div className="border-b border-slate-700 w-36 mx-auto mb-1"></div>
                      <p className="text-[11px] font-bold text-slate-900 uppercase">Dr. Maria Elena Santos</p>
                      <p className="text-[10px] text-slate-500">Program Department Chair</p>
                    </div>

                    <div className="text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-brand-600 bg-brand-50 text-brand-800 p-1">
                        <div className="text-center">
                          <p className="text-[8px] font-black uppercase tracking-widest text-brand-700">CHED RQAT</p>
                          <p className="text-[9px] font-black text-brand-800">VERIFIED</p>
                          <p className="text-[7px] text-brand-600">REGION XIII</p>
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-brand-800 mt-1 uppercase">RQAT Validation Seal</p>
                    </div>

                    <div className="text-center">
                      <div className="border-b border-slate-700 w-36 mx-auto mb-1"></div>
                      <p className="text-[11px] font-bold text-slate-900 uppercase">Dr. Cheryl A. Ramos</p>
                      <p className="text-[10px] text-slate-500">Director, Quality Assurance</p>
                    </div>
                  </div>

                  {/* Document Footer */}
                  <div className="relative mt-8 pt-3 border-t border-slate-200 flex items-center justify-between font-sans text-[9px] text-slate-400">
                    <span>NEMSU-COPC-EVIDENCE-2026 · Confidential Academic Audit Record</span>
                    <span>Page 1 of 1</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Upload & Verify COPC Evidence Modal */}
      {uploadCopc && (
        <Modal
          open={!!uploadCopc}
          onClose={() => setUploadCopc(null)}
          title="Upload Official Certificate"
          description={`${uploadCopc.programName} · ${uploadCopc.campusName}`}
          size="lg"
          footer={
            <div className="flex w-full items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUploadCopc(null)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveUploadRequirement}
                className="btn btn-primary btn-sm"
              >
                Save Certificate
              </button>
            </div>
          }
        >
          <div className="space-y-4">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="rounded bg-brand-50 px-2 py-0.5 font-mono text-[11px] font-bold text-brand-700">
                      CHED-CERT · Official Certificate
                    </span>
                    <h4 className="mt-1 text-xs font-bold text-ink">
                      Official CHED Certificate of Program Compliance (COPC)
                    </h4>
                  </div>
                  <Badge tone={uploadCopc.documentLink ? 'success' : 'warning'} dot>
                    {uploadCopc.documentLink ? 'Certificate Attached' : 'Awaiting Upload'}
                  </Badge>
                </div>

                {/* Certificate Upload: Pure File Upload Only */}
                {uploadDocName && !showDropzone ? (
                  <FileList>
                    <FileRow
                      name={uploadDocName}
                      fileType={uploadDocName}
                      meta="Official certificate attached"
                      onOpen={() => {
                        setViewingCertificateCopc(uploadCopc);
                        setViewModalTab('certificate');
                      }}
                      status={
                        <Badge tone={uploadCopc.copcStatus === 'Compliant' ? 'success' : 'warning'} dot>
                          {uploadCopc.copcStatus === 'Compliant' ? 'Active' : 'Pending'}
                        </Badge>
                      }
                      actions={
                        <>
                          <FileRowAction
                            icon={EyeIcon}
                            label="View certificate"
                            onClick={() => {
                              setViewingCertificateCopc(uploadCopc);
                              setViewModalTab('certificate');
                            }}
                          />
                          <FileRowAction icon={PencilIcon} label="Replace file" onClick={() => setShowDropzone(true)} />
                        </>
                      }
                    />
                  </FileList>
                ) : (
                  <div className="space-y-2">
                    <UploadDropzone
                      onFiles={(uploads) => attachFileToUploadCopc(uploads[0].file)}
                      multiple={false}
                      accept=".pdf,.png,.jpg,.jpeg"
                      disabled={simulatedUploading}
                      title={simulatedUploading ? 'Attaching file…' : 'Upload the official COPC certificate'}
                      hint="PDF, PNG or JPG · one file"
                      browseLabel="Choose certificate file"
                    />
                    {uploadDocName && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowDropzone(false)}
                          className="btn btn-ghost btn-sm h-8 px-2.5 text-xs text-ink-muted hover:text-ink"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
          </div>
        </Modal>
      )}

      {/* Edit COPC Record Modal (Edits Program Info, Uploaded Certificate, and 5/5 Requirements Audit) */}
      {editingCopc && (
        <Modal
          open={!!editingCopc}
          onClose={() => setEditingCopc(null)}
          title={`Edit COPC Record: ${editingCopc.programName}`}
          description={`${editingCopc.campusName} · ${editingCopc.degreeLevel}`}
          size="xl"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">COPC Status</label>
                    <select
                      value={editForm.copcStatus}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          copcStatus: e.target.value as 'Compliant' | 'Pending Review' | 'Non-Compliant' | 'Not Applicable (Under 5 years)'
                        }))
                      }
                      className="input select text-xs hover:border-brand-300"
                    >
                      <option value="Compliant">Compliant (Active COPC)</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Non-Compliant">Non-Compliant</option>
                      <option value="Not Applicable (Under 5 years)">Not Applicable (Under 5 years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Certificate Number</label>
                    <input
                      type="text"
                      placeholder="e.g. CHED-RO13-COPC-No. 2023-0142"
                      value={editForm.certificateNumber}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, certificateNumber: e.target.value }))}
                      className="input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Date Issued</label>
                    <input
                      type="text"
                      placeholder="e.g. 2023-06-15 or June 15, 2023"
                      value={editForm.dateIssued}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, dateIssued: e.target.value }))}
                      className="input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">CHED CMO Policy</label>
                    <input
                      type="text"
                      placeholder="e.g. CMO No. 25, Series of 2015"
                      value={editForm.cmoNo}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, cmoNo: e.target.value }))}
                      className="input text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-ink mb-1">Board of Regents (BOR) Resolution</label>
                    <input
                      type="text"
                      placeholder="e.g. BOR Res. No. 42, Series of 2022"
                      value={editForm.borRes}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, borRes: e.target.value }))}
                      className="input text-xs"
                    />
                  </div>

                  {/* Upload / Edit Official Certificate File */}
                  <div className="sm:col-span-2 rounded-xl border border-line bg-canvas/50 p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-2">
                      <div>
                        <span className="text-xs font-bold text-ink">Official Issued Certificate File</span>
                        <p className="text-[11px] text-ink-subtle">
                          The official scanned certificate displayed in the certificate viewer.
                        </p>
                      </div>
                      <label className="btn btn-secondary btn-sm h-8 px-2.5 text-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                        <UploadIcon className="h-3.5 w-3.5" />
                        <span>{editSimulatedUploading ? 'Attaching...' : 'Upload / Replace Certificate'}</span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleEditCertFileUpload}
                          disabled={editSimulatedUploading}
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="e.g. BSCS_Official_CHED_COPC_Certificate.pdf"
                      value={editForm.certFileName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, certFileName: e.target.value }))}
                      className="input text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-ink mb-1">Remarks / Reviewer Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Additional notes or regulatory observations..."
                      value={editForm.remarks}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, remarks: e.target.value }))}
                      className="input text-xs"
                    />
                  </div>
                </div>
              </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setEditingCopc(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      <CopcDocumentsModal
        open={!!docsModalCopc}
        record={docsModalCopc}
        preferredFolderCode={docsModalFolder}
        onClose={() => setDocsModalCopc(null)}
      />
    </>
  );
}
