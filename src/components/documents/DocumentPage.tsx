import React from 'react';
import { EvidenceDocument } from '../../types/evidence';
import { useLookup } from '../../hooks/useLookup';
import { Highlight } from '../ui/Highlight';
import { formatDate } from '../../utils/format';

interface DocumentPageProps {
  doc: EvidenceDocument;
  terms?: string[];
  activePassage?: number | null;
}

const fillerWidths = ['100%', '96%', '98%', '88%', '100%', '93%', '64%'];

export function DocumentPage({ doc, terms = [], activePassage = null }: DocumentPageProps) {
  const lookup = useLookup();
  const framework = lookup.framework(doc.frameworkId);
  const criterion = lookup.criterion(doc.criterionId);
  const indicator = lookup.indicator(doc.indicatorId);

  return (
    <article
      aria-label={`Preview of ${doc.title}`}
      className="mx-auto w-full max-w-[760px] bg-white px-7 py-10 font-serif text-ink shadow-sm ring-1 ring-line sm:px-14 sm:py-14">
      
      <header className="border-b-2 border-brand-700 pb-4 text-center font-sans">
        <p className="text-[11px] font-semibold tracking-wide text-brand-800">NORTH EASTERN MINDANAO STATE UNIVERSITY</p>
        <p className="text-[11px] text-ink-muted">Main Campus · Tandag City, Surigao del Sur</p>
        <p className="mt-1 text-[11px] text-ink-muted">{doc.office}</p>
      </header>

      <h2 className="mt-8 text-center text-2xl font-semibold leading-snug">
        <Highlight text={doc.title} terms={terms} />
      </h2>
      <p className="mt-2 text-center font-sans text-xs text-ink-muted">
        {doc.docType} · AY {doc.academicYear} · {formatDate(doc.documentDate)}
      </p>

      <section className="mt-8 space-y-5 text-[15px] leading-7">
        <h3 className="font-sans text-sm font-semibold text-ink">I. Overview</h3>
        <p>
          <Highlight text={doc.description} terms={terms} />
        </p>

        <h3 className="font-sans text-sm font-semibold text-ink">II. Key Findings</h3>
        {doc.passages.map((passage, i) =>
        <p
          key={i}
          id={`passage-${i}`}
          className={`-mx-2 scroll-mt-24 rounded px-2 transition-colors duration-200 ${
          activePassage === i ? 'bg-brand-50 ring-2 ring-brand-200' : ''}`
          }>
          
            <Highlight text={passage} terms={terms} />
          </p>
        )}

        <div className="space-y-2.5 pt-2" aria-hidden="true">
          {fillerWidths.map((w, i) =>
          <div key={i} className="h-2 rounded-sm bg-canvas" style={{ width: w }} />
          )}
        </div>

        {criterion &&
        <>
            <h3 className="font-sans text-sm font-semibold text-ink">III. Accreditation Reference</h3>
            <p>
              This document is submitted as evidence for {criterion.code} – {criterion.name}
              {indicator ? `, Indicator ${indicator.code} (${indicator.name})` : ''}, under {framework?.name}.
            </p>
          </>
        }
      </section>

      <footer className="mt-12 flex justify-between border-t border-line pt-3 font-sans text-[11px] text-ink-subtle">
        <span>
          {doc.id.toUpperCase()} · {doc.confidentiality}
        </span>
        <span>Page 1 of {doc.pages}</span>
      </footer>
    </article>);

}