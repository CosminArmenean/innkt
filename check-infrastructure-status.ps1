# Infrastructure Status Check Script
# Provides a clean, comprehensive status report of all infrastructure services

param(
    [switch]$Detailed
)

Write-Host "INNKT Infrastructure Status Check" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

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

# Function to check Docker container status
function Get-ContainerStatus {
    param([string]$ContainerName)
    try {
        $result = docker inspect --format='{{.State.Status}}' $ContainerName 2>$null
        return $result
    } catch {
        return "not-found"
    }
}

# Check Docker availability
Write-Host "`nDocker Status:" -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "  Docker: Available ($dockerVersion)" -ForegroundColor Green
} catch {
    Write-Host "  Docker: Not Available" -ForegroundColor Red
    exit 1
}

try {
    $composeVersion = docker-compose --version
    Write-Host "  Docker Compose: Available ($composeVersion)" -ForegroundColor Green
} catch {
    Write-Host "  Docker Compose: Not Available" -ForegroundColor Red
}

# Check infrastructure services
Write-Host "`nInfrastructure Services:" -ForegroundColor Yellow

$services = @(
    @{ Name = "PostgreSQL"; Port = 5432; Container = "innkt-postgres" },
    @{ Name = "Redis"; Port = 6379; Container = "innkt-redis" },
    @{ Name = "MongoDB Social"; Port = 27018; Container = "mongodb-social" },
    @{ Name = "MongoDB Messaging"; Port = 27017; Container = "mongodb-messaging" },
    @{ Name = "Kafka"; Port = 9092; Container = "innkt-kafka" },
    @{ Name = "Zookeeper"; Port = 2181; Container = "innkt-zookeeper" }
)

$runningCount = 0
$totalCount = $services.Count

foreach ($service in $services) {
    $portStatus = Test-ServiceRunning $service.Name $service.Port
    $containerStatus = Get-ContainerStatus $service.Container
    
    if ($portStatus) {
        Write-Host "  $($service.Name) (Port $($service.Port)): Running" -ForegroundColor Green
        $runningCount++
        if ($Detailed) {
            Write-Host "    Container: $($service.Container) ($containerStatus)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  $($service.Name) (Port $($service.Port)): Not Running" -ForegroundColor Red
        if ($Detailed) {
            Write-Host "    Container: $($service.Container) ($containerStatus)" -ForegroundColor Gray
        }
    }
}

# Check MongoDB Replica Set Status
Write-Host "`nMongoDB Replica Set:" -ForegroundColor Yellow
try {
    $replicaStatus = docker exec mongodb-social mongosh --quiet --eval 'try { let s = rs.status(); print("RS_OK:" + s.set + ":" + s.members.length + ":" + s.myState); s.members.forEach(m => print("MEMBER:" + m._id + ":" + m.name + ":" + m.stateStr)); } catch (e) { print("RS_ERROR:" + e.message); }' 2>$null

    if ($replicaStatus -match "RS_OK:(.+):(\d+):(\d+)") {
        $setName = $matches[1]
        $memberCount = $matches[2]
        $myState = $matches[3]
        
        Write-Host "  Replica Set: $setName" -ForegroundColor Green
        Write-Host "  Total Members: $memberCount" -ForegroundColor Green
        
        $myStateText = if ($myState -eq "1") { "PRIMARY" } else { "SECONDARY" }
        Write-Host "  My State: $myStateText" -ForegroundColor Green
        
        if ($Detailed) {
            # Parse member information
            $memberLines = $replicaStatus -split "`n" | Where-Object { $_ -match "MEMBER:(\d+):(.+):(.+)" }
            foreach ($memberLine in $memberLines) {
                if ($memberLine -match "MEMBER:(\d+):(.+):(.+)") {
                    $memberId = $matches[1]
                    $memberName = $matches[2]
                    $memberState = $matches[3]
                    
                    $emoji = if ($memberState -eq "PRIMARY") { "[P]" } else { "[S]" }
                    Write-Host "    $emoji Member $memberId`: $memberName ($memberState)" -ForegroundColor $(if ($memberState -eq "PRIMARY") { "Green" } else { "Cyan" })
                }
            }
        }
        
        Write-Host "  Change Streams: Ready" -ForegroundColor Green
    } elseif ($replicaStatus -match "RS_ERROR:(.+)") {
        Write-Host "  Replica Set: Error - $($matches[1])" -ForegroundColor Red
        Write-Host "  Change Streams: Not Available" -ForegroundColor Red
    }
} catch {
    Write-Host "  Replica Set: Cannot check status" -ForegroundColor Red
}

# Overall Summary
Write-Host "`nOverall Status:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

$healthPercentage = [math]::Round(($runningCount / $totalCount) * 100)

if ($runningCount -eq $totalCount) {
    Write-Host "Infrastructure: HEALTHY ($runningCount/$totalCount services running)" -ForegroundColor Green
    Write-Host "Status: All systems operational" -ForegroundColor Green
} elseif ($runningCount -gt 0) {
    Write-Host "Infrastructure: PARTIAL ($runningCount/$totalCount services running - $healthPercentage%)" -ForegroundColor Yellow
    Write-Host "Status: Some services need attention" -ForegroundColor Yellow
} else {
    Write-Host "Infrastructure: DOWN (0/$totalCount services running)" -ForegroundColor Red
    Write-Host "Status: Infrastructure needs to be started" -ForegroundColor Red
}

# Connection Information
if ($runningCount -gt 0) {
    Write-Host "`nConnection Information:" -ForegroundColor Cyan
    foreach ($service in $services) {
        if (Test-ServiceRunning $service.Name $service.Port) {
            Write-Host "  $($service.Name): localhost:$($service.Port)" -ForegroundColor White
        }
    }
}

# Next Steps
Write-Host "`nNext Steps:" -ForegroundColor Yellow
if ($runningCount -eq $totalCount) {
    Write-Host "  - Start application services: .\start-services.ps1" -ForegroundColor White
    Write-Host "  - View detailed MongoDB status: .\check-mongodb-status.ps1 -Detailed" -ForegroundColor White
} elseif ($runningCount -gt 0) {
    Write-Host "  - Restart infrastructure: .\start-infrastructure.ps1 -Force" -ForegroundColor White
    Write-Host "  - Check logs: docker-compose logs" -ForegroundColor White
} else {
    Write-Host "  - Start infrastructure: .\start-infrastructure.ps1" -ForegroundColor White
    Write-Host "  - Check Docker status: docker ps" -ForegroundColor White
}

Write-Host ""
