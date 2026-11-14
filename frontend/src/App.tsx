import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { PortalProvider, usePortal } from './contexts/PortalContext';
import { SharingDialogsProvider } from './contexts/SharingDialogsContext';
import { AppShell } from './components/layout/AppShell';
import { RequireAuth } from './components/auth/RequireAuth';
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
import { AccessRequests } from './pages/AccessRequests';
import { TechnicalReviewAccessManagement } from './pages/qa/TechnicalReviewAccessManagement';
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
import { PublicPortalShell } from './components/open/PublicPortalShell';
import { OpenHome } from './pages/open/OpenHome';
import { OpenSearch } from './pages/open/OpenSearch';
import { OpenBrowse } from './pages/open/OpenBrowse';
import { OpenAreas } from './pages/open/OpenAreas';
import { OpenPrograms } from './pages/open/OpenPrograms';
import { OpenFeatured } from './pages/open/OpenFeatured';
import { OpenRecent } from './pages/open/OpenRecent';
import { OpenAbout } from './pages/open/OpenAbout';
import { OpenHelp } from './pages/open/OpenHelp';
import { OpenAccessRequests } from './pages/open/OpenAccessRequests';
import { FacultySettings } from './pages/open/FacultySettings';
import { FacultyAccreditationShell } from './pages/open/FacultyAccreditationShell';
import { FacultyStaffRouteGuard } from './components/auth/FacultyStaffRouteGuard';
import { defaultPostLoginPath, getSessionAccount } from './utils/auth';

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
  if (!isAuthenticated()) {
    return <LandingPage />;
  }
  const session = getSessionAccount();
  return <Navigate to={defaultPostLoginPath(session?.role)} replace />;
}

function ProtectedAppRoutes() {
  const { isAdmin } = usePortal();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route element={<FacultyStaffRouteGuard />}>
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
              <Route path="access-requests" element={<AccessRequests />} />
              {/* Kept for QA / privileged Faculty header workflow — not linked from System Admin nav. */}
              <Route path="technical-review-access" element={<TechnicalReviewAccessManagement />} />
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
              {/* Explicit management routes → Access Denied for Faculty/Staff */}
              <Route path="evidence/upload" element={<Navigate to="/open" replace />} />
              <Route path="reports" element={<Navigate to="/open" replace />} />
              <Route path="settings" element={<Navigate to="/open" replace />} />
              <Route path="access-requests" element={<Navigate to="/open" replace />} />
            </>
          )}
          <Route path="*" element={<Navigate to={isAdmin ? '/dashboard' : '/open'} replace />} />
        </Route>
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
              <Route path="/register" element={<SignupPage />} />
              <Route path="/signup" element={<Navigate to="/register" replace />} />
              <Route
                path="/open"
                element={
                  <RequireAuth>
                    <PublicPortalShell />
                  </RequireAuth>
                }
              >
                <Route index element={<OpenHome />} />
                <Route path="search" element={<OpenSearch />} />
                <Route path="browse" element={<OpenBrowse />} />
                <Route path="areas" element={<OpenAreas />} />
                <Route path="programs" element={<OpenPrograms />} />
                <Route path="featured" element={<OpenFeatured />} />
                <Route path="recent" element={<OpenRecent />} />
                <Route path="about" element={<OpenAbout />} />
                <Route path="help" element={<OpenHelp />} />
                <Route
                  path="requests"
                  element={<Requests basePath="/open/requests" forceUserScope />}
                />
                <Route
                  path="requests/:requestId"
                  element={<Requests basePath="/open/requests" forceUserScope />}
                />
                {/* Deep-link preserved for Technical Review access-request tracking */}
                <Route path="access-requests" element={<OpenAccessRequests />} />
                <Route path="frameworks" element={<Navigate to="/open/frameworks/ia" replace />} />
                <Route
                  path="frameworks/ia"
                  element={
                    <FacultyAccreditationShell>
                      <CampusIAView />
                    </FacultyAccreditationShell>
                  }
                />
                <Route
                  path="frameworks/pa"
                  element={
                    <FacultyAccreditationShell>
                      <ProgramAccreditationView />
                    </FacultyAccreditationShell>
                  }
                />
                <Route
                  path="frameworks/copc"
                  element={
                    <FacultyAccreditationShell>
                      <COPCView />
                    </FacultyAccreditationShell>
                  }
                />
                <Route
                  path="frameworks/pqa"
                  element={
                    <FacultyAccreditationShell>
                      <CampusPQAView />
                    </FacultyAccreditationShell>
                  }
                />
                <Route
                  path="frameworks/iso"
                  element={
                    <FacultyAccreditationShell>
                      <CampusISOView />
                    </FacultyAccreditationShell>
                  }
                />
                <Route path="account" element={<Account />} />
                <Route path="settings" element={<FacultySettings />} />
                <Route path="*" element={<Navigate to="/open" replace />} />
              </Route>
              <Route path="/*" element={<ProtectedAppRoutes />} />
            </Routes>
          </SharingDialogsProvider>
        </PortalProvider>
      </MotionConfig>
    </BrowserRouter>
  );
}