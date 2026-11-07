import { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export const MAX_PRINT_COPIES = 50;

/** Styles shared by the on-screen preview and the printed document; every class is `pr-` prefixed. */
export const REPORT_CSS = `
.pr-doc { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #111827; font-size: 10pt; line-height: 1.4; background: #fff; }
.pr-doc * { box-sizing: border-box; }
.pr-header { display: flex; align-items: center; gap: 14px; border-bottom: 2.5px solid #0f3d7a; padding-bottom: 10px; }
.pr-logo { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.pr-header-text { flex: 1; text-align: center; }
.pr-header-spacer { width: 64px; flex-shrink: 0; }
.pr-republic { font-size: 8.5pt; color: #374151; }
.pr-univ { font-size: 13pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 1px 0; }
.pr-office { font-size: 9pt; font-weight: 600; color: #0f3d7a; text-transform: uppercase; }
.pr-address { font-size: 8pt; color: #4b5563; }
.pr-title { font-size: 12.5pt; font-weight: 700; text-align: center; text-transform: uppercase; margin: 12px 0 2px; letter-spacing: 0.03em; }
.pr-subtitle { text-align: center; font-size: 9pt; color: #4b5563; margin: 0; }
.pr-meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 3px 18px; font-size: 8.5pt; color: #1f2937; border: 1px solid #d1d5db; background: #f8fafc; padding: 6px 9px; margin: 10px 0 4px; }
.pr-meta b { font-weight: 700; }
.pr-section { margin-top: 14px; }
.pr-section-title { font-size: 9.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1px solid #9ca3af; padding-bottom: 3px; margin: 0 0 6px; color: #0f3d7a; }
.pr-note { font-size: 8pt; color: #4b5563; margin: 4px 0 0; }
.pr-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.pr-stat { border: 1px solid #d1d5db; padding: 6px 8px; }
.pr-stat-value { display: block; font-size: 15pt; font-weight: 700; line-height: 1.15; }
.pr-stat-label { font-size: 8pt; color: #4b5563; }
.pr-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
.pr-table th, .pr-table td { border: 1px solid #9ca3af; padding: 4px 5px; text-align: left; vertical-align: top; }
.pr-table th { background: #e8eef6; font-weight: 700; }
.pr-table tfoot td { font-weight: 700; background: #f3f4f6; }
.pr-c { text-align: center !important; }
.pr-empty { font-style: italic; color: #6b7280; text-align: center !important; }
.pr-pass, .pr-up { color: #047857; font-weight: 700; }
.pr-fail, .pr-down, .pr-expired { color: #b91c1c; font-weight: 700; }
.pr-pending, .pr-expiring { color: #b45309; font-weight: 700; }
.pr-kv { width: 100%; border-collapse: collapse; font-size: 9pt; }
.pr-kv th, .pr-kv td { border: 1px solid #9ca3af; padding: 5px 7px; text-align: left; vertical-align: top; }
.pr-kv th { width: 30%; background: #e8eef6; font-weight: 700; }
.pr-text { white-space: pre-wrap; border: 1px solid #9ca3af; padding: 8px 10px; min-height: 90px; font-size: 9.5pt; }
.pr-text-empty { color: #6b7280; font-style: italic; }
.pr-signatories { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 36px; margin-top: 30px; break-inside: avoid; page-break-inside: avoid; }
.pr-sign-label { font-weight: 600; font-size: 9.5pt; }
.pr-sign-line { margin-top: 36px; border-top: 1px solid #111827; padding-top: 3px; text-align: center; }
.pr-sign-name { font-weight: 700; text-transform: uppercase; min-height: 1.3em; }
.pr-sign-role { font-size: 8.5pt; color: #374151; }
.pr-sign-date { font-size: 8.5pt; margin-top: 10px; }
.pr-footer { margin-top: 18px; border-top: 1px solid #d1d5db; padding-top: 4px; font-size: 7.5pt; color: #6b7280; display: flex; justify-content: space-between; gap: 12px; }
`;

function pageCss(landscape: boolean): string {
  return `
@page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 12mm 11mm; }
html, body { margin: 0; padding: 0; background: #fff; }
body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.pr-copy { break-after: page; page-break-after: always; }
.pr-copy:last-child { break-after: auto; page-break-after: auto; }
.pr-table thead { display: table-header-group; }
.pr-table tr { break-inside: avoid; page-break-inside: avoid; }
.pr-section-title { break-after: avoid; page-break-after: avoid; }
`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

export function clampCopies(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.floor(value), 1), MAX_PRINT_COPIES);
}

/** `November 3, 2026, 9:14:05 PM` */
export function formatPrintTimestamp(d: Date): string {
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

interface PrintOptions {
  title: string;
  /** One rendered HTML document body per copy, printed in order with a page break between copies. */
  copies: string[];
  landscape?: boolean;
}

/**
 * Prints the given copies through a hidden iframe so only the report (not the app shell) is printed.
 * Browsers do not let pages preset the copy count in the print dialog, so copies are laid out as
 * separate page-broken documents in a single print job.
 */
export function printHtmlDocument({ title, copies, landscape = false }: PrintOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('tabindex', '-1');
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = iframe.contentDocument;
    if (!win || !doc) {
      iframe.remove();
      reject(new Error('Unable to open print frame'));
      return;
    }

    const body = copies.map((html, i) => `<div class="pr-copy" data-copy="${i + 1}">${html}</div>`).join('');
    doc.open();
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>` +
        `<base href="${window.location.origin}/"><style>${pageCss(landscape)}${REPORT_CSS}</style></head>` +
        `<body>${body}</body></html>`
    );
    doc.close();

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      window.setTimeout(() => iframe.remove(), 300);
      resolve();
    };

    const images = Array.from(doc.images);
    Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((done) => {
              img.onload = () => done();
              img.onerror = () => done();
            })
      )
    ).then(() => {
      win.addEventListener('afterprint', cleanup, { once: true });
      win.focus();
      win.print();
      window.setTimeout(cleanup, 10 * 60_000);
    });
  });
}

/** Renders one copy per requested count, all stamped with the same exact print time, and opens the print dialog. */
export async function printReactDocument(options: {
  title: string;
  copies: number;
  landscape?: boolean;
  render: (printedAt: Date, copyIndex: number, copyCount: number) => ReactElement;
}): Promise<{ printedAt: Date; copies: number }> {
  const count = clampCopies(options.copies);
  const printedAt = new Date();
  const html = Array.from({ length: count }, (_, i) => renderToStaticMarkup(options.render(printedAt, i + 1, count)));
  await printHtmlDocument({ title: options.title, copies: html, landscape: options.landscape });
  return { printedAt, copies: count };
}
