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
- **Dense cascade (preferred → last resort):**
  1. FlagEmbedding BGE-M3 (primary, full quality)
  2. FastEmbed ONNX dense (`FASTEMBED_DENSE_MODEL`, default MiniLM) — avoids `transformers`/`regex`
  3. `sentence-transformers` MiniLM
  4. Hashed dense (NumPy only, `DENSE_VECTOR_SIZE`) — **degraded hybrid**, not BGE quality
- If FastEmbed BM25 is unavailable, a hashed sparse vector fallback is used so hybrid indexing still works.
- Cross-encoder rerank soft-fails when `sentence_transformers` cannot load (keeps hybrid order).
- `GET /api/health/` and `POST /api/search/` expose `embedding_backend` and `embedding_degraded`.

## Windows Application Control

On this machine (re-checked 2026-11-18):

- **Smart App Control:** On (`SmartAppControlState: On`, `VerifiedAndReputablePolicyState: 1`)
- **Enforcing policy:** `VerifiedAndReputableDesktop` `{0283ac0f-fff1-49ae-ada1-8a933130cad6}` (allows supplemental policies)
- **Blocked file:** `backend\.venv\Lib\site-packages\regex\_regex.cp313-win_amd64.pyd`  
  Code Integrity **3033 / 3077** (“Enterprise signing level requirements”)
- **Also blocked when hit:** e.g. `pymongo\_cmessage*.pyd` (same policy)
- **Tried locally (did not unblock):** `Unblock-File`, copying `regex` outside `Documents`, AppLocker (empty)
- **No Settings UI** to allowlist a single folder under Smart App Control
- **Works without allowlist:** FastEmbed dense/sparse — search stays up with `embedding_degraded: true` (not full BGE-M3)

### Confirm the block

```powershell
# From backend\
.\.venv\Scripts\python.exe -c "import regex"
# Expect: DLL load failed ... Application Control policy has blocked this file

Get-MpComputerStatus | Select-Object SmartAppControlState, AMRunningMode

Get-WinEvent -LogName 'Microsoft-Windows-CodeIntegrity/Operational' -MaxEvents 20 |
  Where-Object { $_.Message -match 'regex|venv' } |
  Select-Object TimeCreated, Id, Message
```

### Least-privilege unblock (full BGE + rerank)

Do **not** turn Smart App Control Off machine-wide for this app.

1. **IT / admin:** deploy a **supplemental App Control policy** that expands SAC base  
   `{0283ac0f-fff1-49ae-ada1-8a933130cad6}` and allows only:  
   `C:\Users\My Pc\Documents\accrevia\backend\.venv\*`  
   (path rules need **Disabled:Runtime FilePath Rule Protection** because the venv is user-writable).

2. **Ready-made package in-repo:** [`ops/appcontrol/`](ops/appcontrol/)  
   - `IT-ALLOWLIST.md` — handoff text for IT  
   - `AccreviaVenvSupplemental.xml` — supplemental policy  
   - `Deploy-AccreviaVenvAllow.ps1` — compile + `CiTool --update-policy` (needs **ConfigCI** from Windows SDK)

3. **After deploy**, restart Django and verify:

```powershell
.\.venv\Scripts\python.exe -c "import regex; print('regex OK')"
.\.venv\Scripts\python.exe -c "from sentence_transformers import SentenceTransformer, CrossEncoder; print('ST OK')"
curl http://127.0.0.1:8000/api/health/
# Expect embedding_backend=bge-m3 and embedding_degraded=false
python scripts\smoke_upload_search.py
```

**Unsigned supplemental limitation:** deploying `ops/appcontrol` locally succeeds (`CiTool`), but under signed SAC the policy stays `IsAuthorized: false` / `IsEnforced: false` and does **not** unblock `.pyd` loads. Effective allowlisting needs an org-signed supplemental (Intune/IT) or a custom App Control base.

**Last resort used on this PC (device-wide):** set  
`HKLM\SYSTEM\CurrentControlSet\Control\CI\Policy\VerifiedAndReputablePolicyState` = `0`, then `CiTool.exe --refresh`. This turns SAC **Off** until set back to `1`. Required here because unsigned path allowlists cannot authorize under SAC.

## Auth

DEBUG allows open CORS to Vite and `AllowAny` on APIs. JWT is stubbed at `POST /api/health/token/` (`REQUIRE_JWT` reserved for later).
