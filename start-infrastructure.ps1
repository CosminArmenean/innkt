# INNKT Platform - Infrastructure Startup Script
# This script starts all infrastructure components using Docker Compose

param(
    [switch]$Force,
    [switch]$Verbose
)

Write-Host "Starting INNKT Platform Infrastructure" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

if ($Verbose) {
    $VerbosePreference = "Continue"
}

# Check if Docker is running
Write-Host "`nChecking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "Docker is available: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running or not installed!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is available
Write-Host "`nChecking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version
    Write-Host "Docker Compose is available: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker Compose is not available!" -ForegroundColor Red
    Write-Host "Please install Docker Compose and try again." -ForegroundColor Yellow
    exit 1
}

# Function to check if service is running
function Test-ServiceRunning {
    param([string]$ServiceName, [int]$Port)
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $Port)
        $tcpClient.Close()
        return $true
    } catch {
        return $false
    }
}

# Function to show current infrastructure status
function Show-InfrastructureStatus {
    Write-Host "`nCurrent Infrastructure Status:" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    
    $services = @(
        @{ Name = "PostgreSQL"; Port = 5432; Status = Test-ServiceRunning "PostgreSQL" 5432 },
        @{ Name = "Redis"; Port = 6379; Status = Test-ServiceRunning "Redis" 6379 },
        @{ Name = "MongoDB"; Port = 27017; Status = Test-ServiceRunning "MongoDB" 27017 },
        @{ Name = "Kafka"; Port = 9092; Status = Test-ServiceRunning "Kafka" 9092 },
        @{ Name = "Zookeeper"; Port = 2181; Status = Test-ServiceRunning "Zookeeper" 2181 }
    )
    
    foreach ($service in $services) {
        $statusText = if ($service.Status) { "Running" } else { "Not Running" }
        $color = if ($service.Status) { "Green" } else { "Red" }
        $serviceName = $service.Name
        $servicePort = $service.Port
        Write-Host "  $serviceName (Port $servicePort): $statusText" -ForegroundColor $color
    }
    
    return $services
}

# Check current status
$currentServices = Show-InfrastructureStatus
$runningServices = $currentServices | Where-Object { $_.Status -eq $true }
$stoppedServices = $currentServices | Where-Object { $_.Status -eq $false }

if ($Force) {
    Write-Host "`n🔄 Force restart requested - stopping all containers..." -ForegroundColor Yellow
    docker-compose -f docker-compose-infrastructure.yml down 2>$null
    docker-compose -f docker-compose-mongodb.yml down 2>$null
    Start-Sleep -Seconds 5
    $needsStart = $true
} elseif ($runningServices.Count -eq $currentServices.Count) {
    Write-Host "`nAll infrastructure services are already running!" -ForegroundColor Green
    Write-Host "Use -Force to restart anyway." -ForegroundColor Gray
    $needsStart = $false
} elseif ($runningServices.Count -eq 0) {
    Write-Host "`n🚀 Starting all infrastructure services..." -ForegroundColor Green
    $needsStart = $true
} else {
    Write-Host "`n🔄 Some services are running, some are not. Restarting all for consistency..." -ForegroundColor Yellow
    docker-compose -f docker-compose-infrastructure.yml down 2>$null
    docker-compose -f docker-compose-mongodb.yml down 2>$null
    Start-Sleep -Seconds 3
    $needsStart = $true
}

if ($needsStart) {
    # Start MongoDB replica set first
    Write-Host "`n🗄️ Starting MongoDB Replica Set..." -ForegroundColor Cyan
    docker-compose -f docker-compose-mongodb.yml up -d
    
    # Start other infrastructure
    Write-Host "`n🗄️ Starting Other Infrastructure Components..." -ForegroundColor Cyan
    Write-Host "Starting PostgreSQL, Redis, Kafka, and Zookeeper..." -ForegroundColor Yellow
    docker-compose -f docker-compose-infrastructure.yml up -d
}

# Wait for services to be ready
Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Yellow

