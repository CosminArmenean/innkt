#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Simple script to stop INNKT infrastructure services
    
.DESCRIPTION
    This script stops all infrastructure services for INNKT platform:
    - PostgreSQL Database
    - Redis Cache
    - MongoDB (Social and Messaging)
    - Kafka Message Broker
    - Zookeeper
    - Kafka UI
    
.EXAMPLE
    .\stop-infra-simple.ps1
    
.NOTES
    Author: INNKT Team
    Date: 2024-10-09
#>

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INNKT Infrastructure Shutdown" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Stopping infrastructure services..." -ForegroundColor Yellow
Write-Host ""

try {
    # Stop all infrastructure services
    docker-compose -f docker-compose-infrastructure.yml -f docker-compose-mongodb.yml down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Infrastructure Stopped Successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "All infrastructure containers have been stopped and removed." -ForegroundColor White
        Write-Host ""
        Write-Host "To start again: .\start-infra-simple.ps1" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "ERROR: Failed to stop infrastructure services" -ForegroundColor Red
        Write-Host ""
        Write-Host "You can manually stop containers with:" -ForegroundColor Yellow
        Write-Host "docker stop \$(docker ps -q)" -ForegroundColor White
        Write-Host ""
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: An unexpected error occurred" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}

