import { createContext, useContext, type ReactNode } from 'react';
import {
  FACULTY_STAFF_CAPABILITIES,
  type FacultyStaffCapabilities
} from '../config/facultyStaffCapabilities';

export type FacultyPortalContextValue = {
  /** True for the entire `/open` Faculty/Staff portal shell. */
  isFacultyPortal: true;
  capabilities: FacultyStaffCapabilities;
  /** Institutional / accreditation data is view-only in this portal. */
  institutionalReadOnly: true;
};

const FacultyPortalContext = createContext<FacultyPortalContextValue | null>(null);

export function FacultyPortalProvider({ children }: { children: ReactNode }) {
  return (
    <FacultyPortalContext.Provider
      value={{
        isFacultyPortal: true,
        capabilities: FACULTY_STAFF_CAPABILITIES,
        institutionalReadOnly: true
      }}
    >
      {children}
    </FacultyPortalContext.Provider>
  );
}

export function useFacultyPortal(): FacultyPortalContextValue | null {
  return useContext(FacultyPortalContext);
}

export function useIsFacultyPortal(): boolean {
  return useFacultyPortal()?.isFacultyPortal === true;
}
