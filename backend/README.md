# ACCREVIA Document Intelligence API (Django MVC)

Backend for accreditation document **upload → OCR → chunk → BM25 + BGE-M3 → Qdrant hybrid search → accreditation scoring → cross-encoder rerank**.

## Stack (Table 3)

| Component | Technology |
|-----------|------------|
| API | Django + Django REST Framework |
| Metadata DB | MongoDB (mongoengine) |
| Vectors | Qdrant (dense BGE-M3 + sparse BM25) |
| Rerank | Cross-Encoder `cross-encoder/ms-marco-MiniLM-L-6-v2` |
| OCR | Tesseract (+ pypdf for digital PDFs) |
| Jobs | Celery + Redis |

## MVC layout

- **Model:** `apps/documents/models.py`
- **View (HTTP):** `apps/*/views.py` + serializers
- **Service:** `apps/*/services*.py`, `apps/ingestion/services/*`

## Windows 10/11 setup

1. Install **Docker Desktop**, **Python 3.11+**, and **Tesseract OCR**  
   ([UB Mannheim installer](https://github.com/UB-Mannheim/tesseract/wiki)).  
   If needed, set `TESSERACT_CMD` in `.env` to `tesseract.exe`.

2. From `backend/`:

```powershell
copy .env.example .env
docker compose up -d
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
```

3. Run API + worker (two terminals):

```powershell
celery -A config worker -l info
python manage.py runserver 8000
```

For a single-process smoke test without Celery, set `CELERY_TASK_ALWAYS_EAGER=true` in `.env`.

4. Frontend: in `frontend/.env` set:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health/` | Mongo + Qdrant readiness |
| POST | `/api/documents/` | Multipart upload + metadata |
| GET | `/api/documents/{id}/` | Document metadata |
| GET | `/api/documents/{id}/status/` | Ingestion progress |
| POST | `/api/search/` | Hybrid search |
| GET | `/api/docs/` | Swagger UI |
| GET | `/api/schema/` | OpenAPI schema |

### Upload example

```powershell
curl -X POST http://127.0.0.1:8000/api/documents/ `
  -F "file=@.\sample.pdf" `
  -F "title=Area 1 Evidence" `
  -F "frameworkId=ia" `
  -F "campusId=tandag"
```

### Search example

```powershell
curl -X POST http://127.0.0.1:8000/api/search/ `
  -H "Content-Type: application/json" `
  -d "{\"q\":\"faculty development criterion 2\",\"frameworkId\":\"ia\",\"limit\":10}"
```

### Smoke script

```powershell
python scripts/smoke_upload_search.py
```

## CPU / GPU notes

- Default `EMBEDDING_DEVICE=cpu`. First run downloads BGE-M3 / cross-encoder weights (can take several minutes).
- If FlagEmbedding fails to load, dense embeddings fall back to `all-MiniLM-L6-v2`.
- If FastEmbed BM25 is unavailable, a hashed sparse vector fallback is used so hybrid indexing still works.

## Auth

DEBUG allows open CORS to Vite and `AllowAny` on APIs. JWT is stubbed at `POST /api/health/token/` (`REQUIRE_JWT` reserved for later).
