# ACCREVIA Frontend → Backend Integration Handoff

**Scope:** Faculty/Staff Accreditation Resource Center + QA Technical Review Access Management (Chunks 1–9.2)  
**Date:** 2026-11-14  
**Frontend posture:** React + TypeScript + Vite. Repository browse/search uses **verified static catalogs** (Chunk 9.1–9.2). Access requests remain localStorage demos. No production Google Drive/Sheets sync or server auth is required for the current UI.

---

## 1. Relevant routes

| Route | Audience | Purpose |
|---|---|---|
| `/login`, `/register` | All | Frontend auth demo (session in localStorage) |
| `/` | All | Landing or post-login redirect |
| `/open` | Faculty/Staff (+ QA may visit) | Faculty & Staff Resource Center home |
| `/open/browse?tab=certificates\|technical-reviews\|copc` | Faculty/Staff | Accreditation Repository |
| `/open/browse?path=…` | Faculty/Staff | Certificate folder path (serialized IDs) |
| `/open/requests` | Faculty/Staff | My Access Requests (demo TR workflow) |
| `/open/search`, `/open/areas`, `/open/programs`, `/open/featured`, `/open/recent`, `/open/about`, `/open/help` | Faculty/Staff | Discovery / information pages |
| `/dashboard` | QA / privileged | QA dashboard |
| `/technical-review-access` | QA / privileged | TR Access Management (approve/deny/revoke) |

Query params to preserve when wiring APIs:

- `tab` — repository section
- `path` — certificate folder trail
- Search pages may use `q` and filter params

---

## 2. Mock / static service interfaces (swap targets)

### Repository (`src/services/repository/repositoryService.ts`)

Chunk 9.1 binds `activeRepositoryProvider` to `staticRepositoryProvider` (verified static catalogs). Swap that binding for an API client implementing `RepositoryDataProvider`.

| Function | Returns (shape) | Notes |
|---|---|---|
| `getRepositoryStatus()` | `RepositoryStatusSnapshot` | Mode `verified-static` after Chunk 9.1 |
| `browseCertificates(pathIds)` | `CertificateBrowseResult` | Verified Drive inventory tree |
| `searchCertificates(params)` | `{ documents: RepoDocumentItem[] }` | Local filters today |
| `listCopcRecords(params?)` | `{ worksheet, records, sourceReferenceUrl }` | Verified 2026 sheet rows |
| `listDemoProgramOptions()` | `{ value, label }[]` | Filter options helper |
| `listCampuses()` | `RepoFolderNode[]` | Campus roots |

Provenance docs: `docs/REPOSITORY_CATALOG_PROVENANCE.md`

Local helpers (keep reusable on the client even after API swap):

- `src/services/repository/copcQuery.ts` — filter / sort / paginate / summarize COPC rows
- `src/services/repository/documentAccess.ts` — link classification (file / folder / local / unavailable), preview probing, CTA labels
- `src/data/repositoryCatalog/` — verified static catalogs + generator script

### How verified static records load today (Chunk 9.2)

1. Generated catalogs under `src/data/repositoryCatalog/*.generated.ts` ship in the SPA bundle.
2. `staticRepositoryProvider` exposes browse/search/list over those trees/rows only (demonstration fixtures excluded from default search).
3. `repositoryService.activeRepositoryProvider` is the single swap point for a future API client.

### Document-link types vs local preview (Chunk 9.3)

| Link type | Detection | Frontend CTA |
|---|---|---|
| Verified individual Drive **file** URL | `driveFileUrl` or `externalUrl` matching `/file/d/` (never guessed) | **Open Document in Google Drive** |
| Verified Drive **folder** URL | `/drive/folders/` | **Open Source Folder** (not presented as the document) |
| Local asset candidate | `localPreviewUrl` | Probed; preview only if file exists |
| None | — | **Document link unavailable** |

| Preview rule | Behavior |
|---|---|
| Local probe succeeds (PDF/image) | In-app preview |
| Local path missing / 404 | Metadata-only state; no fake PDFs or placeholder certificates |
| Folder URL only | Do not claim the folder is the individual document |

Static catalog limitation today: AACCUP verified rows generally include the public certificates **folder** URL plus local path candidates. Chunk 9.4 adds `verifiedIndividualCertificateLinks.ts` for publication-gated individual file URLs; the mapping is currently **empty** pending institutional publication approval (no fabricated file IDs).

### Required backend document-viewing integration

1. Resolve and return **authorized** individual file URLs (`driveFileUrl`) or short-lived signed links after server checks — never ask the SPA to invent file IDs.
2. Keep folder URLs labeled as source folders when file-level access is not granted.
3. Indicate `previewAvailable` / MIME from server-verified assets; do not rely on client HEAD probes for production.
4. Enforce authorization on every document open/preview/download; client “Approved” TR demos must not unlock restricted content.
5. Log access for audit; expire time-bound links server-side.
6. When supplying frontend-publishable links, provide catalog record ID + exact `/file/d/…` URL + publication approval — populate `verifiedIndividualCertificateLinks.ts` (or replace via API). Do not match by filename similarity alone.

### Technical Review access (`src/services/accessRequests/accessRequestService.ts`)

Implements `TechnicalReviewAccessRequestService`:

- `listRequests(requesterId?)`
- `getRequest(id)`
- `createRequest(input)`
- `cancelRequest(id, requesterId?)` — Pending → **Canceled** (requester-owned)
- `approveRequest(id, { expiresAt, remarks?, reviewerName? })` — Pending → Approved
- `denyRequest(id, { reason, reviewerName? })` — Pending → Denied
- `revokeRequest(id, { reason, reviewerName? })` — Approved → Revoked
- `getStatusCounts()`

