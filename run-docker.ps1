# PowerShell script to run innkt platform with Docker Compose
param(
    [string]$Environment = "production",
    [switch]$Build = $false,
    [switch]$Detach = $true,
    [switch]$RemoveOrphans = $false,
    [switch]$ForceRecreate = $false,
    [switch]$Logs = $false,
    [switch]$Stop = $false,
    [switch]$Down = $false,
    [switch]$Clean = $false
)

Write-Host "🐳 Running innkt Platform with Docker Compose" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Function to run Docker Compose command
function Run-DockerCompose {
    param(
        [string]$Command,
        [array]$Args = @()
    )
    
    $composeFile = if ($Environment -eq "development") { "docker-compose.dev.yml" } else { "docker-compose.yml" }
    $composeArgs = @("-f", $composeFile)
    
    if ($Environment -eq "development") {
        $composeArgs += "-f", "docker-compose.yml"
    }
    
    $composeArgs += $Command
    $composeArgs += $Args
    
    Write-Host "`n🚀 Running: docker-compose $($composeArgs -join ' ')" -ForegroundColor Cyan
    
    try {
        $result = & docker-compose $composeArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Command completed successfully!" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Command failed!" -ForegroundColor Red
            return $false
        }
        
    } catch {
        Write-Host "💥 Error running command: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to show service status
function Show-ServiceStatus {
    Write-Host "`n📊 Service Status:" -ForegroundColor Yellow
    Write-Host "=================" -ForegroundColor Yellow
    
    try {
        $composeFile = if ($Environment -eq "development") { "docker-compose.dev.yml" } else { "docker-compose.yml" }
        $composeArgs = @("-f", $composeFile)
        
        if ($Environment -eq "development") {
            $composeArgs += "-f", "docker-compose.yml"
        }
        
        $composeArgs += "ps"
        
        & docker-compose $composeArgs
        
    } catch {
        Write-Host "💥 Error getting service status: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to show logs
function Show-Logs {
    param(
        [string]$Service = ""
    )
    
    Write-Host "`n📋 Service Logs:" -ForegroundColor Yellow
    Write-Host "===============" -ForegroundColor Yellow
    
    try {
        $composeFile = if ($Environment -eq "development") { "docker-compose.dev.yml" } else { "docker-compose.yml" }
        $composeArgs = @("-f", $composeFile)
        
        if ($Environment -eq "development") {
            $composeArgs += "-f", "docker-compose.yml"
        }
        
        $composeArgs += "logs"
        
        if ($Service) {
            $composeArgs += $Service
        }
        
        & docker-compose $composeArgs
        
    } catch {
        Write-Host "💥 Error getting logs: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main execution logic
if ($Down) {
    Write-Host "Stopping and removing containers..." -ForegroundColor Yellow
    $success = Run-DockerCompose -Command "down" -Args @()
    
    if ($RemoveOrphans) {
        $success = Run-DockerCompose -Command "down" -Args @("--remove-orphans")
    }
    
    if ($success) {
        Write-Host "✅ Platform stopped successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to stop platform!" -ForegroundColor Red
        exit 1
    }
    
} elseif ($Stop) {
    Write-Host "Stopping containers..." -ForegroundColor Yellow
    $success = Run-DockerCompose -Command "stop" -Args @()
    
    if ($success) {
        Write-Host "✅ Platform stopped successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to stop platform!" -ForegroundColor Red
        exit 1
    }
    
} elseif ($Clean) {
    Write-Host "Cleaning up Docker resources..." -ForegroundColor Yellow
    
    # Stop and remove containers
    Run-DockerCompose -Command "down" -Args @("--remove-orphans")
    
    # Remove unused images
    & docker image prune -f
    
    # Remove unused volumes
    & docker volume prune -f
    
    # Remove unused networks
    & docker network prune -f
    
    Write-Host "✅ Cleanup completed!" -ForegroundColor Green
    
} elseif ($Logs) {
    Show-Logs
    
} else {
    # Start the platform
    Write-Host "Starting innkt platform..." -ForegroundColor Yellow
    Write-Host "Environment: $Environment" -ForegroundColor White
    Write-Host "Build: $Build" -ForegroundColor White
    Write-Host "Detach: $Detach" -ForegroundColor White
    Write-Host "Force Recreate: $ForceRecreate" -ForegroundColor White
    Write-Host ""
    
    $args = @()
    
    if ($Build) {
        $args += "--build"
    }
    
    if ($Detach) {
        $args += "-d"
    }
    
    if ($ForceRecreate) {
        $args += "--force-recreate"
    }
    
    if ($RemoveOrphans) {
        $args += "--remove-orphans"
    }
    
    $success = Run-DockerCompose -Command "up" -Args $args
    
    if ($success) {
        Write-Host "✅ Platform started successfully!" -ForegroundColor Green
        
        # Show service status
        Show-ServiceStatus
        
        # Show access information
        Write-Host "`nAccess Information:" -ForegroundColor Yellow
        Write-Host "=====================" -ForegroundColor Yellow
        
        if ($Environment -eq "development") {
            Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
            Write-Host "  Officer API: http://localhost:5000" -ForegroundColor White
            Write-Host "  Messaging API: http://localhost:3001" -ForegroundColor White
            Write-Host "  NeuroSpark API: http://localhost:5001" -ForegroundColor White
            Write-Host "  Seer API: http://localhost:5002" -ForegroundColor White
            Write-Host "  Kafka UI: http://localhost:8080" -ForegroundColor White
            Write-Host "  Redis Commander: http://localhost:8081" -ForegroundColor White
            Write-Host "  MongoDB Express: http://localhost:8082" -ForegroundColor White
        } else {
            Write-Host "  Frontend: https://localhost" -ForegroundColor White
            Write-Host "  API: https://localhost/api" -ForegroundColor White
            Write-Host "  WebSocket: wss://localhost/ws" -ForegroundColor White
        }
        
        Write-Host "`nUseful Commands:" -ForegroundColor Yellow
        Write-Host "===================" -ForegroundColor Yellow
        Write-Host "  View logs: ./run-docker.ps1 -Logs" -ForegroundColor White
        Write-Host "  Stop platform: ./run-docker.ps1 -Stop" -ForegroundColor White
        Write-Host "  Stop and remove: ./run-docker.ps1 -Down" -ForegroundColor White
        Write-Host "  Clean up: ./run-docker.ps1 -Clean" -ForegroundColor White
        
    } else {
        Write-Host "❌ Failed to start platform!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`nDocker Compose operation completed!" -ForegroundColor Green
