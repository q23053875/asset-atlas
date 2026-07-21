# Creates a per-user Windows scheduled task. Run once from PowerShell.
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $projectRoot "scripts\on-windows-logon.ps1"
$taskCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

schtasks.exe /Create /TN "Asset Atlas - Update prices at logon" /TR $taskCommand /SC ONLOGON /RL LIMITED /F
Write-Host "Task created. Asset Atlas will update prices after every Windows sign-in."
