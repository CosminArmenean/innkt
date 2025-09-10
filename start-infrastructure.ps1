# INNKT Platform - Infrastructure Startup Script
# This script starts all infrastructure components using Docker Compose

Write-Host "🚀 Starting INNKT Platform Infrastructure" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if Docker is running
Write-Host "`n🐳 Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker is available: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running or not installed!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is available
Write-Host "`n📦 Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose is available: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available!" -ForegroundColor Red
    Write-Host "Please install Docker Compose and try again." -ForegroundColor Yellow
    exit 1
}

# Stop any existing containers
Write-Host "`n🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Start infrastructure
Write-Host "`n🗄️  Starting Infrastructure Components..." -ForegroundColor Cyan
Write-Host "Starting PostgreSQL, Redis, MongoDB, Kafka, and Zookeeper..." -ForegroundColor Yellow

# Start all infrastructure services
docker-compose up -d

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
            Write-Host " ✅ Ready!" -ForegroundColor Green
            return $true
        }
        catch {
            Start-Sleep -Seconds 2
            $waited += 2
            Write-Host "." -NoNewline -ForegroundColor Yellow
        }
    }
    
    Write-Host " ❌ Timeout!" -ForegroundColor Red
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
Write-Host "`n📊 Container Status:" -ForegroundColor Cyan
docker-compose ps

if ($allReady) {
    Write-Host "`n🎉 Infrastructure is ready!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Infrastructure Components:" -ForegroundColor Cyan
    Write-Host "• PostgreSQL Database:     localhost:5432" -ForegroundColor White
    Write-Host "• Redis Cache:             localhost:6379" -ForegroundColor White
    Write-Host "• MongoDB Database:        localhost:27017" -ForegroundColor White
    Write-Host "• Kafka Message Broker:    localhost:9092" -ForegroundColor White
    Write-Host "• Zookeeper:               localhost:2181" -ForegroundColor White
    Write-Host "• Kafka UI (Monitoring):   http://localhost:8080" -ForegroundColor White
    Write-Host "`n💡 You can now start the backend services!" -ForegroundColor Yellow
} else {
    Write-Host "`n⚠️  Some services failed to start. Check the logs:" -ForegroundColor Yellow
    Write-Host "docker-compose logs" -ForegroundColor Gray
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
