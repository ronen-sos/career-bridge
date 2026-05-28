# Run PowerShell as Administrator, then:
#   Set-ExecutionPolicy Bypass -Scope Process -Force
#   & "c:\apps\Career Bridge\scripts\fix-local-postgres.ps1"

$pgData = "C:\Program Files\PostgreSQL\18\data"
$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$serviceName = "postgresql-x64-18"
$backupFile = Join-Path $pgData "pg_hba.conf.backup"

if (-not (Test-Path $backupFile)) {
  Copy-Item (Join-Path $pgData "pg_hba.conf") $backupFile -Force
}

$pgHba = Get-Content (Join-Path $pgData "pg_hba.conf") -Raw
$pgHba = $pgHba -replace "scram-sha-256", "trust"
Set-Content (Join-Path $pgData "pg_hba.conf") $pgHba -NoNewline

Restart-Service $serviceName
Start-Sleep -Seconds 3

$env:PGPASSWORD = ""
& "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -d postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
& "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -d postgres -c "SELECT 1 FROM pg_database WHERE datname = 'career_bridge'" | Out-Null
if ($LASTEXITCODE -ne 0) {
  & "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE career_bridge;"
} else {
  $dbExists = & "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'career_bridge'"
  if ($dbExists -ne "1") {
    & "$pgBin\psql.exe" -U postgres -h localhost -p 5432 -d postgres -c "CREATE DATABASE career_bridge;"
  }
}

Copy-Item $backupFile (Join-Path $pgData "pg_hba.conf") -Force
Restart-Service $serviceName

Write-Host "Done. Local postgres password is now 'postgres' and database 'career_bridge' exists."
Write-Host 'Update .env: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/career_bridge?schema=public"'
