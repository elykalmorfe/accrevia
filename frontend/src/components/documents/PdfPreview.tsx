import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

/** Render original PDF bytes without depending on the browser's PDF plugin. */
export function PdfPreview({ blob, src, title, heightClass = 'h-[70vh]' }: {
  blob?: Blob; src?: string; title: string; heightClass?: string;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [width, setWidth] = useState(640);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let task: ReturnType<typeof getDocument> | undefined;
    const controller = new AbortController();
    setPdf(null);
    setError('');
    setPage(1);
    async function load() {
      let original = blob;
      if (!original) {
        if (!src) throw new Error('The original PDF is unavailable.');
        const response = await fetch(src, { signal: controller.signal });
        if (!response.ok) throw new Error('The original PDF could not be retrieved.');
        original = await response.blob();
      }
      const bytes = new Uint8Array(await original.arrayBuffer());
      if (!new TextDecoder().decode(bytes.subarray(0, 1024)).includes('%PDF-')) {
        throw new Error('This saved file is not a valid PDF. Upload the original PDF again.');
      }
      if (cancelled) return;
      task = getDocument({ data: bytes });
      const document = await task.promise;
      if (!cancelled) setPdf(document);
    }
    void load().catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'This PDF could not be read.');
    });
    return () => {
      cancelled = true;
      controller.abort();
      if (task) void task.destroy();
    };
  }, [blob, src]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(1, entry.contentRect.width - 24)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    let rendering: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined;
    void pdf.getPage(page).then(async (pdfPage) => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      const scale = width / pdfPage.getViewport({ scale: 1 }).width;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = pdfPage.getViewport({ scale: scale * ratio });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.width = `${viewport.width / ratio}px`;
      canvas.style.height = `${viewport.height / ratio}px`;
      rendering = pdfPage.render({ canvas, viewport });
      await rendering.promise;
    }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'This page could not be rendered.');
    });
    return () => { cancelled = true; rendering?.cancel(); };
  }, [pdf, page, width]);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white" aria-label={title}>
      {pdf && !error && (
        <div className="flex items-center justify-center gap-3 border-b border-line p-2 text-sm text-ink">
          <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <span>Page {page} of {pdf.numPages}</span>
          <button type="button" className="btn btn-secondary btn-sm" disabled={page >= pdf.numPages} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      )}
      <div ref={containerRef} className={`overflow-auto bg-slate-100 p-3 ${heightClass}`}>
        {error ? <p role="alert" className="rounded-lg bg-white p-6 text-sm text-ink">{error}</p>
          : !pdf ? <p role="status" className="p-6 text-center text-sm text-ink-muted">Loading PDF…</p>
          : <canvas ref={canvasRef} className="mx-auto bg-white shadow" aria-label={`${title}, page ${page}`} />}
      </div>
    </div>
  );
}
