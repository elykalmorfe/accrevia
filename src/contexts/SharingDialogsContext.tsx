import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { ShareModal } from '../components/sharing/ShareModal';
import { ManageAccessModal } from '../components/sharing/ManageAccessModal';

interface SharingDialogsValue {
  openShare: (documentId: string) => void;
  openManageAccess: (documentId: string) => void;
}

const SharingDialogsContext = createContext<SharingDialogsValue | null>(null);

export function SharingDialogsProvider({ children }: {children: ReactNode;}) {
  const [shareId, setShareId] = useState<string | null>(null);
  const [manageId, setManageId] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      openShare: (id: string) => {setManageId(null);setShareId(id);},
      openManageAccess: (id: string) => {setShareId(null);setManageId(id);}
    }),
    []
  );

  return (
    <SharingDialogsContext.Provider value={value}>
      {children}
      <ShareModal docId={shareId} onClose={() => setShareId(null)} />
      <ManageAccessModal
        docId={manageId}
        onClose={() => setManageId(null)}
        onShareMore={(id) => {setManageId(null);setShareId(id);}} />
      
    </SharingDialogsContext.Provider>);

}

export function useSharingDialogs(): SharingDialogsValue {
  const ctx = useContext(SharingDialogsContext);
  if (!ctx) throw new Error('useSharingDialogs must be used inside SharingDialogsProvider');
  return ctx;
}