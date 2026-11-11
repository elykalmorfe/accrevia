import { useMemo } from 'react';
import { BadgeCheckIcon, ExternalLinkIcon, EyeIcon, FileCheck2Icon, FileCheckIcon, UploadIcon } from 'lucide-react';
import { usePortal } from '../../contexts/PortalContext';
import { pluralize } from '../../utils/format';
import type { EvidenceDocument } from '../../types/evidence';

/** Certificates stored under `areaKey`, newest first, plus the active one and its level folder name. */
export function useCampusCertificates(frameworkId: string, areaKey: string) {
  const { documents, folders } = usePortal();

  const certificates = useMemo(
    () =>
      documents
        .filter((d) => d.frameworkId === frameworkId && d.areaId === areaKey)
        .sort((a, b) => (b.dateAdded || '').localeCompare(a.dateAdded || '') || b.id.localeCompare(a.id)),
    [documents, frameworkId, areaKey]
  );

  const levelFolderOf = useMemo(() => {
    return (folderId?: string) => {
      let cursor = folders.find((f) => f.id === folderId);
      while (cursor && !cursor.isSystem) cursor = folders.find((f) => f.id === cursor?.parentId);
      return cursor?.areaId === areaKey ? cursor : undefined;
    };
  }, [folders, areaKey]);

  const levelCount = useMemo(
    () => new Set(certificates.map((d) => levelFolderOf(d.folderId)?.id).filter(Boolean)).size,
    [certificates, levelFolderOf]
  );

  const activeCertificate = certificates.find((d) => d.isActive);
  const activeLevel = activeCertificate ? levelFolderOf(activeCertificate.folderId)?.name : undefined;

  return { certificates, activeCertificate, activeLevel, levelCount };
}

const CERT_STRIP = {
  active: {
    box: 'border-success-100 bg-success-50',
    icon: 'text-success-700 ring-success-100',
    title: 'text-success-700',
    button: 'border-success-100 text-success-700 hover:border-success-600'
  },
  inactive: {
    box: 'border-warning-100 bg-warning-50',
    icon: 'text-warning-700 ring-warning-100',
    title: 'text-warning-700',
    button: 'border-warning-100 text-warning-700 hover:border-warning-600'
  },
  empty: {
    box: 'border-line bg-canvas',
    icon: 'text-ink-subtle ring-line',
    title: 'text-ink',
    button: 'border-line text-ink-muted hover:border-brand-300 hover:text-brand-700'
  }
} as const;

interface OfficialCertificatesStripProps {
  certificates: EvidenceDocument[];
  activeCertificate?: EvidenceDocument;
  activeLevel?: string;
  levelCount: number;
  isAdmin: boolean;
  onOpen: () => void;
  onPreview: (doc: EvidenceDocument) => void;
  /** Legacy external link shown while nothing has been uploaded. */
  fallbackUrl?: string;
  className?: string;
}

export function OfficialCertificatesStrip({
  certificates,
  activeCertificate,
  activeLevel,
  levelCount,
  isAdmin,
  onOpen,
  onPreview,
  fallbackUrl,
  className = 'mt-3'
}: OfficialCertificatesStripProps) {
  const tone = activeCertificate ? 'active' : certificates.length > 0 ? 'inactive' : 'empty';
  const style = CERT_STRIP[tone];

  return (
    <div className={`${className} flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-xs ${style.box}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ${style.icon}`}>
          <FileCheck2Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className={`font-semibold ${style.title}`}>Official Certificates</p>
          <p className="truncate text-[11.5px] text-ink-muted">
            {activeCertificate ? (
              <>
                Active:{' '}
                <button
                  type="button"
                  onClick={() => onPreview(activeCertificate)}
                  className="font-semibold text-ink hover:text-brand-700 hover:underline"
                >
                  {activeCertificate.title}
                </button>
                {activeLevel && ` · ${activeLevel}`} · {pluralize(certificates.length, 'certificate')}
              </>
            ) : certificates.length > 0 ? (
              `${pluralize(certificates.length, 'certificate')} · ${pluralize(levelCount, 'level')} · none active yet`
            ) : (
              'No certificate uploaded yet.'
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {certificates.length === 0 && fallbackUrl && (
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-ink-muted hover:text-brand-700 hover:underline"
          >
            Linked file <ExternalLinkIcon className="h-3 w-3" />
          </a>
        )}
        {activeCertificate && (
          <button
            type="button"
            onClick={() => onPreview(activeCertificate)}
            title={`View active certificate: ${activeCertificate.title}`}
            aria-label={`View active certificate: ${activeCertificate.title}`}
            className={`inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border bg-white transition ${CERT_STRIP.active.button}`}
          >
            <EyeIcon className="h-3.5 w-3.5" />
          </button>
        )}
        {tone === 'inactive' && isAdmin ? (
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warning-100 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-warning-700 transition hover:border-warning-600"
          >
            <BadgeCheckIcon className="h-3.5 w-3.5" />
            Certificates
          </button>
        ) : certificates.length > 0 ? (
          <button
            type="button"
            onClick={onOpen}
            className={`inline-flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-[12px] font-semibold transition ${style.button}`}
          >
            <FileCheckIcon className="h-3.5 w-3.5" />
            Certificates ({certificates.length})
          </button>
        ) : isAdmin ? (
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-muted transition hover:border-brand-300 hover:text-brand-700"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            Upload Certificate
          </button>
        ) : null}
      </div>
    </div>
  );
}
