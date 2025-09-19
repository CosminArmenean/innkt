# MongoDB Replica Set Start Script
# This script checks if MongoDB instances are running and starts/restarts them as needed

param(
    [switch]$Force,
    [switch]$Verbose
)

Write-Host "🚀 Starting MongoDB Replica Set" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

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

# Function to check container status
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

# Function to check if container is healthy
function Test-ContainerHealthy {
    param([string]$ContainerName)
    
    try {
        $health = docker inspect --format='{{.State.Health.Status}}' $ContainerName 2>$null
        return ($health -eq "healthy")
    }
    catch {
        return $false
    }
}

# Function to check if replica set is working
function Test-ReplicaSetWorking {
    try {
        $result = docker exec mongodb-social mongosh --eval 'try { let s = rs.status(); print("REPLICA_SET_OK:" + s.members.length); } catch (e) { print("REPLICA_SET_ERROR:" + e.message); }' 2>$null

        return $result -match "REPLICA_SET_OK:"
    }
    catch {
        return $false
    }
}

# Function to wait for container health
function Wait-ForContainerHealth {
    param([string]$ContainerName, [int]$TimeoutSeconds = 30)
    
    Write-Host "⏳ Waiting for $ContainerName to be healthy..." -ForegroundColor Yellow
    
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        if (Test-ContainerHealthy $ContainerName) {
            Write-Host "✅ $ContainerName is healthy" -ForegroundColor Green
            return $true
        }
        
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "❌ $ContainerName failed to become healthy within $TimeoutSeconds seconds" -ForegroundColor Red
    return $false
}

# Function to show current status
function Show-CurrentStatus {
    Write-Host ""
    Write-Host "📊 Current Status:" -ForegroundColor Cyan
    Write-Host "=================" -ForegroundColor Cyan
    
    $socialStatus = Get-ContainerStatus "mongodb-social"
    $messagingStatus = Get-ContainerStatus "mongodb-messaging"
    
    Write-Host "  mongodb-social:    $socialStatus" -ForegroundColor $(if ($socialStatus -eq "running") { "Green" } else { "Red" })
    Write-Host "  mongodb-messaging: $messagingStatus" -ForegroundColor $(if ($messagingStatus -eq "running") { "Green" } else { "Red" })
    
    if ($socialStatus -eq "running" -and $messagingStatus -eq "running") {
        $replicaWorking = Test-ReplicaSetWorking
        Write-Host "  Replica Set:       $(if ($replicaWorking) { 'Working' } else { 'Not Working' })" -ForegroundColor $(if ($replicaWorking) { "Green" } else { "Red" })
    }
}