Expiration: Approved requests with past `expiresAt` become Expired via `expiration.ts` on load. Invalid transitions must return/reject errors (UI surfaces messages). Faculty `listRequests(requesterId)` returns only that requester’s rows; QA lists the full demo store.

Shared store key: browser `localStorage` (see `mockAccessRequestStore.ts`). Faculty and QA UIs subscribe to the same store in the prototype.

---

## 3. Data models (primary)

Defined in:

- `src/types/accreditationRepository.ts`
- `src/types/technicalReviewAccess.ts`

Key repository types: `RepoFolderNode`, `RepoDocumentItem`, `CopcRecordRow`, `RepositoryFilters`, `RepositoryStatusSnapshot`, `CertificateBrowseResult`.

Key access types: `TechnicalReviewAccessRequest`, history entries, create/approve/deny/revoke inputs, status counts.

Demo flags that must remain honest until live data exists:

- Documents: `isDemo`
- COPC rows: `isSample`
- Access requests: `isDemo: true`

---

## 4. Expected backend API responsibilities

1. **Authenticate** Faculty/Staff and QA with server-side sessions/tokens (replace client-only role gates).
2. **Authorize** certificate browsing, COPC reads, and Technical Review document access separately.
3. **Sync / catalog** AACCUP certificates from Google Drive (authorized server credentials only).
4. **Sync / catalog** COPC rows from Google Sheets (authorized server credentials only).
5. **Never** return restricted Technical Review filenames, file IDs, or Drive URLs to unauthorized clients.
6. Persist access requests, review history, expiration, and audit trails in a real database.
7. Emit consistent loading/error payloads the UI can map to existing empty/error states.

---

## 5. Authentication and authorization boundaries

| Concern | Frontend today | Backend must own |
|---|---|---|
| Login session | localStorage / client helpers | Secure cookies or tokens |
| Role checks (`isPrivilegedAuthRole`) | UI routing only — **not secure** | Server authorization on every API |
| Demo “Approved” TR access | Status badge only | Does **not** unlock Drive; backend grants signed, time-bound access if policy allows |
| Restricted TR Drive sources | Not shipped in Faculty UI | Stored server-side; never embedded in SPA assets |

UI copy already states that client-side role checks and localStorage are demonstration-only.

---

## 6. Google Drive / Sheets integration responsibilities (backend)

| Source | Frontend treatment | Backend responsibility |
|---|---|---|
| Verified certificates folder URL | **Open Source Folder** when no file URL | Live catalog with per-file authorization |
| Individual Drive file URL | **Open Document in Google Drive** only when verified | Issue authorized file URLs / signed links |
| Local preview candidates | Probe then embed if present | Prefer server-hosted preview or CDN with auth |
| COPC spreadsheet URL | Source reference only — static export in SPA | Fetch/map worksheet rows; no invented compliance statuses |
| Restricted Technical Reviews | Intentionally omitted from frontend | Store folder/file IDs server-side; authorize per approved request |

Do not put Google service-account keys, OAuth client secrets, or restricted folder IDs in the frontend bundle.

---

## 7. Suggested request / response fields

### Certificates browse

**Request:** `GET /api/repository/certificates?path=id1/id2` (or path array)  
**Response:** trail, current folders, documents with: `id`, `name`, `mimeType`, `updatedAt`, `documentType`, `campus`, `college`, `program`, `academicYear`, `previewAvailable` (boolean), never raw restricted URLs for unauthorized users.

### Certificates search

**Request:** `q`, `campus`, `academicYear`, `program`, `documentType`  
**Response:** document list (same safe fields).

### COPC list

**Request:** `q`, `campus`, `academicYear`, `college`, `program`, `page`, `pageSize`, `sort`, `direction`  
**Response:** `{ worksheet?, records[], total, sourceLabel? }`  
Record fields only when present: campus, college, program, academicYear, certificateNumber (if real), metadata explicitly verified — **do not invent** compliance status or expiration.

### Access requests

Align with `TechnicalReviewAccessRequest` / service methods above. Always include `reviewHistory[]` for QA and Faculty status views.

---

## 8. Error and loading states (UI already expects)

| State | UI behavior |
|---|---|
| Loading | Spinners / “Loading…” panels |
| Empty | `EmptyState` + clear-filters actions |
| Error | Message + Retry where provided |
| Preview unavailable | Explicit unavailable messaging (no fake file content) |
| Invalid TR transition | Service throws; modal/toast shows failure |

Prefer stable HTTP codes: `401` unauthenticated, `403` unauthorized, `404` missing, `409` invalid status transition, `422` validation.

---

## 9. Recommended integration order

1. Production authentication + role claims  
2. Access-request CRUD + QA approve/deny/revoke/expire (shared with Faculty history)  
3. Certificate catalog browse/search (Drive) with DEMO badges removed only when live  
4. COPC list/filter/sort/paginate (Sheets)  
5. Authorized Technical Review document delivery (never expose listing to Faculty without grant)  
6. Remove mock latency/localStorage stores and sample-only reference links

---

## 10. Frontend files to keep contracts with

- `src/services/repository/repositoryService.ts`
- `src/services/accessRequests/accessRequestService.ts`
- `src/types/accreditationRepository.ts`
- `src/types/technicalReviewAccess.ts`
- `src/pages/open/OpenBrowse.tsx`
- `src/pages/open/OpenAccessRequests.tsx`
- `src/pages/qa/TechnicalReviewAccessManagement.tsx`

Swap service implementations; avoid rewriting the Faculty/QA page structure unless API shapes force it.
