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

Without that variable (or when the API is down), search/upload keep working with localStorage / IndexedDB fallbacks.

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

Git distributes the code, migrations, and import command. Each developer runs the commands against their local MySQL instance. External Drive entries are stored as links.

### Install original documents after pulling

Get `accrevia-certificates.tar.gz` from the person who maintains the accreditation documents. Extract it from the repository root so the files land under `frontend/public/certificates/`:

```powershell
tar -xzf "C:\path\to\accrevia-certificates.tar.gz" -C frontend/public
```

Open Program Accreditation and select **View** on a certificate to preview the original. The same bundle contains the available COPC certificates, Board resolutions, ratings, and findings. Running `import_portal_catalog` also makes these originals available from local MySQL.
