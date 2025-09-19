# MongoDB Replica Set Status Check Script
# This script provides detailed status information about the MongoDB replica set

param(
    [switch]$Detailed,
    [switch]$Continuous,
    [int]$RefreshInterval = 10
)

Write-Host "MongoDB Replica Set Status Check" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

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
        $inspect = docker inspect $ContainerName 2>$null | ConvertFrom-Json
        if ($inspect) {
            return @{
                Status = $inspect.State.Status
                Health = $inspect.State.Health.Status
                StartedAt = $inspect.State.StartedAt
                RestartCount = $inspect.RestartCount
                IPAddress = $inspect.NetworkSettings.Networks.'innkt_innkt-network'.IPAddress
            }
        }
        return $null
    }
    catch {
        return $null
    }
}

# Function to get replica set status
function Get-ReplicaSetStatus {
    try {
        $result = docker exec mongodb-social mongosh --quiet --eval 'try { let s = rs.status(); print("RS_STATUS:" + s.set + ":" + s.members.length + ":" + s.myState); s.members.forEach(m => print("MEMBER:" + m._id + ":" + m.name + ":" + m.stateStr + ":" + m.health + ":" + m.uptime)); } catch (e) { print("RS_ERROR:" + e.message); }' 2>$null

        if ($result -match "RS_STATUS:(.+):(\d+):(\d+)") {
            $setName = $matches[1]
            $memberCount = $matches[2]
            $myState = $matches[3]
            
            # Parse members
            $memberLines = $result -split "`n" | Where-Object { $_ -match "MEMBER:(\d+):(.+):(.+):(\d+):(\d+)" }
            $members = @()
            foreach ($memberLine in $memberLines) {
                if ($memberLine -match "MEMBER:(\d+):(.+):(.+):(\d+):(\d+)") {
                    $members += @{
                        id = $matches[1]
                        name = $matches[2]
                        stateStr = $matches[3]
                        health = $matches[4]
                        uptime = $matches[5]
                    }
                }
            }
            
            return @{
                set = $setName
                myState = [int]$myState
                members = $members
            }
        }
        elseif ($result -match "RS_ERROR:(.+)") {
            return @{ Error = $matches[1] }
        }
        
        return $null
    }
    catch {
        return $null
    }
}

# Function to get database statistics
function Get-DatabaseStats {
    param([string]$ContainerName, [string]$DatabaseName)
    
    try {
        $result = docker exec $ContainerName mongosh $DatabaseName --quiet --eval 'let s = db.stats(); print("DB_STATS:" + s.db + ":" + s.collections + ":" + s.objects + ":" + s.dataSize + ":" + s.storageSize + ":" + s.indexes + ":" + s.indexSize);' 2>$null

        if ($result -match "DB_STATS:(.+):(\d+):(\d+):(\d+):(\d+):(\d+):(\d+)") {
            return @{
                database = $matches[1]
                collections = [int]$matches[2]
                objects = [int]$matches[3]
                dataSize = [long]$matches[4]
                storageSize = [long]$matches[5]
                indexes = [int]$matches[6]
                indexSize = [long]$matches[7]
            }
        }
        
        return $null
    }
    catch {
        return $null
    }
}

# Function to format bytes
function Format-Bytes {
    param([long]$Bytes)
    
    if ($Bytes -ge 1GB) {
        return "{0:N2} GB" -f ($Bytes / 1GB)
    }
    elseif ($Bytes -ge 1MB) {
        return "{0:N2} MB" -f ($Bytes / 1MB)
    }
    elseif ($Bytes -ge 1KB) {
        return "{0:N2} KB" -f ($Bytes / 1KB)
    }
    else {
        return "$Bytes bytes"
    }
}

