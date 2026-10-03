import { useMemo } from 'react';
import { usePortal } from '../contexts/PortalContext';
import { Lookup } from '../types/evidence';

export function useLookup(): Lookup {
  const { frameworks, areas, criteria, indicators } = usePortal();
  return useMemo(
    () => ({
      framework: (id: string) => frameworks.find((f) => f.id === id),
      area: (id: string) => areas.find((a) => a.id === id),
      criterion: (id: string) => criteria.find((c) => c.id === id),
      indicator: (id: string) => indicators.find((i) => i.id === id)
    }),
    [frameworks, areas, criteria, indicators]
  );
}