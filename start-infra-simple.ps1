# INNKT Infrastructure Startup Script
# Simple and reliable way to start all infrastructure services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INNKT Infrastructure Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1 | Select-String "Server Version"
if (-not $dockerRunning) {
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}
Write-Host "Docker is running" -ForegroundColor Green
Write-Host ""

# Start infrastructure services
Write-Host "Starting infrastructure services..." -ForegroundColor Yellow
Write-Host ""

docker-compose -f docker-compose-infrastructure.yml -f docker-compose-mongodb.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Infrastructure Started Successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Running Services:" -ForegroundColor Cyan
    Write-Host "- PostgreSQL:                localhost:5433" -ForegroundColor White
    Write-Host "- Redis:                     localhost:6379" -ForegroundColor White
    Write-Host "- MongoDB Social (Replica):  localhost:27018" -ForegroundColor White
    Write-Host "- MongoDB Messaging (Solo):  localhost:27017" -ForegroundColor White
    Write-Host "- Kafka:                     localhost:9092" -ForegroundColor White
    Write-Host "- Zookeeper:                 localhost:2181" -ForegroundColor White
    Write-Host "- Kafka UI:                  http://localhost:8080" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "- Start backend: .\start-services.ps1" -ForegroundColor White
    Write-Host "- View status:   docker ps" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to start infrastructure" -ForegroundColor Red
    Write-Host "Check logs: docker-compose -f docker-compose-infrastructure.yml logs" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