# Function to wait for a service
function Wait-ForService {
    param(
        [string]$ServiceName,
        [int]$Port,
        [int]$MaxWaitSeconds = 60
    )
    
    Write-Host "Waiting for $ServiceName on port $Port..." -NoNewline -ForegroundColor Yellow
    $waited = 0
    
    while ($waited -lt $MaxWaitSeconds) {
        try {
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $tcpClient.Connect("localhost", $Port)
            $tcpClient.Close()
            Write-Host " Ready!" -ForegroundColor Green
            return $true
        }
        catch {
            Start-Sleep -Seconds 2
            $waited += 2
            Write-Host "." -NoNewline -ForegroundColor Yellow
        }
    }
    
    Write-Host " Timeout!" -ForegroundColor Red
    return $false
}

# Wait for each service
$services = @(
    @{ Name = "PostgreSQL"; Port = 5432 },
    @{ Name = "Redis"; Port = 6379 },
    @{ Name = "MongoDB"; Port = 27017 },
    @{ Name = "Kafka"; Port = 9092 },
    @{ Name = "Zookeeper"; Port = 2181 }
)

$allReady = $true
foreach ($service in $services) {
    if (-not (Wait-ForService -ServiceName $service.Name -Port $service.Port)) {
        $allReady = $false
    }
}

# Check container status
Write-Host "`nContainer Status:" -ForegroundColor Cyan
docker-compose ps

# Final status check
Write-Host "`nFinal Infrastructure Status:" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

$finalServices = Show-InfrastructureStatus
$allRunning = ($finalServices | Where-Object { $_.Status -eq $false }).Count -eq 0

# Check MongoDB replica set status
Write-Host "`n🔗 MongoDB Replica Set Status:" -ForegroundColor Cyan
try {
    # Use a simple approach to avoid PowerShell parsing issues
    $mongoStatus = docker exec mongodb-social mongosh --quiet --eval 'try { let s = rs.status(); print("RS_OK:" + s.set + ":" + s.members.length + ":" + s.myState); s.members.forEach(m => print("MEMBER:" + m._id + ":" + m.name + ":" + m.stateStr)); } catch (e) { print("RS_ERROR:" + e.message); }' 2>$null

    if ($mongoStatus -match "RS_OK:(.+):(\d+):(\d+)") {
        $setName = $matches[1]
        $memberCount = $matches[2]
        $myState = $matches[3]
        
        Write-Host "🎯 Replica Set: $setName" -ForegroundColor Green
        Write-Host "📊 Total Members: $memberCount" -ForegroundColor Green
        
        $myStateText = if ($myState -eq "1") { "PRIMARY" } else { "SECONDARY" }
        Write-Host "🔧 My State: $myStateText" -ForegroundColor Green
        
        # Parse member information
        $memberLines = $mongoStatus -split "`n" | Where-Object { $_ -match "MEMBER:(\d+):(.+):(.+)" }
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
        Write-Host "CHANGE STREAMS READY: Both services can now use real-time updates!" -ForegroundColor Green
    } elseif ($mongoStatus -match "RS_ERROR:(.+)") {
        Write-Host "❌ Replica Set Error: $($matches[1])" -ForegroundColor Red
        Write-Host "⚠️ Change Streams may not work properly" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not check MongoDB replica set status" -ForegroundColor Red
}

# Summary
Write-Host "`nInfrastructure Summary:" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

if ($allRunning) {
    Write-Host "All infrastructure services are running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Infrastructure Components:" -ForegroundColor Cyan
    Write-Host "- PostgreSQL Database:     localhost:5432" -ForegroundColor White
    Write-Host "- Redis Cache:             localhost:6379" -ForegroundColor White
    Write-Host "- MongoDB Social:          localhost:27018 (innkt_social)" -ForegroundColor White
    Write-Host "- MongoDB Messaging:       localhost:27017 (innkt_messaging)" -ForegroundColor White
    Write-Host "- Kafka Message Broker:    localhost:9092" -ForegroundColor White
    Write-Host "- Zookeeper:               localhost:2181" -ForegroundColor White
    Write-Host "- Kafka UI (Monitoring):   http://localhost:8080" -ForegroundColor White
    Write-Host ""
    Write-Host "You can now start the backend services with: .\start-services.ps1" -ForegroundColor Yellow
} else {
    Write-Host "Some services failed to start properly" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "- Check logs: docker-compose -f docker-compose-infrastructure.yml logs" -ForegroundColor White
    Write-Host "- Check MongoDB: docker-compose -f docker-compose-mongodb.yml logs" -ForegroundColor White
    Write-Host "- Force restart: .\start-infrastructure.ps1 -Force" -ForegroundColor White
}
