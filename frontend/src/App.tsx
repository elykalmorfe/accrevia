import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { PortalProvider, usePortal } from './contexts/PortalContext';
import { SharingDialogsProvider } from './contexts/SharingDialogsContext';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { SearchResults } from './pages/SearchResults';
import { DocumentViewer } from './pages/DocumentViewer';
import { AllEvidence } from './pages/evidence/AllEvidence';
import { CommonDocumentsView } from './pages/evidence/CommonDocumentsView';
import { UploadEvidence } from './pages/evidence/UploadEvidence';
import { PendingClassification } from './pages/evidence/PendingClassification';
import { DocumentProcessing } from './pages/evidence/DocumentProcessing';
import { SharedEvidence } from './pages/evidence/SharedEvidence';
import { ArchivedEvidence } from './pages/evidence/ArchivedEvidence';
import { Frameworks } from './pages/frameworks/Frameworks';
import { FrameworkDetail } from './pages/frameworks/FrameworkDetail';
import { AccreditationDashboard } from './pages/accreditation/AccreditationDashboard';
import { CampusIAView } from './pages/accreditation/CampusIAView';
import { ProgramAccreditationView } from './pages/accreditation/ProgramAccreditationView';
import { COPCView } from './pages/accreditation/COPCView';
import { CampusPQAView } from './pages/accreditation/CampusPQAView';
import { CampusISOView } from './pages/accreditation/CampusISOView';
import { AccreditationAreas } from './pages/criteria/AccreditationAreas';
import { CriteriaExplorer } from './pages/criteria/CriteriaExplorer';
import { Indicators } from './pages/criteria/Indicators';
import { EvidenceRequirements } from './pages/criteria/EvidenceRequirements';
import { UserManagement } from './pages/UserManagement';
import { AccessRequests } from './pages/AccessRequests';
import { RequestLogs } from './pages/RequestLogs';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { SystemSettings } from './pages/SystemSettings';
import { Account } from './pages/Account';
import { UserHome } from './pages/user/UserHome';
import { SharedWithMe } from './pages/user/SharedWithMe';
import { SavedEvidence } from './pages/user/SavedEvidence';
import { Requests } from './pages/Requests';
import { PortalViewRole } from './types/user';
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { SignupPage } from './pages/public/SignupPage';

interface AppProps {
  /** Which signed-in experience to preview. Non-administrators only see evidence explicitly shared with them. */
  viewAs?: PortalViewRole;
}

function isAuthenticated() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem('accrevia-auth') === 'true';
}

function HomeRoute() {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

function ProtectedAppRoutes() {
  const { isAdmin } = usePortal();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        {isAdmin ? (
          <>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="search" element={<SearchResults />} />
            <Route path="documents/:id" element={<DocumentViewer />} />
            <Route path="evidence" element={<AllEvidence />} />
            <Route path="evidence/common" element={<CommonDocumentsView />} />
            <Route path="evidence/upload" element={<UploadEvidence />} />
            <Route path="evidence/pending" element={<PendingClassification />} />
            <Route path="evidence/processing" element={<DocumentProcessing />} />
            <Route path="evidence/shared" element={<SharedEvidence />} />
            <Route path="evidence/archived" element={<ArchivedEvidence />} />
            <Route path="requests" element={<Requests />} />
            <Route path="requests/:requestId" element={<Requests />} />
            <Route path="frameworks" element={<AccreditationDashboard />} />
            <Route path="frameworks/ia" element={<CampusIAView />} />
            <Route path="frameworks/pa" element={<ProgramAccreditationView />} />
            <Route path="frameworks/copc" element={<COPCView />} />
            <Route path="frameworks/pqa" element={<CampusPQAView />} />
            <Route path="frameworks/iso" element={<CampusISOView />} />
            <Route path="frameworks/catalog" element={<Frameworks />} />
            <Route path="frameworks/:id" element={<FrameworkDetail />} />
            <Route path="criteria" element={<Navigate to="/criteria/areas" replace />} />
            <Route path="criteria/areas" element={<AccreditationAreas />} />
            <Route path="criteria/criteria" element={<CriteriaExplorer />} />
            <Route path="criteria/indicators" element={<Indicators />} />
            <Route path="criteria/requirements" element={<EvidenceRequirements />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="access-requests" element={<AccessRequests />} />
            <Route path="request-logs" element={<RequestLogs />} />
            <Route path="reports" element={<ReportsAnalytics />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="account" element={<Account />} />
          </>
        ) : (
          <>
            <Route path="dashboard" element={<UserHome />} />
            <Route path="shared-with-me" element={<SharedWithMe />} />
            <Route path="saved" element={<SavedEvidence />} />
            <Route path="requests" element={<Requests />} />
            <Route path="requests/:requestId" element={<Requests />} />
            <Route path="evidence/common" element={<CommonDocumentsView />} />
            <Route path="search" element={<SearchResults />} />
            <Route path="documents/:id" element={<DocumentViewer />} />
            <Route path="frameworks" element={<AccreditationDashboard />} />
            <Route path="frameworks/ia" element={<CampusIAView />} />
            <Route path="frameworks/pa" element={<ProgramAccreditationView />} />
            <Route path="frameworks/copc" element={<COPCView />} />
            <Route path="frameworks/pqa" element={<CampusPQAView />} />
            <Route path="frameworks/iso" element={<CampusISOView />} />
            <Route path="frameworks/catalog" element={<Frameworks />} />
            <Route path="frameworks/:id" element={<FrameworkDetail />} />
            <Route path="account" element={<Account />} />
          </>
        )}
        <Route path="*" element={<Navigate to={isAdmin ? '/dashboard' : '/dashboard'} replace />} />
      </Route>
    </Routes>
  );
}

export function App({ viewAs = 'Administrator' }: AppProps) {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <PortalProvider viewAs={viewAs}>
          <SharingDialogsProvider>
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/*" element={<ProtectedAppRoutes />} />
            </Routes>
          </SharingDialogsProvider>
        </PortalProvider>
      </MotionConfig>
    </BrowserRouter>
  );
}