# Main execution
try {
    # Check prerequisites
    if (-not (Test-DockerRunning)) {
        Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
        exit 1
    }

    # Show current status
    Show-CurrentStatus

    # Check current container states
    $socialStatus = Get-ContainerStatus "mongodb-social"
    $messagingStatus = Get-ContainerStatus "mongodb-messaging"
    $replicaWorking = $false

    if ($socialStatus -eq "running" -and $messagingStatus -eq "running") {
        $replicaWorking = Test-ReplicaSetWorking
    }

    # Determine what action to take
    $needsRestart = $false
    $needsStart = $false

    if ($Force) {
        Write-Host "🔄 Force restart requested" -ForegroundColor Yellow
        $needsRestart = $true
    }
    elseif ($socialStatus -eq "not-found" -or $messagingStatus -eq "not-found") {
        Write-Host "🚀 Containers not found - performing initial setup" -ForegroundColor Yellow
        $needsStart = $true
    }
    elseif ($socialStatus -ne "running" -or $messagingStatus -ne "running") {
        Write-Host "🔄 Some containers are not running - restarting" -ForegroundColor Yellow
        $needsRestart = $true
    }
    elseif (-not $replicaWorking) {
        Write-Host "🔄 Replica set not working properly - restarting" -ForegroundColor Yellow
        $needsRestart = $true
    }
    else {
        Write-Host "✅ MongoDB replica set is already running and healthy!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Connection strings:" -ForegroundColor Cyan
        Write-Host "  Social:    mongodb://localhost:27018/innkt_social?replicaSet=rs0" -ForegroundColor White
        Write-Host "  Messaging: mongodb://localhost:27017/innkt_messaging?replicaSet=rs0" -ForegroundColor White
        Write-Host ""
        Write-Host "Use -Force to restart anyway, or .\check-mongodb-status.ps1 for detailed status" -ForegroundColor Gray
        exit 0
    }

    # Stop containers if they exist and we need to restart
    if ($needsRestart) {
        Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
        docker-compose -f docker-compose-mongodb.yml down 2>$null
        Start-Sleep -Seconds 5
    }

    # Start containers
    Write-Host "🚀 Starting MongoDB replica set containers..." -ForegroundColor Green
    docker-compose -f docker-compose-mongodb.yml up -d

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to start containers" -ForegroundColor Red
        exit 1
    }

    # Wait for containers to be healthy
    if (-not (Wait-ForContainerHealth "mongodb-social" 60)) {
        Write-Host "❌ mongodb-social failed to start properly" -ForegroundColor Red
        Write-Host "Check logs with: docker-compose -f docker-compose-mongodb.yml logs mongodb-social" -ForegroundColor Yellow
        exit 1
    }

    if (-not (Wait-ForContainerHealth "mongodb-messaging" 60)) {
        Write-Host "❌ mongodb-messaging failed to start properly" -ForegroundColor Red
        Write-Host "Check logs with: docker-compose -f docker-compose-mongodb.yml logs mongodb-messaging" -ForegroundColor Yellow
        exit 1
    }

    # Wait for MongoDB to be fully ready
    Write-Host "⏳ Waiting for MongoDB instances to be fully ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15

    # Check if replica set is working
    Write-Host "🔍 Checking replica set status..." -ForegroundColor Yellow
    $attempts = 0
    $maxAttempts = 6
    $replicaReady = $false

    while ($attempts -lt $maxAttempts -and -not $replicaReady) {
        $attempts++
        Write-Host "  Attempt $attempts/$maxAttempts..." -ForegroundColor Gray
        
        if (Test-ReplicaSetWorking) {
            $replicaReady = $true
        } else {
            Start-Sleep -Seconds 10
        }
    }

    if (-not $replicaReady) {
        Write-Host "⚠️ Replica set may not be fully initialized yet" -ForegroundColor Yellow
        Write-Host "This is normal for first-time setup. The initialization container should handle this." -ForegroundColor Gray
        Write-Host "Wait a few more minutes and check with: .\check-mongodb-status.ps1" -ForegroundColor Gray
    }

    # Final status with nice display
    Write-Host ""
    Write-Host "🎉 MongoDB Replica Set Started Successfully!" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Green
    
    Show-CurrentStatus
    
    # Get detailed replica set status for nice display
    Write-Host ""
    Write-Host "🔗 MongoDB Replica Set Status:" -ForegroundColor Cyan
    try {
        $replicaStatus = docker exec mongodb-social mongosh --quiet --eval 'try { let s = rs.status(); print("RS_OK:" + s.set + ":" + s.members.length + ":" + s.myState); s.members.forEach(m => print("MEMBER:" + m._id + ":" + m.name + ":" + m.stateStr)); } catch (e) { print("RS_ERROR:" + e.message); }' 2>$null

        if ($replicaStatus -match "RS_OK:(.+):(\d+):(\d+)") {
            $setName = $matches[1]
            $memberCount = $matches[2]
            $myState = $matches[3]
            
            Write-Host "🎯 Replica Set: $setName" -ForegroundColor Green
            Write-Host "📊 Total Members: $memberCount" -ForegroundColor Green
            
            $myStateText = if ($myState -eq "1") { "PRIMARY" } else { "SECONDARY" }
            Write-Host "🔧 My State: $myStateText" -ForegroundColor Green
            
            # Parse member information
            $memberLines = $replicaStatus -split "`n" | Where-Object { $_ -match "MEMBER:(\d+):(.+):(.+)" }
            foreach ($memberLine in $memberLines) {
                if ($memberLine -match "MEMBER:(\d+):(.+):(.+)") {
                    $memberId = $matches[1]
                    $memberName = $matches[2]
                    $memberState = $matches[3]
                    
                    $emoji = if ($memberState -eq "PRIMARY") { "[P]" } else { "[S]" }
                    $color = if ($memberState -eq "PRIMARY") { "Green" } else { "Cyan" }
                    Write-Host "$emoji Member $memberId`: $memberName ($memberState)" -ForegroundColor $color
                }
            }
            
            Write-Host ""
            Write-Host "✅ CHANGE STREAMS READY: Both services can now use real-time updates!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Replica set status will be available shortly" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Replica set status check will be available after full initialization" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🔗 Connection Information:" -ForegroundColor Cyan
    Write-Host "  Social Service:    mongodb://localhost:27018/innkt_social?replicaSet=rs0" -ForegroundColor White
    Write-Host "  Messaging Service: mongodb://localhost:27017/innkt_messaging?replicaSet=rs0" -ForegroundColor White

    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Check detailed status: .\check-mongodb-status.ps1" -ForegroundColor White
    Write-Host "  2. Start your services: .\start-services.ps1" -ForegroundColor White
    Write-Host "  3. View logs: docker-compose -f docker-compose-mongodb.yml logs" -ForegroundColor White

}
catch {
    Write-Host "❌ Failed to start MongoDB replica set: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check Docker logs: docker-compose -f docker-compose-mongodb.yml logs" -ForegroundColor White
    Write-Host "  2. Check container status: docker ps -a" -ForegroundColor White
    Write-Host "  3. Try force restart: .\start-mongodb-replica.ps1 -Force" -ForegroundColor White
    exit 1
}
