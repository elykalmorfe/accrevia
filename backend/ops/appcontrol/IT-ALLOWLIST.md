# IT allowlist request — Accrevia backend venv (Smart App Control)

## Problem

Windows **Smart App Control** (`VerifiedAndReputableDesktop`, Policy ID `{0283ac0f-fff1-49ae-ada1-8a933130cad6}`) blocks unsigned native modules under the project Python virtualenv. That prevents full hybrid search (BGE-M3 dense embeddings + cross-encoder rerank).

**Blocked example (Code Integrity 3033 / 3077):**

`C:\Users\My Pc\Documents\accrevia\backend\.venv\Lib\site-packages\regex\_regex.cp313-win_amd64.pyd`

Also seen: other unsigned native extensions under `.venv` (e.g. torch / transformers `.pyd`/`.dll`) when those imports run.

**Machine state (2026-11-18):**

- `SmartAppControlState: On`
- `VerifiedAndReputablePolicyState: 1` (Enforce)
- SAC base policy has `Enabled:Allow Supplemental Policies`
- There is **no** Settings UI to allowlist a single folder under Smart App Control

## Requested least-privilege fix (preferred)

Deploy an **unsigned supplemental App Control policy** that expands SAC base `{0283ac0f-fff1-49ae-ada1-8a933130cad6}` and allows:

`C:\Users\My Pc\Documents\accrevia\backend\.venv\*`

Policy XML + deploy script are in this folder:

- `AccreviaVenvSupplemental.xml` (includes `Disabled:Runtime FilePath Rule Protection` because the path is user-writable)
- `Deploy-AccreviaVenvAllow.ps1` (admin; needs ConfigCI `ConvertFrom-CIPolicy` + `CiTool.exe`)

Or equivalently, hash/publisher allow rules for native binaries under that venv (stricter, but must be refreshed when packages update).

## What not to do (unless org accepts the risk)

- Do **not** turn Smart App Control Off machine-wide for this app alone.
- Documented global off (last resort only): set  
  `HKLM\SYSTEM\CurrentControlSet\Control\CI\Policy\VerifiedAndReputablePolicyState` = `0`, then `CiTool.exe --refresh` (may need reboot). This weakens device-wide protection.

## Verify after allowlist

```powershell
& 'C:\Users\My Pc\Documents\accrevia\backend\.venv\Scripts\python.exe' -c "import regex; print('regex OK')"
& 'C:\Users\My Pc\Documents\accrevia\backend\.venv\Scripts\python.exe' -c "from sentence_transformers import SentenceTransformer, CrossEncoder; print('ST OK')"
# Restart Django, then:
# GET http://127.0.0.1:8000/api/health/  → embedding_backend: bge-m3, embedding_degraded: false
# python scripts\smoke_upload_search.py → SMOKE OK
```

## Attempted local deploy result (2026-11-18)

`Deploy-AccreviaVenvAllow.ps1` compiled and `CiTool --update-policy` reported success, but the policy remained:

- `IsOnDisk: true`
- `IsEnforced: false`
- `IsAuthorized: false`

**Cause:** Smart App Control’s base policy is **signed**. Unsigned local supplements are accepted onto disk but **not authorized**, so they do not expand trust. Effective allowlisting under SAC requires an organization-signed supplemental (Intune / enterprise App Control) or replacing SAC with a custom App Control for Business base that trusts LOB code.

## Last resort used on this developer PC

Because an *effective* least-privilege allowlist could not be activated under SAC, Smart App Control was turned **Off** via:

`HKLM\SYSTEM\CurrentControlSet\Control\CI\Policy\VerifiedAndReputablePolicyState` = `0`  
then `CiTool.exe --refresh`

Risk: device-wide SAC protection is disabled until turned back On (value `1`). Re-enable when IT provides a signed supplemental or a managed App Control policy.

## Interim (no policy change)

The app already falls back to FastEmbed / hashed dense so search stays up with `embedding_degraded: true`. That is **not** full BGE-M3 quality.
