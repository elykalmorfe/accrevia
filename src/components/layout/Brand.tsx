import React from 'react';
import { Link } from 'react-router-dom';

export function Brand({ showSubtitle = true }: {showSubtitle?: boolean;}) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
      <span className="relative grid h-9 w-9 place-items-center rounded-md bg-brand-700 font-serif text-lg font-bold text-white" aria-hidden="true">
        A
        <span className="absolute bottom-1.5 left-2.5 right-2.5 h-0.5 bg-gold-500" />
      </span>
      <span className="hidden leading-tight sm:block">
        <span className="block font-serif text-[17px] font-bold tracking-[0.08em] text-brand-800">ACCREVIA</span>
        {showSubtitle &&
        <span className="hidden whitespace-nowrap text-[11px] text-ink-muted xl:block">Accreditation Evidence Retrieval System</span>
        }
      </span>
    </Link>);

}