# ACCREVIA Frontend Development Accomplishment Report
## Faculty/Staff and System Administrator Portals

---

## 1. INTRODUCTION

ACCREVIA is a web-based accreditation document portal for North Eastern Mindanao State University (NEMSU). It helps the Quality Assurance Office, administrators, and Faculty/Staff find and work with accreditation records.

Recent frontend work focused on making the Faculty/Staff Portal and System Administrator Portal clearer, more consistent, and easier to use. Navigation was simplified, search and accreditation layouts were aligned, and Faculty/Staff access was limited to viewing authorized materials while administrators keep full management tools.

---

## 2. FACULTY/STAFF PORTAL

### A. Changes Made

The following improvements are present in the current Faculty/Staff Portal (`/open`):

- **Sidebar cleanup.** Older top-level items such as Document Search, Accreditation Repository, Accreditation Areas, and Academic Programs were removed from the sidebar. Related pages may still exist as deep links when needed.
- **Dashboard search.** The main dashboard uses the same featured search style as the System Administrator dashboard, with filters and suggestions oriented to Faculty/Staff use.
- **Accreditation section.** An expandable Accreditation menu was added with the same subsection names as the administrator portal.
- **Document visibility.** Search and browse focus on publicly published documents, materials shared with the user, and clearly labeled demonstration samples. Verified catalog rows are not treated as automatically public.
- **Requests page.** Faculty/Staff Requests reuse the same layout pattern as administrator Requests, but only show the signed-in user’s own requests.
- **My Profile and Settings.** Both were added to the Faculty/Staff sidebar.
- **Read-only institutional access.** Faculty/Staff cannot create, edit, upload, delete, or generate reports for institutional accreditation data. Submitting and tracking their own access requests remains allowed.

### B. Sidebar Sections and Their Purposes

Current Faculty/Staff sidebar order (from `openNavigation`):

#### Main Menu

**DASHBOARD**  
Purpose: Home page for Faculty/Staff. It provides search, quick links, and recently published public documents.

**ACCREDITATION**  
Purpose: Lets Faculty/Staff browse accreditation status views in a layout that matches the administrator portal, in read-only mode.

Subsections:
- **Institutional (IA)** — View campus institutional accreditation status and related authorized materials.
- **Program (AACCUP)** — Browse program accreditation records under AACCUP.
- **CHED COPC** — View Certificate of Program Compliance information.
- **PQA Standards** — View Philippine Quality Award–related campus standards views.
- **ISO 9001** — View ISO 9001 campus quality-management views.

**REQUESTS**  
Purpose: Submit document requests to the QA Office and track the status of your own requests.

#### Information

**ABOUT & HELP**  
Purpose: Provides basic information and guidance for using the Faculty/Staff portal.

Subsections:
- **About QA Office** — Short information about the Quality Assurance Office and the portal’s role.
- **Help & Guidelines** — Simple guidance for searching, viewing, and requesting documents.

#### Account

**MY PROFILE**  
Purpose: Shows the signed-in Faculty/Staff user’s account details in view-only form.

**SETTINGS**  
Purpose: Personal portal preferences only (such as campus defaults, sidebar, dates, density, and search display). It does not include administrator system setup.

#### Footer actions (not main menu items)

- **Logout** — Signs the user out of the portal.
- **TR Access Management / QA Dashboard** — Shown only for privileged QA/admin accounts when they open the Faculty portal; regular Faculty/Staff users do not see these.

### C. Faculty/Staff User Restrictions

**Allowed**
- Search and browse authorized or public documents and labeled sample documents.
- View and preview authorized document details.
- Download when the system already marks download as permitted.
- Submit and track their own document access requests.
- View their profile and adjust personal preference settings.

**Not allowed**
- Create, edit, update, upload, or delete institutional documents.
- Generate or export institutional reports.
- Manage document permissions for others.
- Approve or deny other users’ requests.
- Open administrator management pages (upload, reports, system settings, and similar routes).

The Faculty/Staff Portal is designed mainly for **searching, browsing, and viewing** authorized materials. Requesting access is allowed because it asks the QA Office for permission; it does not let Faculty/Staff change institutional records themselves.

---

## 3. SYSTEM ADMINISTRATOR PORTAL

### A. Changes Made

Based on the current administrator sidebar and routes:

