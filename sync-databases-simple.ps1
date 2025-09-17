# Simple Database Sync Script
# Syncs real PostgreSQL database to Docker PostgreSQL container
# Usage: .\sync-databases-simple.ps1

param(
    [string]$Database = "innkt_social",
    [string]$User = "admin_officer",
    [string]$Password = "@CAvp57rt26",
    [string]$LocalPort = "5432",
    [string]$DockerContainer = "innkt-postgres"
)

Write-Host "Starting database sync process..." -ForegroundColor Cyan
Write-Host "Source: Local PostgreSQL (port $LocalPort)" -ForegroundColor Yellow
Write-Host "Target: Docker container '$DockerContainer'" -ForegroundColor Yellow
Write-Host "Database: $Database" -ForegroundColor Yellow
Write-Host ""

# Check if Docker container is running
Write-Host "Checking Docker container status..." -ForegroundColor Cyan
$containerStatus = docker ps --filter "name=$DockerContainer" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "Error: Docker container '$DockerContainer' is not running!" -ForegroundColor Red
    Write-Host "Please start the infrastructure first: docker-compose -f docker-compose-infrastructure-secure.yml up -d" -ForegroundColor Yellow
    exit 1
}
Write-Host "Docker container is running: $containerStatus" -ForegroundColor Green

# Check if local PostgreSQL is accessible
Write-Host "Checking local PostgreSQL connection..." -ForegroundColor Cyan
$env:PGPASSWORD = $Password
try {
    $testConnection = & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U $User -h localhost -p $LocalPort -d $Database -c "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Local PostgreSQL connection successful" -ForegroundColor Green
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Host "Error: Cannot connect to local PostgreSQL!" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is running on port $LocalPort" -ForegroundColor Yellow
    exit 1
}

# Create backup file
$backupFile = "temp_db_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
Write-Host "Creating database backup..." -ForegroundColor Cyan
Write-Host "Backup file: $backupFile" -ForegroundColor Gray

try {
    & "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U $User -h localhost -p $LocalPort -d $Database --clean --if-exists > $backupFile
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database backup created successfully" -ForegroundColor Green
    } else {
        throw "Backup failed"
    }
} catch {
    Write-Host "Error: Failed to create database backup!" -ForegroundColor Red
    exit 1
}

# Restore to Docker container
Write-Host "Restoring backup to Docker container..." -ForegroundColor Cyan
try {
    Get-Content $backupFile | docker exec -i $DockerContainer psql -U $User -d $Database
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database restored to Docker container successfully" -ForegroundColor Green
    } else {
        throw "Restore failed"
    }
} catch {
    Write-Host "Error: Failed to restore database to Docker container!" -ForegroundColor Red
    exit 1
}

# Simple verification - just check if we can query both databases
Write-Host "Verifying sync..." -ForegroundColor Cyan

# Check local database
$localPosts = & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U $User -h localhost -p $LocalPort -d $Database -t -c "SELECT COUNT(*) FROM `"Posts`";" 2>$null
$localPosts = $localPosts.Trim()

# Check Docker database
$dockerPosts = docker exec $DockerContainer psql -U $User -d $Database -t -c "SELECT COUNT(*) FROM `"Posts`";" 2>$null
$dockerPosts = $dockerPosts.Trim()

Write-Host "Posts table row count - Local: $localPosts, Docker: $dockerPosts" -ForegroundColor Gray

if ($localPosts -eq $dockerPosts) {
    Write-Host "Sync verification successful!" -ForegroundColor Green
} else {
    Write-Host "Warning: Row counts don't match!" -ForegroundColor Yellow
}

# Cleanup
Write-Host "Cleaning up temporary files..." -ForegroundColor Cyan
if (Test-Path $backupFile) {
    Remove-Item $backupFile -Force
    Write-Host "Temporary backup file removed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Sync process completed!" -ForegroundColor Cyan
Write-Host "Docker container '$DockerContainer' now reflects your local database." -ForegroundColor Green
