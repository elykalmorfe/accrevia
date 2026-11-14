# Repository Catalog Provenance (Chunk 9.1)

## Chunk 9.2–9.4 browsing / viewing notes

- Faculty Certificates / COPC tabs read **verified** catalogs through `staticRepositoryProvider`.
- Default search excludes demonstration fixtures.
- Document actions distinguish **Open Document in Google Drive** (individual file URL) vs **Open Source Folder** vs **Document link unavailable**.
- Local preview probes real assets only; otherwise metadata-only.
- Labels: **Verified source record** vs **Demonstration record**.
- Static snapshots are not live-synced and do not independently validate institutional compliance.
- No restricted Technical Review filenames, IDs, or URLs are embedded.
- Individual Drive file URLs are applied only from `verifiedIndividualCertificateLinks.ts` when **publication-approved** (catalog ID match — never filename guessing).

## Document link provenance (Chunk 9.4)

| Kind | Meaning | Faculty CTA |
|---|---|---|
| **Verified document metadata** | Filename, campus/program path, MIME from inventory/sheet | Details / browse |
| **Verified individual file URL** | Exact `/file/d/…` URL confirmed against a source — stored only in the mapping module | Applied to UI **only if** publication-approved |
| **Publication-approved file URL** | Mapping with `publicationApprovalStatus: 'approved'` | **Open Document in Google Drive** |
| **Folder-only reference** | Shared AACCUP certificates Drive folder URL on the record | **Open Source Folder** |
| **Metadata-only record** | No folder URL, no approved file URL, no local candidate | **Document link unavailable** |

**Chunk 9.4 status:** the individual-link mapping structure is in place with **zero** publication-approved entries. Existing `copcCertificateManifest` / program-accreditation Drive URLs are **not** auto-matched onto AACCUP catalog record IDs (different ID spaces; filename similarity is insufficient).

## Purpose

Prepare the Faculty/Staff Accreditation Repository to visualize **real institutional metadata** extracted from:

- AACCUP certificates Google Drive folder  
  https://drive.google.com/drive/folders/1ywYJOXOvErD9EqygvyqiQb5g-4PzEP_5
- COPC Google Sheet (worksheet gid `1651511406`)  
  https://docs.google.com/spreadsheets/d/1RjvN8ZUlqrnJ4tA6yyieHOSIPEF7DbLYniLjT1opvUI/edit?gid=1651511406#gid=1651511406

This is a **static frontend catalog**. It is not live Google Drive/Sheets synchronization.

---

## Provenance labels

| Label | Meaning |
|---|---|
| **VERIFIED SOURCE RECORD** | Metadata inspected from the Drive inventory and/or COPC sheet export |
| **DEMONSTRATION RECORD** | Invented UI fixture retained for layout testing only |

Technical Review filenames, file IDs, URLs, and contents are **not** embedded in frontend assets.

---

## What was imported

### AACCUP certificates (verified)

| Metric | Count |
|---|---|
| Campuses | 7 (Bislig, Cagwait, Cantilan, Lianga, San Miguel, Tagbina, Tandag) |
| Declared program folders | 77 |
| Verified document file metadata rows | 151 |
| Drive root files listed | 3 |
| Tandag college/school folders named | Graduate School, CTE, CBM, CAS, CET, CITE |

Sources used:

1. Public Drive root listing (campus folder names + root files)
2. `src/data/aaccupCertificateManifest.ts` — file inventory previously produced from the institutional AACCUP zip aligned to the same Drive tree
3. Chunk 9.1 brief — verified Tandag college names and Bislig program-folder examples

### COPC (verified)

| Metric | Count |
|---|---|
| Verified worksheet rows (2026) | 86 |
| Campuses represented | 7 |
| Rows with “on-going compliance…” notes | 2 |

Sheet labels/notes are preserved as written (including RRPA / ongoing compliance wording). They are **not** auto-interpreted as approved COPCs.

### Demonstration fixtures retained

| Fixture | Count | Location |
|---|---|---|
| Demo certificate tree documents | 8 | `services/repository/mockRepositoryData.ts` |
| Demo COPC rows | 12 | same file (`demonstrationCopcRecords`) |

Demo fixtures are **not** the default Faculty browse/list source after Chunk 9.1.

---

## Missing / incomplete source data

1. **Local certificate binaries** under `public/certificates/aaccup` are not present in this checkout. Catalog `localPreviewUrl` paths are import-ready references; in-app preview may show unavailable until files are restored.
2. **Deep Drive re-crawl** of every nested folder was not completed without Google API credentials / signed-in Drive UI. Additional files that exist only online and were never present in the zip inventory remain unlisted.
3. **Other COPC worksheet tabs** besides gid `1651511406` were not imported.
4. **Technical Reviews** remain backend-restricted and intentionally omitted.
5. Some Tandag program→college assignments use institutional naming conventions when the exact Drive parent folder was not re-confirmed online; unassigned programs are grouped under “Programs (college assignment pending verification).”
6. **Publication-approved individual Google Drive file URLs** for verified AACCUP catalog record IDs are **not available** in this checkout (Chunk 9.4 blocker). Records keep folder-only references until approved mappings are supplied.

---

## Frontend architecture

| Piece | Path |
|---|---|
| Verified certificate catalog | `src/data/repositoryCatalog/verifiedCertificateCatalog.generated.ts` |
| Verified COPC catalog | `src/data/repositoryCatalog/verifiedCopcCatalog.generated.ts` |
| Catalog helpers | `src/data/repositoryCatalog/index.ts` |
| Individual Drive file link mappings (Chunk 9.4) | `src/data/repositoryCatalog/verifiedIndividualCertificateLinks.ts` |
| Provider interface | `RepositoryDataProvider` in `src/types/accreditationRepository.ts` |
| Static provider | `src/services/repository/staticRepositoryProvider.ts` |
| UI service facade | `src/services/repository/repositoryService.ts` |
| Generator | `scripts/generate-verified-catalog.mjs` |

### Regenerating catalogs

```bash
# Optional: refresh COPC CSV
curl -L -o %TEMP%\copc-2026.csv "https://docs.google.com/spreadsheets/d/1RjvN8ZUlqrnJ4tA6yyieHOSIPEF7DbLYniLjT1opvUI/export?format=csv&gid=1651511406"

node scripts/generate-verified-catalog.mjs
```

---

## Backend handoff notes

1. Replace `activeRepositoryProvider` with an API client implementing `RepositoryDataProvider`.
2. Keep provenance fields (`provenance`, `dataSource`, `verificationNote`) so UI badges remain honest during migration.
3. Server-side Google credentials must never ship in the SPA.
4. Restricted Technical Review sources stay server-owned.
5. Publication approval may still be required before exposing additional Drive file URLs beyond the already-public certificates folder reference.

See also: `docs/BACKEND_INTEGRATION_HANDOFF.md`.
