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

See [`backend/README.md`](backend/README.md) for Docker (MongoDB, Qdrant, Redis), Tesseract, Celery, and API examples.

Set in `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Without that variable (or when the API is down), search/upload keep working with localStorage / IndexedDB fallbacks.