# Function to show detailed status
function Show-DetailedStatus {
    Write-Host ""
    Write-Host "🐳 Container Status:" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    
    $socialContainer = Get-ContainerStatus "mongodb-social"
    $messagingContainer = Get-ContainerStatus "mongodb-messaging"
    
    # Social container
    if ($socialContainer) {
        Write-Host "📦 mongodb-social:" -ForegroundColor Yellow
        Write-Host "  Status:       $($socialContainer.Status)" -ForegroundColor $(if ($socialContainer.Status -eq "running") { "Green" } else { "Red" })
        Write-Host "  Health:       $($socialContainer.Health)" -ForegroundColor $(if ($socialContainer.Health -eq "healthy") { "Green" } else { "Red" })
        Write-Host "  Started:      $($socialContainer.StartedAt)" -ForegroundColor Gray
        Write-Host "  Restarts:     $($socialContainer.RestartCount)" -ForegroundColor Gray
        Write-Host "  IP Address:   $($socialContainer.IPAddress)" -ForegroundColor Gray
        Write-Host "  Host Port:    27018 -> 27017" -ForegroundColor Gray
    } else {
        Write-Host "mongodb-social: NOT FOUND" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # Messaging container
    if ($messagingContainer) {
        Write-Host "mongodb-messaging:" -ForegroundColor Yellow
        Write-Host "  Status:       $($messagingContainer.Status)" -ForegroundColor $(if ($messagingContainer.Status -eq "running") { "Green" } else { "Red" })
        Write-Host "  Health:       $($messagingContainer.Health)" -ForegroundColor $(if ($messagingContainer.Health -eq "healthy") { "Green" } else { "Red" })
        Write-Host "  Started:      $($messagingContainer.StartedAt)" -ForegroundColor Gray
        Write-Host "  Restarts:     $($messagingContainer.RestartCount)" -ForegroundColor Gray
        Write-Host "  IP Address:   $($messagingContainer.IPAddress)" -ForegroundColor Gray
        Write-Host "  Host Port:    27017 -> 27017" -ForegroundColor Gray
    } else {
        Write-Host "mongodb-messaging: NOT FOUND" -ForegroundColor Red
    }

    # Replica Set Status
    Write-Host ""
    Write-Host "🔗 Replica Set Status:" -ForegroundColor Cyan
    Write-Host "=====================" -ForegroundColor Cyan
    
    $replicaStatus = Get-ReplicaSetStatus
    if ($replicaStatus -and -not $replicaStatus.Error) {
        Write-Host "📊 Set Name:      $($replicaStatus.set)" -ForegroundColor Green
        Write-Host "📊 My State:      $($replicaStatus.myState) $(switch ($replicaStatus.myState) { 1 { '(PRIMARY)' } 2 { '(SECONDARY)' } 7 { '(ARBITER)' } default { '(OTHER)' } })" -ForegroundColor Green
        Write-Host "📊 Term:          $($replicaStatus.term)" -ForegroundColor Gray
        Write-Host "📊 Members:       $($replicaStatus.members.Count)" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "👥 Member Details:" -ForegroundColor Yellow
        foreach ($member in $replicaStatus.members) {
            $statusColor = switch ($member.stateStr) {
                "PRIMARY" { "Green" }
                "SECONDARY" { "Cyan" }
                "ARBITER" { "Yellow" }
                default { "Red" }
            }
            
            $emoji = switch ($member.stateStr) {
                "PRIMARY" { "[P]" }
                "SECONDARY" { "[S]" }
                "ARBITER" { "[A]" }
                default { "[?]" }
            }
            
            Write-Host "  $emoji Member $($member.id): $($member.name)" -ForegroundColor $statusColor
            Write-Host "    State:      $($member.stateStr) (health: $($member.health))" -ForegroundColor $statusColor
            Write-Host "    Priority:   $($member.priority)" -ForegroundColor Gray
            Write-Host "    Uptime:     $($member.uptime) seconds" -ForegroundColor Gray
            if ($member.pingMs) {
                Write-Host "    Ping:       $($member.pingMs) ms" -ForegroundColor Gray
            }
        }
    }
    elseif ($replicaStatus -and $replicaStatus.Error) {
        Write-Host "❌ Replica Set Error: $($replicaStatus.Error)" -ForegroundColor Red
    }
    else {
        Write-Host "❌ Could not get replica set status" -ForegroundColor Red
    }

    # Database Statistics
    if ($Detailed) {
        Write-Host ""
        Write-Host "💾 Database Statistics:" -ForegroundColor Cyan
        Write-Host "======================" -ForegroundColor Cyan
        
        # Social database
        $socialStats = Get-DatabaseStats "mongodb-social" "innkt_social"
        if ($socialStats) {
            Write-Host "📊 Social Database (innkt_social):" -ForegroundColor Yellow
            Write-Host "  Collections:  $($socialStats.collections)" -ForegroundColor Green
            Write-Host "  Objects:      $($socialStats.objects)" -ForegroundColor Green
            Write-Host "  Data Size:    $(Format-Bytes $socialStats.dataSize)" -ForegroundColor Green
            Write-Host "  Storage Size: $(Format-Bytes $socialStats.storageSize)" -ForegroundColor Green
            Write-Host "  Indexes:      $($socialStats.indexes)" -ForegroundColor Green
            Write-Host "  Index Size:   $(Format-Bytes $socialStats.indexSize)" -ForegroundColor Green
            
            if ($socialStats.collectionDetails) {
                Write-Host "  Collections Detail:" -ForegroundColor Gray
                foreach ($col in $socialStats.collectionDetails) {
                    Write-Host "    - $($col.name): $($col.count) documents" -ForegroundColor Gray
                }
            }
        }
        
        Write-Host ""
        
        # Messaging database
        $messagingStats = Get-DatabaseStats "mongodb-messaging" "innkt_messaging"
        if ($messagingStats) {
            Write-Host "📊 Messaging Database (innkt_messaging):" -ForegroundColor Yellow
            Write-Host "  Collections:  $($messagingStats.collections)" -ForegroundColor Green
            Write-Host "  Objects:      $($messagingStats.objects)" -ForegroundColor Green
            Write-Host "  Data Size:    $(Format-Bytes $messagingStats.dataSize)" -ForegroundColor Green
            Write-Host "  Storage Size: $(Format-Bytes $messagingStats.storageSize)" -ForegroundColor Green
            Write-Host "  Indexes:      $($messagingStats.indexes)" -ForegroundColor Green
            Write-Host "  Index Size:   $(Format-Bytes $messagingStats.indexSize)" -ForegroundColor Green
            
            if ($messagingStats.collectionDetails) {
                Write-Host "  Collections Detail:" -ForegroundColor Gray
                foreach ($col in $messagingStats.collectionDetails) {
                    Write-Host "    - $($col.name): $($col.count) documents" -ForegroundColor Gray
                }
            }
        }
    }

    # Connection Information
    Write-Host ""
    Write-Host "🔗 Connection Information:" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    Write-Host "Social Service:    mongodb://localhost:27018/innkt_social?replicaSet=rs0" -ForegroundColor White
    Write-Host "Messaging Service: mongodb://localhost:27017/innkt_messaging?replicaSet=rs0" -ForegroundColor White
}

# Function to show simple status
function Show-SimpleStatus {
    $socialContainer = Get-ContainerStatus "mongodb-social"
    $messagingContainer = Get-ContainerStatus "mongodb-messaging"
    $replicaStatus = Get-ReplicaSetStatus
    
    Write-Host ""
    Write-Host "📊 Quick Status:" -ForegroundColor Cyan
    
    # Container status
    $socialOk = $socialContainer -and $socialContainer.Status -eq "running" -and $socialContainer.Health -eq "healthy"
    $messagingOk = $messagingContainer -and $messagingContainer.Status -eq "running" -and $messagingContainer.Health -eq "healthy"
    
    Write-Host "  mongodb-social:    $(if ($socialOk) { 'Running' } else { 'Not Running' })" -ForegroundColor $(if ($socialOk) { "Green" } else { "Red" })
    Write-Host "  mongodb-messaging: $(if ($messagingOk) { 'Running' } else { 'Not Running' })" -ForegroundColor $(if ($messagingOk) { "Green" } else { "Red" })
    
    # Replica set status with nice formatting
    if ($replicaStatus -and -not $replicaStatus.Error) {
        Write-Host ""
        Write-Host "🔗 MongoDB Replica Set Status:" -ForegroundColor Cyan
        Write-Host "🎯 Replica Set: $($replicaStatus.set)" -ForegroundColor Green
        Write-Host "📊 Total Members: $($replicaStatus.members.Count)" -ForegroundColor Green
        
        $myStateText = switch ($replicaStatus.myState) {
            1 { "PRIMARY" }
            2 { "SECONDARY" }
            7 { "ARBITER" }
            default { "OTHER" }
        }
        Write-Host "🔧 My State: $myStateText" -ForegroundColor Green
        
        # Show member details
        foreach ($member in $replicaStatus.members) {
            $emoji = switch ($member.stateStr) {
                "PRIMARY" { "[P]" }
                "SECONDARY" { "[S]" }
                "ARBITER" { "[A]" }
                default { "[?]" }
            }
            Write-Host "$emoji Member $($member.id): $($member.name) ($($member.stateStr))" -ForegroundColor $(if ($member.stateStr -eq "PRIMARY") { "Green" } else { "Cyan" })
        }
        
        Write-Host ""
        Write-Host "CHANGE STREAMS READY: Both services can now use real-time updates!" -ForegroundColor Green
    }
    elseif ($replicaStatus -and $replicaStatus.Error) {
        Write-Host "  Replica Set:       Error: $($replicaStatus.Error)" -ForegroundColor Red
    }
    else {
        Write-Host "  Replica Set:       Not accessible" -ForegroundColor Red
    }
    
    # Overall health
    $overallOk = $socialOk -and $messagingOk -and $replicaStatus -and -not $replicaStatus.Error
    Write-Host ""
    Write-Host "Overall Status:   $(if ($overallOk) { 'HEALTHY - Change Streams Ready!' } else { 'ISSUES DETECTED' })" -ForegroundColor $(if ($overallOk) { "Green" } else { "Red" })
}

# Main execution
try {
    # Check prerequisites
    if (-not (Test-DockerRunning)) {
        Write-Host "Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
        exit 1
    }

    do {
        if ($Continuous) {
            Clear-Host
            Write-Host "MongoDB Replica Set Status Check (Continuous Mode)" -ForegroundColor Cyan
            Write-Host "Press Ctrl+C to exit" -ForegroundColor Gray
            Write-Host "Refresh every $RefreshInterval seconds" -ForegroundColor Gray
            Write-Host "===================================" -ForegroundColor Cyan
        }

        if ($Detailed) {
            Show-DetailedStatus
        } else {
            Show-SimpleStatus
        }

        if ($Continuous) {
            Write-Host ""
            Write-Host "Next refresh in $RefreshInterval seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds $RefreshInterval
        }

    } while ($Continuous)

    # Show helpful commands
    if (-not $Continuous) {
        Write-Host ""
        Write-Host "Useful Commands:" -ForegroundColor Yellow
        Write-Host "  Detailed status:    .\check-mongodb-status.ps1 -Detailed" -ForegroundColor White
        Write-Host "  Continuous monitor: .\check-mongodb-status.ps1 -Continuous" -ForegroundColor White
        Write-Host "  View logs:          docker-compose -f docker-compose-mongodb.yml logs" -ForegroundColor White
        Write-Host "  Restart:            .\start-mongodb-replica.ps1 -Force" -ForegroundColor White
    }

}
catch {
    Write-Host "Status check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
