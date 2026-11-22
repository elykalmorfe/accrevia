# Start Django API on :8000 (activate venv first if needed).
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
if (Test-Path .\.venv\Scripts\Activate.ps1) {
  .\.venv\Scripts\Activate.ps1
}
python manage.py runserver 8000
