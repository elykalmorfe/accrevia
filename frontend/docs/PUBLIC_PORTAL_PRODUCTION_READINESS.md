# Accrevia Public Document Portal — Production Readiness Report

**Scope:** CHUNK 10 final integration review  
**Date:** 2026-11-14  
**Prototype architecture:** React/Vite frontend with `PortalContext`, `localStorage`, and IndexedDB (no separate public API)

---

## 1. Completed public portal features

| Area | Status |
|---|---|
| Public shell (`/open/*`), sidebar, header | Complete |
| Home discovery (hero, stats, featured, recent, browse links) | Complete |
| Search Documents with URL sync and filters | Complete |
| Browse Documents (categories, grid/list, filters) | Complete |
| Accreditation Areas directory + detail | Complete |
| Academic Programs directory + detail | Complete |
| Featured Documents (auto latest eligible) | Complete |
| Recently Published (`publicPublishedAt` sort) | Complete |
| About QA Office + Help & Guidelines | Complete |
| QA publish/unpublish controls (Chunk 2) | Complete |
| Shared public preview/download gating (Chunk 9) | Complete |

Eligibility rules remain:

1. `confidentiality === 'Public'`
2. Approved status
3. Not archived
4. `isPubliclyPublished === true`

---

## 2. Verified functional tests

| Check | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | Pass |
| Production build (`vite build`) | Pass |
| Public eligibility fixtures (`scripts/verify-public-access.mjs`) | Pass (13) |
| Publishing workflow fixtures (`scripts/verify-public-workflow.mjs`) | Pass (14) |
| Routes load: `/open`, `/search`, `/browse`, `/areas`, `/programs`, `/featured`, `/recent`, `/about`, `/help` | Pass (browser) |
| URL params: `?q=`, `?area=`, `?program=` | Pass (routing) |
| Sidebar Discover + Information links present | Pass |
| About explore links + Help FAQ accuracy | Pass |
| No fabricated contact details invented | Pass (neutral contact note) |

---

## 3. Tests that could not be fully completed in this environment

| Test | Why incomplete |
|---|---|
| Live QA login → publish → see card with real IndexedDB file | Browser session had **zero** published documents; avoided seeding the live repository |
| Real PDF/image preview rendering with a stored blob | No published file fixture left in the portal store |
| Cross-device / separate profile / true incognito visitor seeing QA publishes | Architecture cannot share browser storage across devices (see §4) |
| Automated unit/e2e suite | Project has no Vitest/Playwright test runner configured |

Controlled fixture scripts cover eligibility and publish/unpublish logic without mutating the live repository.

---

## 4. Data persistence behavior (actual prototype)

| Behavior | Actual result |
|---|---|
| Publishing changes persist after refresh | **Yes, in the same browser profile** — documents are saved to `localStorage` key `accrevia_documents` via `PortalContext` |
| Public listings update after publish/unpublish | **Yes, same browser** — public pages read the same `PortalProvider` document state |
| Works in a new tab of the same browser profile | **Yes** — same origin storage |
| Works in a separate browser profile / another device / true private profile with empty storage | **No shared backend** — another visitor does **not** see QA publishes unless that browser already has the same localStorage/IndexedDB data |
| Depends on QA session / login for `/open` routes | **No login required** for `/open/*`, but data still comes from the shared client `PortalProvider` |
| File blobs | Stored in IndexedDB (`accrevia-files`). Available only in the browser that stored them |

### Deployment blocker

**Cross-device / multi-user public availability is not possible with the current architecture.**  
A public visitor on another computer cannot retrieve documents published by QA on a different machine. This is a hard blocker for production deployment of a real public portal.

---

## 5. Security review

### A. Prototype UI restrictions (current)

- React hooks (`usePublicDocuments`, `usePublicDocumentAccess`) filter listings.
- `isPublicPortalEligible` / `downloadPublicStoredFile` gate preview and download UI paths.
- Public preview modal revalidates live eligibility and avoids internal summary fallbacks.

### B. Production-grade security (missing)

| Risk | Finding |
|---|---|
| Internal records in public browser state | **Yes** — `PortalProvider` wraps `/open` and loads the full document catalog into client memory |
| Private metadata exposure | Possible if client code inspects context/state (uploader, shares, revision notes, etc.) |
| IndexedDB blob access without server auth | **Yes** — any script that knows a document id can attempt `getStoredFile(id)` in that browser |
| Eligibility only in client code | **Yes** — no server authorization |
| Bypass of UI helpers | **Yes** — UI gates can be bypassed by direct storage/API access in DevTools |

**Do not claim production security.** Client filtering is a prototype convenience only.

---

## 6. Backend requirements before production

1. **Shared database / API** for published documents (authoritative source of truth).
2. **Server-side filtering** for public list/search endpoints (only eligible published records).
3. **Server-side authorization** for preview and download.
4. **Protected file storage** outside browser IndexedDB.
5. **Public-safe metadata responses** (no uploader identity, shares, internal notes, approval history).
6. **Expiring / signed URLs** or equivalent access-controlled file delivery.
7. **QA authentication + publish permissions** enforced on the server.
8. **Cross-device availability** so any visitor sees the same published set.

---

## 7. Recommended next implementation phase

1. Introduce a minimal public documents API (`GET /public/documents`, `GET /public/documents/:id`, `GET /public/files/:id`).
2. Persist publish flags and blobs on the server; keep internal QA APIs separate.
3. Point `/open` pages at the public API instead of `PortalContext` document state.
4. Keep internal dashboard on authenticated APIs; do not ship the full evidence catalog to anonymous clients.
5. Add automated e2e coverage for publish → public visibility → unpublish → denial.

---

## 8. Accessibility / responsive notes

- Public modals use existing Escape close + `aria-label="Close dialog"`.
- Mobile public sidebar drawer remains available via header menu.
- Document cards truncate long titles; About/Help use responsive grids.
- Empty/error states exist across public listing pages.
- No major a11y redesign performed; small issues should be tracked in a dedicated a11y pass after backend migration.

---

## 9. Summary verdict

The Public Document Portal UI and client-side publishing model are **feature-complete as a prototype**.

They are **not production-ready** until a shared backend, server-side authorization, protected file delivery, and public-safe metadata APIs are implemented.
