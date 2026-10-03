import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { PortalProvider } from './contexts/PortalContext';
import { SharingDialogsProvider } from './contexts/SharingDialogsContext';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { SearchResults } from './pages/SearchResults';
import { DocumentViewer } from './pages/DocumentViewer';
import { AllEvidence } from './pages/evidence/AllEvidence';
import { UploadEvidence } from './pages/evidence/UploadEvidence';
import { PendingClassification } from './pages/evidence/PendingClassification';
import { DocumentProcessing } from './pages/evidence/DocumentProcessing';
import { SharedEvidence } from './pages/evidence/SharedEvidence';
import { ArchivedEvidence } from './pages/evidence/ArchivedEvidence';
import { Frameworks } from './pages/frameworks/Frameworks';
import { FrameworkDetail } from './pages/frameworks/FrameworkDetail';
import { AccreditationAreas } from './pages/criteria/AccreditationAreas';
import { CriteriaExplorer } from './pages/criteria/CriteriaExplorer';
import { Indicators } from './pages/criteria/Indicators';
import { EvidenceRequirements } from './pages/criteria/EvidenceRequirements';
import { UserManagement } from './pages/UserManagement';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { SystemSettings } from './pages/SystemSettings';
import { Account } from './pages/Account';
import { UserHome } from './pages/user/UserHome';
import { SharedWithMe } from './pages/user/SharedWithMe';
import { SavedEvidence } from './pages/user/SavedEvidence';

interface AppProps {
  /** Which signed-in experience to preview. Non-administrators only see evidence explicitly shared with them. */
  viewAs?: 'Administrator' | 'Faculty' | 'Staff' | 'Accreditor';
}

export function App({ viewAs = 'Administrator' }: AppProps) {
  const isAdmin = viewAs === 'Administrator';

  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <PortalProvider viewAs={viewAs}>
          <SharingDialogsProvider>
            <Routes>
              <Route element={<AppShell />}>
                {isAdmin ?
                <>
                    <Route index element={<Dashboard />} />
                    <Route path="search" element={<SearchResults />} />
                    <Route path="documents/:id" element={<DocumentViewer />} />
                    <Route path="evidence" element={<AllEvidence />} />
                    <Route path="evidence/upload" element={<UploadEvidence />} />
                    <Route path="evidence/pending" element={<PendingClassification />} />
                    <Route path="evidence/processing" element={<DocumentProcessing />} />
                    <Route path="evidence/shared" element={<SharedEvidence />} />
                    <Route path="evidence/archived" element={<ArchivedEvidence />} />
                    <Route path="frameworks" element={<Frameworks />} />
                    <Route path="frameworks/:id" element={<FrameworkDetail />} />
                    <Route path="criteria" element={<Navigate to="/criteria/areas" replace />} />
                    <Route path="criteria/areas" element={<AccreditationAreas />} />
                    <Route path="criteria/criteria" element={<CriteriaExplorer />} />
                    <Route path="criteria/indicators" element={<Indicators />} />
                    <Route path="criteria/requirements" element={<EvidenceRequirements />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="reports" element={<ReportsAnalytics />} />
                    <Route path="settings" element={<SystemSettings />} />
                    <Route path="account" element={<Account />} />
                  </> :

                <>
                    <Route index element={<UserHome />} />
                    <Route path="shared-with-me" element={<SharedWithMe />} />
                    <Route path="saved" element={<SavedEvidence />} />
                    <Route path="search" element={<SearchResults />} />
                    <Route path="documents/:id" element={<DocumentViewer />} />
                    <Route path="account" element={<Account />} />
                  </>
                }
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </SharingDialogsProvider>
        </PortalProvider>
      </MotionConfig>
    </BrowserRouter>);

}