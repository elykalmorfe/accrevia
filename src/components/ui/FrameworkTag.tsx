import React from 'react';
import { useLookup } from '../../hooks/useLookup';

export function FrameworkTag({ frameworkId, full = false }: {frameworkId: string;full?: boolean;}) {
  const lookup = useLookup();
  const framework = lookup.framework(frameworkId);
  if (!framework) return null;
  return (
    <span
      title={framework.name}
      className="inline-flex items-center whitespace-nowrap rounded border border-brand-100 bg-brand-50 px-1.5 py-0.5 text-[11px] font-semibold text-brand-700">
      
      {full ? framework.name : framework.shortName}
    </span>);

}