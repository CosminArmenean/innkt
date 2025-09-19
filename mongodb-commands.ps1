# MongoDB Replica Set Quick Commands Reference
# This script provides quick access to common MongoDB operations

param(
    [Parameter(Position=0)]
    [ValidateSet("setup", "start", "stop", "status", "restart", "logs", "shell", "help")]
    [string]$Command = "help",
    
    [switch]$Force,
    [switch]$Detailed,
    [switch]$RemoveVolumes
)

function Show-Help {
    Write-Host "🚀 MongoDB Replica Set Quick Commands" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\mongodb-commands.ps1 <command> [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  setup     - Initial setup of MongoDB replica set" -ForegroundColor White
    Write-Host "  start     - Start MongoDB replica set (smart restart)" -ForegroundColor White
    Write-Host "  stop      - Stop MongoDB replica set" -ForegroundColor White
    Write-Host "  restart   - Force restart MongoDB replica set" -ForegroundColor White
    Write-Host "  status    - Check MongoDB replica set status" -ForegroundColor White
    Write-Host "  logs      - View MongoDB container logs" -ForegroundColor White
    Write-Host "  shell     - Open MongoDB shell (social instance)" -ForegroundColor White
    Write-Host "  help      - Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Force          - Force operation (for setup, start, restart)" -ForegroundColor White
    Write-Host "  -Detailed       - Show detailed information (for status)" -ForegroundColor White
    Write-Host "  -RemoveVolumes  - Remove data volumes (for stop)" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\mongodb-commands.ps1 setup" -ForegroundColor Gray
    Write-Host "  .\mongodb-commands.ps1 start" -ForegroundColor Gray
    Write-Host "  .\mongodb-commands.ps1 status -Detailed" -ForegroundColor Gray
    Write-Host "  .\mongodb-commands.ps1 restart -Force" -ForegroundColor Gray
    Write-Host "  .\mongodb-commands.ps1 stop -RemoveVolumes" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Connection Strings:" -ForegroundColor Cyan
    Write-Host "  Social:    mongodb://localhost:27018/innkt_social?replicaSet=rs0" -ForegroundColor White
    Write-Host "  Messaging: mongodb://localhost:27017/innkt_messaging?replicaSet=rs0" -ForegroundColor White
}

function Invoke-Setup {
    Write-Host "🚀 Running MongoDB Replica Set Setup..." -ForegroundColor Green
    if ($Force) {
        & ".\setup-mongodb-replica.ps1" -Force -Verbose
    } else {
        & ".\setup-mongodb-replica.ps1" -Verbose
    }
}

function Invoke-Start {
    Write-Host "▶️ Starting MongoDB Replica Set..." -ForegroundColor Green
    if ($Force) {
        & ".\start-mongodb-replica.ps1" -Force -Verbose
    } else {
        & ".\start-mongodb-replica.ps1" -Verbose
    }
}

function Invoke-Stop {
    Write-Host "⏹️ Stopping MongoDB Replica Set..." -ForegroundColor Red
    if ($RemoveVolumes) {
        & ".\stop-mongodb-replica.ps1" -RemoveVolumes -Verbose
    } else {
        & ".\stop-mongodb-replica.ps1" -Verbose
    }
}

function Invoke-Restart {
    Write-Host "🔄 Restarting MongoDB Replica Set..." -ForegroundColor Yellow
    & ".\start-mongodb-replica.ps1" -Force -Verbose
}

function Invoke-Status {
    Write-Host "📊 Checking MongoDB Replica Set Status..." -ForegroundColor Cyan
    if ($Detailed) {
        & ".\check-mongodb-status.ps1" -Detailed
    } else {
        & ".\check-mongodb-status.ps1"
    }
}

function Invoke-Logs {
    Write-Host "📋 Showing MongoDB Container Logs..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "=== MongoDB Social Logs ===" -ForegroundColor Yellow
    docker-compose -f docker-compose-mongodb.yml logs --tail=50 mongodb-social
    
    Write-Host ""
    Write-Host "=== MongoDB Messaging Logs ===" -ForegroundColor Yellow
    docker-compose -f docker-compose-mongodb.yml logs --tail=50 mongodb-messaging
    
    Write-Host ""
    Write-Host "=== Replica Set Init Logs ===" -ForegroundColor Yellow
    docker-compose -f docker-compose-mongodb.yml logs mongodb-replica-init
}

function Invoke-Shell {
    Write-Host "🐚 Opening MongoDB Shell (Social Instance)..." -ForegroundColor Cyan
    Write-Host "Connected to: mongodb://localhost:27018/innkt_social" -ForegroundColor Gray
    Write-Host "Type 'exit' to close the shell" -ForegroundColor Gray
    Write-Host ""
    
    try {
        docker exec -it mongodb-social mongosh innkt_social
    }
    catch {
        Write-Host "❌ Could not connect to MongoDB shell. Is the container running?" -ForegroundColor Red
        Write-Host "Try: .\mongodb-commands.ps1 status" -ForegroundColor Yellow
    }
}

# Main execution
switch ($Command.ToLower()) {
    "setup" { Invoke-Setup }
    "start" { Invoke-Start }
    "stop" { Invoke-Stop }
    "restart" { Invoke-Restart }
    "status" { Invoke-Status }
    "logs" { Invoke-Logs }
    "shell" { Invoke-Shell }
    "help" { Show-Help }
    default { 
        Write-Host "❌ Unknown command: $Command" -ForegroundColor Red
        Write-Host ""
        Show-Help
    }
}
