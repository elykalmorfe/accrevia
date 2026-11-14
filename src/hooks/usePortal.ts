import { useContext } from 'react';
import { PortalContext } from '../contexts/portalContextInstance';

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalProvider');
  return ctx;
}
