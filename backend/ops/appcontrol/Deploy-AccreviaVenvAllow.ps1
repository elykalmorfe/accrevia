#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Compile and deploy a supplemental App Control policy that allows
  C:\Users\My Pc\Documents\accrevia\backend\.venv\* under Smart App Control.

.NOTES
  - Does NOT turn Smart App Control Off.
  - Needs ConfigCI (ConvertFrom-CIPolicy) from Windows SDK.
  - Re-run after moving the venv path (update the XML FilePath first).
#>
$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$xml = Join-Path $here "AccreviaVenvSupplemental.xml"
$cip = Join-Path $here "{A1C3E5F7-1928-4B6D-9E0F-1234567890AB}.cip"

if (-not (Get-Command ConvertFrom-CIPolicy -ErrorAction SilentlyContinue)) {
    Import-Module ConfigCI -ErrorAction SilentlyContinue
}
if (-not (Get-Command ConvertFrom-CIPolicy -ErrorAction SilentlyContinue)) {
    Write-Error @"
ConfigCI module not found (ConvertFrom-CIPolicy missing).

Install Windows SDK (includes ConfigCI), open a new elevated PowerShell, then re-run:
  winget install Microsoft.WindowsSDK.10.0.26100
  Import-Module ConfigCI
  $PSCommandPath
"@
}

Write-Host "Compiling $xml -> $cip"
ConvertFrom-CIPolicy -XmlFilePath $xml -BinaryFilePath $cip

Write-Host "Deploying via CiTool --update-policy"
& CiTool.exe --update-policy $cip
if ($LASTEXITCODE -ne 0) {
    Write-Error "CiTool --update-policy failed with exit $LASTEXITCODE"
}

Write-Host "Refreshing policies"
& CiTool.exe --refresh

Write-Host @"

Deployed. Verify:
  & 'C:\Users\My Pc\Documents\accrevia\backend\.venv\Scripts\python.exe' -c "import regex; print('regex OK')"

If still blocked, SAC may ignore unsigned path supplements on this build — escalate to IT
or use Docker/WSL for the API (SAC does not apply inside Linux containers).
"@
