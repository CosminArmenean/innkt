# INNKT Platform - Complete Platform Startup Script
# This script starts infrastructure (Docker) + all backend services + frontend

Write-Host "Starting INNKT Platform - Complete System" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

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

# Start infrastructure first
Write-Host "`nStarting Infrastructure (Docker Compose)..." -ForegroundColor Cyan
Write-Host "Starting PostgreSQL, Redis, MongoDB, Kafka, and Zookeeper..." -ForegroundColor Yellow

# Stop any existing containers
docker-compose down

# Start infrastructure
docker-compose up -d

# Wait for infrastructure to be ready
Write-Host "`nWaiting for infrastructure to be ready..." -ForegroundColor Yellow

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

# Wait for infrastructure services
$infrastructureServices = @(
    @{ Name = "PostgreSQL"; Port = 5432 },
    @{ Name = "Redis"; Port = 6379 },
    @{ Name = "MongoDB"; Port = 27017 },
    @{ Name = "Kafka"; Port = 9092 }
)

$infrastructureReady = $true
foreach ($service in $infrastructureServices) {
    if (-not (Wait-ForService -ServiceName $service.Name -Port $service.Port)) {
        $infrastructureReady = $false
    }
}

if (-not $infrastructureReady) {
    Write-Host "`nInfrastructure failed to start. Aborting." -ForegroundColor Red
    exit 1
}

Write-Host "`nStarting Backend Services..." -ForegroundColor Cyan

# Function to start a service in background
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$Path,
        [string]$Command,
        [int]$Port,
        [bool]$WaitForReady = $false
    )
    
    Write-Host "`nStarting $ServiceName..." -ForegroundColor Yellow
    
    # Change to service directory
    Push-Location $Path
    
    try {
        # Start the service in background
        if ($Command -like "*dotnet*") {
            Start-Process -FilePath "dotnet" -ArgumentList "run" -WindowStyle Minimized
        } elseif ($Command -like "*npm*") {
            Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Minimized
        }
        
        Write-Host "$ServiceName started on port $Port" -ForegroundColor Green
        
        if ($WaitForReady) {
            Wait-ForService -ServiceName $ServiceName -Port $Port -MaxWaitSeconds 30
        }
    }
    catch {
        Write-Host "Failed to start $ServiceName" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}

# Start backend services
Start-Service -ServiceName "Officer Service (Identity)" -Path "Backend\innkt.Officer" -Command "dotnet run" -Port 8080 -WaitForReady $true
Start-Service -ServiceName "Social Service (Posts & Groups)" -Path "Backend\innkt.Social" -Command "dotnet run" -Port 8081 -WaitForReady $true
Start-Service -ServiceName "NeuroSpark Service (AI & Search)" -Path "Backend\innkt.NeuroSpark\innkt.NeuroSpark" -Command "dotnet run" -Port 5003 -WaitForReady $true
Start-Service -ServiceName "Messaging Service (Chat)" -Path "Backend\innkt.Messaging" -Command "npm start" -Port 3000 -WaitForReady $true
Start-Service -ServiceName "Seer Service (Video Calls)" -Path "Backend\innkt.Seer" -Command "dotnet run" -Port 5267 -WaitForReady $true
Start-Service -ServiceName "Frontier Service (API Gateway)" -Path "Backend\innkt.Frontier" -Command "dotnet run" -Port 51303 -WaitForReady $true

Write-Host "`nStarting Frontend..." -ForegroundColor Cyan
Start-Service -ServiceName "React UI" -Path "Frontend\innkt.react" -Command "npm start" -Port 3001 -WaitForReady $true

Write-Host "`nComplete INNKT Platform Started!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Infrastructure (Docker):" -ForegroundColor Cyan
Write-Host "• PostgreSQL Database:     localhost:5432" -ForegroundColor White
Write-Host "• Redis Cache:             localhost:6379" -ForegroundColor White
Write-Host "• MongoDB Database:        localhost:27017" -ForegroundColor White
Write-Host "• Kafka Message Broker:    localhost:9092" -ForegroundColor White
Write-Host "• Zookeeper:               localhost:2181" -ForegroundColor White
Write-Host "• Kafka UI (Monitoring):   http://localhost:8080" -ForegroundColor White
Write-Host "`nBackend Services:" -ForegroundColor Cyan
Write-Host "• Officer Service (Identity):     http://localhost:8080" -ForegroundColor White
Write-Host "• Social Service (Posts/Groups):  http://localhost:8081" -ForegroundColor White
Write-Host "• NeuroSpark Service (AI):        http://localhost:5003" -ForegroundColor White
Write-Host "• Messaging Service (Chat):       http://localhost:3000" -ForegroundColor White
Write-Host "• Seer Service (Video Calls):     http://localhost:5267" -ForegroundColor White
Write-Host "• Frontier Service (API Gateway): http://localhost:51303" -ForegroundColor White
Write-Host "`nFrontend:" -ForegroundColor Cyan
Write-Host "• React UI:                       http://localhost:3001" -ForegroundColor White
Write-Host "`nAPI Gateway Routes:" -ForegroundColor Cyan
Write-Host "• All services accessible through: http://localhost:51303" -ForegroundColor White
Write-Host "`nNote: Services are running in background windows" -ForegroundColor Yellow
Write-Host "Check individual windows for any error messages" -ForegroundColor Yellow
Write-Host "Use the API Gateway for end-to-end testing" -ForegroundColor Yellow

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")