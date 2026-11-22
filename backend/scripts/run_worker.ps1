# Start Celery worker with Windows-safe solo pool.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
if (Test-Path .\.venv\Scripts\Activate.ps1) {
  .\.venv\Scripts\Activate.ps1
}
celery -A config worker -l info --pool=solo