- The **System Administrator sidebar** is focused on Dashboard, Documents, Accreditation, Requests, Reports & Analytics, My Profile, and Settings.
- **TR Access Management** is **not** listed in the System Administrator sidebar. The page still exists for privileged QA workflows and can appear as a shortcut when a privileged user is inside the Faculty/Staff portal.
- **Faculty & Staff Portal** is **not** a System Administrator sidebar item. Faculty/Staff enter through `/open` after login.
- **User Management** is **not** present in the current System Administrator sidebar or active admin routes.
- The **Requests** section remains available for administrators to review and fulfill faculty/staff document requests.
- There is **no separate “Document Permissions” sidebar item** in the current navigation. Document sharing and access controls remain part of administrator document workflows in the application, not a standalone sidebar section.

### B. Sidebar Sections and Their Purposes

Current System Administrator sidebar order (from `navigation`):

**DASHBOARD**  
Purpose: Administrator home page with institutional overview and a prominent document search bar.

**DOCUMENTS**  
Purpose: Manage the accreditation evidence library used by the QA Office and administrators.

Subsections:
- **All Documents** — Browse and manage the full evidence document list.
- **Upload Documents** — Add new evidence files to the system.

**ACCREDITATION**  
Purpose: Manage and view accreditation frameworks and campus/program records.

Subsections:
- **Institutional (IA)** — Manage institutional accreditation status, areas, and related certificates.
- **Program (AACCUP)** — Manage academic program accreditation under AACCUP.
- **CHED COPC** — Manage Certificate of Program Compliance records.
- **PQA Standards** — Manage Philippine Quality Award–related campus records.
- **ISO 9001** — Manage ISO 9001 campus records and related audit views.

**REQUESTS**  
Purpose: Receive, review, and fulfill document requests from Faculty and Staff.

**REPORTS & ANALYTICS**  
Purpose: View institutional reports and analytics related to accreditation activity.

**MY PROFILE**  
Purpose: View and manage the administrator’s personal account details.

**SETTINGS**  
Purpose: Configure portal and institutional options (general settings, accreditation setup, workflows, uploads, security, and related controls).

---

## 4. DIFFERENCES BETWEEN THE TWO PORTALS

| Feature | Faculty/Staff | System Administrator |
| --- | --- | --- |
| **Dashboard** | Faculty home with search, quick links, and published documents | Admin overview with institutional search and management entry points |
| **Document search** | Same search style; results limited to public, shared, or demo sources | Full institutional search across evidence and verified catalog helpers |
| **Accreditation** | Same subsection names; read-only browsing | Same subsections with create/edit/upload/manage controls |
| **Requests** | Own requests only; can submit and track | All incoming requests; can reply and fulfill |
| **Document permissions** | Cannot manage permissions for others | Managed through administrator document/sharing workflows (not a separate sidebar item) |
| **Document management** | View/browse only | Full document library with upload and management |
| **Report generation** | Not available | Available under Reports & Analytics and related admin tools |
| **My Profile** | View-only profile information | Editable personal account details |
| **Settings** | Personal preferences only | Full institutional and system settings |

---

## 5. OVERALL PURPOSE OF THE CHANGES

These updates make ACCREVIA easier to navigate by giving Faculty/Staff and administrators clear, role-based sidebars. Shared Accreditation labels and similar search layouts keep the interface consistent, while document organization stays grouped by accreditation type. Responsibilities are separated so Faculty/Staff can find and request materials safely, and administrators keep control of uploads, permissions, reports, and configuration. This makes the prototype clearer to demonstrate and simpler for users to understand.

---

## 6. CURRENT LIMITATIONS

- The frontend still uses **static verified catalogs** and **demonstration data** for many repository features.
- **Backend integration** (live authorization, APIs, and storage) is handled by another team.
- Some **individual document previews and Drive file links** are still unavailable or waiting for approved mappings.
- Client-side role checks are for **UI demonstration only**. Production document permissions and write restrictions must be enforced by the backend.

---

## 7. NOTES FOR PRESENTATION

- This report reflects the **current frontend implementation**, not planned or unfinished work.
- Faculty/Staff portal path: `/open`
- System Administrator portal path: `/dashboard` and related AppShell routes
- Completed: Faculty/Staff navigation alignment, read-only institutional controls, restricted search visibility, Requests/My Profile/Settings, administrator sidebar focus on core management areas
- Pending / external: live backend authorization, full publication-approved individual file links, production security

---

*Report generated from inspection of the ACCREVIA frontend navigation, routes, capabilities, and portal pages.*
