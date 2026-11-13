import React, { useEffect, useRef, useState } from 'react';
import { DownloadIcon, ExternalLinkIcon, FileWarningIcon, InfoIcon, LoaderIcon } from 'lucide-react';
import { EvidenceDocument } from '../../types/evidence';
import { getStoredFile, saveStoredFile, StoredFile } from '../../utils/fileStore';
import { driveEmbedUrl } from '../../utils/driveLinks';
import { isLocalCertificatePath } from '../../utils/linkedCertificates';
import { DocumentPage } from './DocumentPage';

interface OriginalDocumentViewProps {
  doc: EvidenceDocument;
  terms?: string[];
  activePassage?: number | null;
  canDownload?: boolean;
  /** Tailwind height class for embedded viewers (PDF, text, spreadsheets). */
  heightClass?: string;
}

type Kind = 'pdf' | 'image' | 'docx' | 'xlsx' | 'csv' | 'text' | 'unsupported';

const BROWSER_IMAGE = /^image\/(png|jpe?g|gif|webp|svg\+xml|bmp|avif)$/;

function isUrlLike(value?: string | null): boolean {
  return /^https?:\/\//i.test((value || '').trim());
}

function detectKind(file: StoredFile): Kind {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (file.type === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (BROWSER_IMAGE.test(file.type) || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(ext)) return 'image';
  if (ext === 'docx') return 'docx';
  if (ext === 'xlsx') return 'xlsx';
  if (ext === 'csv') return 'csv';
  if (file.type.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'log'].includes(ext)) return 'text';
  return 'unsupported';
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function SheetTable({ rows }: { rows: unknown[][] }) {
  if (!rows.length) return <p className="p-6 text-center text-sm text-ink-muted">This sheet is empty.</p>;
  const width = Math.max(...rows.map((r) => r.length));
  return (
    <table className="min-w-full border-collapse font-sans text-[12.5px]">
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className={r === 0 ? 'bg-slate-50 font-semibold' : 'odd:bg-white even:bg-slate-50/50'}>
            <td className="sticky left-0 border border-line bg-slate-100 px-2 py-1 text-right text-[11px] text-ink-subtle">{r + 1}</td>
            {Array.from({ length: width }, (_, c) => (
              <td key={c} className="whitespace-pre-wrap border border-line px-2.5 py-1 align-top text-ink">
                {formatCell(row[c])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DocxView({ blob }: { blob: Blob }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    import('docx-preview')
      .then(({ renderAsync }) =>
        renderAsync(blob, container, undefined, { className: 'docx', inWrapper: true, ignoreLastRenderedPageBreak: true })
      )
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [blob]);

  if (error) return <UnsupportedNotice message="This Word document could not be rendered in the browser." />;
  return <div ref={containerRef} className="docx-original overflow-auto" />;
}

function XlsxView({ blob, heightClass }: { blob: Blob; heightClass: string }) {
  const [sheets, setSheets] = useState<{ sheet: string; data: unknown[][] }[] | null>(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('read-excel-file/browser')
      .then(({ default: readXlsxFile }) => readXlsxFile(blob))
      .then((result) => !cancelled && setSheets(result as { sheet: string; data: unknown[][] }[]))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [blob]);

  if (error) return <UnsupportedNotice message="This spreadsheet could not be read in the browser." />;
  if (!sheets) return <Loading />;
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      {sheets.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b border-line bg-slate-50 px-2 pt-2">
          {sheets.map((s, i) => (
            <button
              key={s.sheet}
              type="button"
              onClick={() => setActive(i)}
              className={`rounded-t-lg px-3 py-1.5 text-xs font-semibold ${
                i === active ? 'border border-b-0 border-line bg-white text-brand-700' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {s.sheet}
            </button>
          ))}
        </div>
      )}
      <div className={`overflow-auto ${heightClass}`}>
        <SheetTable rows={sheets[active]?.data ?? []} />
      </div>
    </div>
  );
}

function TextView({ blob, csv, heightClass }: { blob: Blob; csv: boolean; heightClass: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    blob.text().then((t) => !cancelled && setText(t));
    return () => {
      cancelled = true;
    };
  }, [blob]);

  if (text === null) return <Loading />;
  return (
    <div className={`overflow-auto rounded-xl border border-line bg-white ${heightClass}`}>
      {csv ? (
        <SheetTable rows={parseCsv(text)} />
      ) : (
        <pre className="whitespace-pre-wrap p-5 font-mono text-[12.5px] leading-relaxed text-ink">{text}</pre>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center gap-2 text-sm text-ink-muted">
      <LoaderIcon className="h-4 w-4 animate-spin" /> Loading original document…
    </div>
  );
}

function UnsupportedNotice({ message, url, name, canDownload }: { message: string; url?: string; name?: string; canDownload?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 ring-1 ring-brand-100">
        <FileWarningIcon className="h-7 w-7" />
      </span>
      <p className="mt-4 text-[15px] font-bold text-ink">{name ?? 'Original document'}</p>
      <p className="mt-1 max-w-sm text-[13px] text-ink-muted">{message}</p>
      {url && (
        <div className="mt-4 flex gap-2">
          <a href={url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLinkIcon className="h-4 w-4" /> Open in new tab
          </a>
          {canDownload && (
            <a href={url} download={name} className="btn btn-primary btn-sm">
              <DownloadIcon className="h-4 w-4" /> Download original
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function LinkedDocumentView({ doc, url, heightClass }: { doc: EvidenceDocument; url: string; heightClass: string }) {
  const embedUrl = driveEmbedUrl(url);
  if (!embedUrl) {
    return (
      <UnsupportedNotice
        name={doc.title}
        url={url}
        message="The original certificate is stored in Google Drive. Open it to view the real file."
      />
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-sans text-[12px] text-ink-muted">
        <span className="flex items-center gap-2">
          <InfoIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          Showing the original certificate from Google Drive.
        </span>
        <a href={url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm shrink-0">
          <ExternalLinkIcon className="h-3.5 w-3.5" /> Open original
        </a>
      </div>
      <iframe
        title={doc.title}
        src={embedUrl}
        allow="autoplay"
        className={`w-full rounded-xl border border-line bg-white ${heightClass}`}
      />
    </div>
  );
}

async function loadOriginalFile(doc: EvidenceDocument): Promise<StoredFile | undefined> {
  const stored = await getStoredFile(doc.id).catch(() => undefined);
  if (stored) return stored;

  const href = doc.documentUrl?.trim();
  if (!href || !isLocalCertificatePath(href)) return undefined;

  const res = await fetch(href);
  if (!res.ok) return undefined;
  const blob = await res.blob();
  const name = href.split('/').pop() || `${doc.id}.pdf`;
  await saveStoredFile(doc.id, blob, name).catch(() => undefined);
  return {
    id: doc.id,
    name,
    type: blob.type,
    size: blob.size,
    blob,
    storedAt: new Date().toISOString()
  };
}

export function OriginalDocumentView({
  doc,
  terms = [],
  activePassage = null,
  canDownload = true,
  heightClass = 'h-[70vh]'
}: OriginalDocumentViewProps) {
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'missing'; file?: StoredFile; url?: string }>({
    status: 'loading'
  });

  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;
    setState({ status: 'loading' });
    loadOriginalFile(doc)
      .then((file) => {
        if (cancelled) return;
        if (!file) return setState({ status: 'missing' });
        const kind = detectKind(file);
        const blob = kind === 'pdf' && file.type !== 'application/pdf' ? new Blob([file.blob], { type: 'application/pdf' }) : file.blob;
        url = URL.createObjectURL(blob);
        setState({ status: 'ready', file: { ...file, blob }, url });
      })
      .catch(() => !cancelled && setState({ status: 'missing' }));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [doc.id, doc.documentUrl]);

  if (state.status === 'loading') return <Loading />;

  if ((state.status === 'missing' || !state.file || !state.url) && doc.documentUrl && isUrlLike(doc.documentUrl) && !isLocalCertificatePath(doc.documentUrl)) {
    return <LinkedDocumentView doc={doc} url={doc.documentUrl} heightClass={heightClass} />;
  }

  if ((state.status === 'missing' || !state.file || !state.url) && isLocalCertificatePath(doc.documentUrl)) {
    return (
      <UnsupportedNotice
        name={doc.title}
        url={doc.documentUrl}
        canDownload={canDownload}
        message="The certificate file could not be loaded from local storage. Open or download it directly."
      />
    );
  }

  if (state.status === 'missing' || !state.file || !state.url) {
    return (
      <div className="space-y-3">
        <div className="mx-auto flex max-w-[760px] items-start gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-sans text-[12px] text-ink-muted">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>No original file is stored for this record, so a generated summary is shown instead. Re-upload the file to view the original.</span>
        </div>
        <DocumentPage doc={doc} terms={terms} activePassage={activePassage} />
      </div>
    );
  }

  const { file, url } = state;
  const pdfHeight = doc.docType === 'Certificate' ? 'h-[min(78vh,620px)]' : heightClass;
  switch (detectKind(file)) {
    case 'pdf':
      return (
        <iframe
          title={file.name}
          src={`${url}#toolbar=1&navpanes=0&view=FitH`}
          className={`w-full rounded-xl border border-line bg-white ${pdfHeight}`}
        />
      );
    case 'image':
      return (
        <div className="flex justify-center rounded-xl border border-line bg-white p-3">
          <img src={url} alt={file.name} className="max-h-[75vh] max-w-full rounded-lg object-contain" />
        </div>
      );
    case 'docx':
      return <DocxView blob={file.blob} />;
    case 'xlsx':
      return <XlsxView blob={file.blob} heightClass={heightClass} />;
    case 'csv':
      return <TextView blob={file.blob} csv heightClass={heightClass} />;
    case 'text':
      return <TextView blob={file.blob} csv={false} heightClass={heightClass} />;
    default:
      return (
        <UnsupportedNotice
          name={file.name}
          url={url}
          canDownload={canDownload}
          message="Your browser can't preview this file type inline, but the original file is stored and can be opened or downloaded."
        />
      );
  }
}
