# Runs after Windows sign-in. Docker Desktop must be configured to start with Windows.
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# Docker Desktop commonly needs a short period to start after sign-in.
$dockerReady = $false
for ($attempt = 1; $attempt -le 24; $attempt++) {
  docker version --format '{{.Server.Version}}' 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $dockerReady = $true; break }
  Start-Sleep -Seconds 5
}
if (-not $dockerReady) { throw "Docker Desktop was not ready after two minutes." }

docker compose up -d db
corepack pnpm run snapshot
