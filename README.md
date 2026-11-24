# ACCREVIA

NEMSU accreditation evidence portal.

| Area | Path |
|------|------|
| React SPA | [`frontend/`](frontend/) |
| Django MVC document intelligence API | [`backend/`](backend/) |

## Quick start

**Frontend**

```powershell
cd frontend
npm install
npm run dev
```

**Backend** (OCR → chunk → BM25 + BGE-M3 → Qdrant hybrid search)

See [`backend/README.md`](backend/README.md) for MySQL, Docker (Qdrant, Redis), Tesseract, Celery, and API examples.

On Windows, run the API and Celery in **two terminals**; use `celery -A config worker -l info --pool=solo` (prefork crashes with WinError 5).

Set in `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Sign-in requires the Django backend and MySQL. Browser storage caches portal metadata and original files; it does not authenticate users. Login creates an eight-hour server session in an HTTP-only cookie, protected against CSRF. On startup and while signed in, the frontend validates the session with MySQL through the API. If the API is unavailable, the protected UI signs out instead of accepting cached credentials. Password changes are verified and hashed on the server and invalidate other browser sessions. Logging out revokes the server session; if the server is offline, revocation is retried when it becomes available.

## Browse portal data in MySQL

Start the Docker Compose services from `backend/`. After installing the frontend and backend dependencies, run these commands from `backend/` to add the tables and copy the catalog and files available on this checkout:

```powershell
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py import_portal_catalog
```

Open [phpMyAdmin](http://localhost:8080/index.php?route=/database/structure&db=accrevia) and select `accrevia`.

- `portal_records` lists accreditation records, document and folder metadata, settings, and other portal records. Use `collection_id` to filter the project catalog or a browser's copy.
- `portal_file_inventory` lists original files by source, name, size, and SHA-256. `portal_file_chunks` contains their binary contents.
- `portal_accounts`, `portal_live_board`, and `evidence_documents` contain the existing shared accounts, requests, and API-upload metadata.

The local development portal (`localhost:5173` or `127.0.0.1:5173` with the Django API on port `8000`) copies the signed-in browser's records and IndexedDB files to MySQL. Use **System Settings → Maintenance → Copy to MySQL** to verify a copy from that browser. Each browser and each site address has its own local storage. The portal continues to use it for its local workflows, and phpMyAdmin shows the copied data.

Git distributes the code, migrations, import command, and public certificate catalog files. Each developer runs the commands against their local MySQL instance. External Drive entries are stored as links.

### Public certificate catalog

The files under `frontend/public/certificates/` are served from `/certificates/` on the deployed frontend and can be opened by anyone with the file URL. This folder contains the AACCUP and COPC certificates, Board resolutions, ratings, and findings. Run `import_portal_catalog` to store these originals in MySQL as well.

### Portable copy of the complete portal

Git transfers application code. Use a portable portal bundle to transfer the local MySQL records and original files, including ISO documents, folders, accounts, settings, and browser snapshots. The bundle stores each original once and verifies its SHA-256 when exporting and importing. It does not contain `.env`, database credentials, or Python dependencies.

On the source computer, sign in and use **System Settings → Maintenance → Copy to MySQL** to finish copying the browser's current data. Then, from `backend/`, export it with the browser source whose layout should appear on other computers:

```powershell
.\.venv\Scripts\python.exe manage.py export_portal_bundle exports/accrevia.portal-bundle.zip --source browser-YOUR-BROWSER-ID
```

Find the browser ID in the browser's local storage key `accrevia-db-browser-id`; prefix its value with `browser-`. Export to a new filename for each snapshot. The bundle contains all saved browser snapshots and available originals, not only the selected browser. The selected source determines the initial portal layout.

Run `manage.py prepare_portal_previews` on the source Windows computer with Publisher and Word installed **before the final export**. It stores PDF previews for `.pub`, `.doc`, and `.docx` originals in MySQL while preserving the original file bytes and format. Use `--formats .docx` to prepare only modern Word fallbacks. These previews travel inside the bundle, so recipients do not need Office installed to view them. Word documents render directly in the browser and use the PDF preview if that fails. The preview is labeled as a PDF export; downloading the original still returns the original Publisher or Word file. Publisher export uses Microsoft's [ExportAsFixedFormat](https://learn.microsoft.com/en-us/office/vba/api/publisher.document.exportasfixedformat) API.

On another developer's computer, pull the application code, install dependencies, configure a **fresh MySQL database** in `backend/.env`, and copy the bundle to `backend/exports/`. From `backend/`, run:

```powershell
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py import_portal_bundle exports/accrevia.portal-bundle.zip
.\.venv\Scripts\python.exe scripts/install_ocr_tools.py
.\.venv\Scripts\python.exe manage.py index_portal_documents
.\.venv\Scripts\python.exe manage.py runserver 8000
```

Start the frontend with `VITE_API_BASE_URL=http://127.0.0.1:8000`. Open `http://localhost:5173` and sign in. The frontend restores the selected snapshot before loading the portal and retrieves missing ISO original files from MySQL. Existing browser edits are retained when adding records from the snapshot. Original files do not need to be installed separately under `public/` after this restore.

To view a teammate's files beside your existing portal, set `PORTAL_WORKSPACE_DATABASE` in `backend/.env` to the database where you imported their bundle and restart Django. The portal reads workspace records, originals, and prepared previews from that database. Regular writes use `MYSQL_DATABASE`.

Import refuses to overwrite existing portal data. Use a new database to keep existing work; `--replace` explicitly replaces portal records, original files, and accounts in the configured destination database. The bundle contains account password hashes and institutional documents, so distribute it through the team's document-sharing channel. Export files are excluded from Git; share the bundle alongside the code. Each developer's database is independent after restoring; later changes require a new export/import.
