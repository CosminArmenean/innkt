# Database Sync Script
# Syncs real PostgreSQL database to Docker PostgreSQL container
# Usage: .\sync-databases.ps1

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

# Verify sync
Write-Host "Verifying sync..." -ForegroundColor Cyan

# Get table counts from both databases
Write-Host "Comparing table counts..." -ForegroundColor Gray

# Local database counts
$localCounts = @()
$tables = @("Posts", "Comments", "Likes", "Follows", "Groups", "GroupMembers", "GroupPosts")
foreach ($table in $tables) {
    $count = & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U $User -h localhost -p $LocalPort -d $Database -t -c "SELECT COUNT(*) FROM `"$table`";" 2>$null
    $localCounts += [PSCustomObject]@{Table = $table; LocalCount = $count.Trim()}
}

# Docker database counts
$dockerCounts = @()
foreach ($table in $tables) {
    $count = docker exec $DockerContainer psql -U $User -d $Database -t -c "SELECT COUNT(*) FROM `"$table`";" 2>$null
    $dockerCounts += [PSCustomObject]@{Table = $table; DockerCount = $count.Trim()}
}

# Compare counts
$allMatch = $true
Write-Host ""
Write-Host "Sync Verification Results:" -ForegroundColor Cyan
Write-Host "Table Name      | Local DB | Docker DB | Status" -ForegroundColor Gray
Write-Host "----------------|----------|-----------|--------" -ForegroundColor Gray

foreach ($local in $localCounts) {
    $docker = $dockerCounts | Where-Object { $_.Table -eq $local.Table }
    $match = $local.LocalCount -eq $docker.DockerCount
    $status = if ($match) { "Match" } else { "Mismatch" }
    $allMatch = $allMatch -and $match
    
    Write-Host ("{0,-15} | {1,8} | {2,9} | {3}" -f $local.Table, $local.LocalCount, $docker.DockerCount, $status) -ForegroundColor $(if ($match) { "Green" } else { "Red" })
}

Write-Host ""

if ($allMatch) {
    Write-Host "Database sync completed successfully!" -ForegroundColor Green
    Write-Host "Both databases now have identical data." -ForegroundColor Green
} else {
    Write-Host "Warning: Some tables have mismatched row counts!" -ForegroundColor Yellow
    Write-Host "Please check the sync process." -ForegroundColor Yellow
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