# MongoDB Replica Set Stop Script
# This script safely stops the MongoDB replica set containers

param(
    [switch]$RemoveVolumes,
    [switch]$Verbose
)

Write-Host "🛑 Stopping MongoDB Replica Set" -ForegroundColor Red
Write-Host "===============================" -ForegroundColor Red

if ($Verbose) {
    $VerbosePreference = "Continue"
}

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to get container status
function Get-ContainerStatus {
    param([string]$ContainerName)
    
    try {
        $status = docker inspect --format='{{.State.Status}}' $ContainerName 2>$null
        return $status
    }
    catch {
        return "not-found"
    }
}

# Function to show current status
function Show-CurrentStatus {
    Write-Host ""
    Write-Host "📊 Current Status:" -ForegroundColor Cyan
    
    $socialStatus = Get-ContainerStatus "mongodb-social"
    $messagingStatus = Get-ContainerStatus "mongodb-messaging"
    
    Write-Host "  mongodb-social:    $socialStatus" -ForegroundColor $(if ($socialStatus -eq "running") { "Green" } elseif ($socialStatus -eq "not-found") { "Gray" } else { "Yellow" })
    Write-Host "  mongodb-messaging: $messagingStatus" -ForegroundColor $(if ($messagingStatus -eq "running") { "Green" } elseif ($messagingStatus -eq "not-found") { "Gray" } else { "Yellow" })
}

# Function to backup data (optional)
function Backup-MongoData {
    Write-Host "💾 Creating data backup..." -ForegroundColor Yellow
    
    $backupDir = "mongodb-backup-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    try {
        # Backup Social database
        if ((Get-ContainerStatus "mongodb-social") -eq "running") {
            Write-Host "  Backing up Social database..." -ForegroundColor Gray
            docker exec mongodb-social mongodump --db innkt_social --archive="/data/db/social-backup.archive" 2>$null
            docker cp mongodb-social:/data/db/social-backup.archive "$backupDir/social-backup.archive" 2>$null
        }
        
        # Backup Messaging database
        if ((Get-ContainerStatus "mongodb-messaging") -eq "running") {
            Write-Host "  Backing up Messaging database..." -ForegroundColor Gray
            docker exec mongodb-messaging mongodump --db innkt_messaging --archive="/data/db/messaging-backup.archive" 2>$null
            docker cp mongodb-messaging:/data/db/messaging-backup.archive "$backupDir/messaging-backup.archive" 2>$null
        }
        
        Write-Host "✅ Backup created in: $backupDir" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Backup failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Continuing with shutdown..." -ForegroundColor Gray
    }
}

# Main execution
try {
    # Check prerequisites
    if (-not (Test-DockerRunning)) {
        Write-Host "❌ Docker is not running. Cannot check container status." -ForegroundColor Red
        exit 1
    }

    # Show current status
    Show-CurrentStatus

    # Check if any containers are running
    $socialStatus = Get-ContainerStatus "mongodb-social"
    $messagingStatus = Get-ContainerStatus "mongodb-messaging"
    
    if ($socialStatus -eq "not-found" -and $messagingStatus -eq "not-found") {
        Write-Host "ℹ️ No MongoDB containers found. Nothing to stop." -ForegroundColor Gray
        exit 0
    }

    if ($socialStatus -ne "running" -and $messagingStatus -ne "running") {
        Write-Host "ℹ️ MongoDB containers are not running." -ForegroundColor Gray
        
        # Ask if user wants to remove stopped containers
        $response = Read-Host "Remove stopped containers? (y/N)"
        if ($response -match "^[Yy]") {
            Write-Host "🧹 Removing stopped containers..." -ForegroundColor Yellow
            docker-compose -f docker-compose-mongodb.yml down $(if ($RemoveVolumes) { "-v" })
            Write-Host "✅ Stopped containers removed." -ForegroundColor Green
        }
        exit 0
    }

    # Warn about data loss if removing volumes
    if ($RemoveVolumes) {
        Write-Host ""
        Write-Host "⚠️  WARNING: -RemoveVolumes will delete all MongoDB data!" -ForegroundColor Red
        Write-Host "This action cannot be undone." -ForegroundColor Red
        
        $response = Read-Host "Are you sure you want to remove all data? (y/N)"
        if ($response -notmatch "^[Yy]") {
            Write-Host "Operation cancelled by user." -ForegroundColor Yellow
            exit 0
        }
        
        # Offer to backup first
        $backupResponse = Read-Host "Create a backup before removing data? (Y/n)"
        if ($backupResponse -notmatch "^[Nn]") {
            Backup-MongoData
        }
    }

    # Graceful shutdown message
    Write-Host ""
    Write-Host "🔄 Gracefully shutting down MongoDB replica set..." -ForegroundColor Yellow
    
    # Stop the containers
    if ($RemoveVolumes) {
        Write-Host "🗑️ Stopping containers and removing volumes..." -ForegroundColor Red
        docker-compose -f docker-compose-mongodb.yml down -v
    } else {
        Write-Host "🛑 Stopping containers (preserving data)..." -ForegroundColor Yellow
        docker-compose -f docker-compose-mongodb.yml down
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Some containers may not have stopped cleanly" -ForegroundColor Yellow
    } else {
        Write-Host "✅ MongoDB replica set stopped successfully" -ForegroundColor Green
    }

    # Final status check
    Start-Sleep -Seconds 2
    Show-CurrentStatus

    # Summary
    Write-Host ""
    Write-Host "🎯 Summary:" -ForegroundColor Cyan
    if ($RemoveVolumes) {
        Write-Host "  ✅ Containers stopped and removed" -ForegroundColor Green
        Write-Host "  ✅ Data volumes removed" -ForegroundColor Green
        Write-Host "  ⚠️ All MongoDB data has been deleted" -ForegroundColor Red
    } else {
        Write-Host "  ✅ Containers stopped" -ForegroundColor Green
        Write-Host "  ✅ Data volumes preserved" -ForegroundColor Green
        Write-Host "  ℹ️ Data will be available when restarted" -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "  • To restart: .\start-mongodb-replica.ps1" -ForegroundColor White
    Write-Host "  • To setup fresh: .\setup-mongodb-replica.ps1 -Force" -ForegroundColor White
    Write-Host "  • To check status: docker ps -a" -ForegroundColor White

}
catch {
    Write-Host "❌ Failed to stop MongoDB replica set: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual cleanup may be required:" -ForegroundColor Yellow
    Write-Host "  docker stop mongodb-social mongodb-messaging" -ForegroundColor White
    Write-Host "  docker rm mongodb-social mongodb-messaging" -ForegroundColor White
    if ($RemoveVolumes) {
        Write-Host "  docker volume rm innkt_mongodb-social-data innkt_mongodb-messaging-data" -ForegroundColor White
    }
    exit 1
}
