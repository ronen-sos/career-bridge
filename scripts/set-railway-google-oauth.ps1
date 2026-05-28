# Sets Google OAuth (and optional auth) variables on Railway from your local .env file.
#
# Prerequisites:
#   1. npm install -g @railway/cli   (or use npx @railway/cli)
#   2. railway login
#   3. railway link                  (select Career Bridge project + web service)
#
# Usage:
#   .\scripts\set-railway-google-oauth.ps1
#   .\scripts\set-railway-google-oauth.ps1 -IncludeAuthSecret

param(
  [switch]$IncludeAuthSecret
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent
$envFile = Join-Path $projectRoot ".env"

if (-not (Test-Path $envFile)) {
  Write-Error ".env file not found at $envFile"
}

function Get-EnvValue($name) {
  $line = Get-Content $envFile | Where-Object { $_ -match "^\s*$name\s*=" } | Select-Object -First 1
  if (-not $line) { return $null }
  $value = ($line -split "=", 2)[1].Trim()
  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  return $value
}

$googleId = Get-EnvValue "AUTH_GOOGLE_ID"
$googleSecret = Get-EnvValue "AUTH_GOOGLE_SECRET"
$authSecret = Get-EnvValue "AUTH_SECRET"

if (-not $googleId -or -not $googleSecret) {
  Write-Error "AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be set in .env"
}

Write-Host "Checking Railway login..."
& npx @railway/cli whoami 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Not logged in to Railway. Run: npx @railway/cli login"
}

Write-Host "Setting AUTH_GOOGLE_ID..."
& npx @railway/cli variable set "AUTH_GOOGLE_ID=$googleId"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Setting AUTH_GOOGLE_SECRET..."
& npx @railway/cli variable set "AUTH_GOOGLE_SECRET=$googleSecret" --stdin 2>$null
if ($LASTEXITCODE -ne 0) {
  # fallback without stdin flag quirks on Windows
  & npx @railway/cli variable set "AUTH_GOOGLE_SECRET=$googleSecret"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if ($IncludeAuthSecret) {
  if (-not $authSecret) {
    Write-Error "AUTH_SECRET not found in .env but -IncludeAuthSecret was passed"
  }
  Write-Host "Setting AUTH_SECRET..."
  & npx @railway/cli variable set "AUTH_SECRET=$authSecret"
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ""
Write-Host "Done. Google OAuth variables are set on Railway."
Write-Host "Remember to also set AUTH_URL to your Railway public URL if you have not already."
Write-Host "Then redeploy or wait for Railway to pick up the new variables."
