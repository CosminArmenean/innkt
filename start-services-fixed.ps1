# INNKT Platform - Start All Services Script (FIXED)
# This script starts all backend services and the React UI

Write-Host "Starting INNKT Platform Services" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Function to start a service in background
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$Path,
        [string]$Command,
        [int]$Port
    )
    
    Write-Host "`nStarting $ServiceName..." -ForegroundColor Yellow
    Write-Host "Path: $Path" -ForegroundColor Gray
    
    # Check if directory exists
    if (-not (Test-Path $Path)) {
        Write-Host "Directory not found: $Path" -ForegroundColor Red
        return $false
    }
    
    # Change to service directory
    Push-Location $Path
    
    try {
        # Build the service first
        Write-Host "Building $ServiceName..." -ForegroundColor Cyan
        $buildResult = & dotnet build 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Build failed for $ServiceName" -ForegroundColor Red
            Write-Host $buildResult -ForegroundColor Red
            return $false
        }
        Write-Host "Build successful" -ForegroundColor Green
        
        # Start the service in background
        if ($Command -like "*dotnet*") {
            Start-Process -FilePath "dotnet" -ArgumentList "run" -WindowStyle Minimized
        } elseif ($Command -like "*npm*") {
            Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Minimized
        }
        
        Write-Host "$ServiceName started on port $Port" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Failed to start $ServiceName" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

# Function to start a service in cmd window
function Start-Service-In-Cmd {
    param(
        [string]$ServiceName,
        [string]$Path,
        [string]$Command,
        [int]$Port
    )
    
    Write-Host "`nStarting $ServiceName in CMD window..." -ForegroundColor Yellow
    Write-Host "Path: $Path" -ForegroundColor Gray
    
    # Check if directory exists
    if (-not (Test-Path $Path)) {
        Write-Host "Directory not found: $Path" -ForegroundColor Red
        return $false
    }
    
    # Change to service directory
    Push-Location $Path
    
    try {
        # Build the service first
        Write-Host "Building $ServiceName..." -ForegroundColor Cyan
        $buildResult = & dotnet build 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Build failed for $ServiceName" -ForegroundColor Red
            Write-Host $buildResult -ForegroundColor Red
            return $false
        }
        Write-Host "Build successful" -ForegroundColor Green
        
        # Start the service in a new cmd window
        if ($Command -like "*dotnet*") {
            Start-Process -FilePath "cmd" -ArgumentList "/c", "dotnet run && pause" -WindowStyle Normal
        } elseif ($Command -like "*npm*") {
            Start-Process -FilePath "cmd" -ArgumentList "/c", "npm start && pause" -WindowStyle Normal
        }
        
        Write-Host "$ServiceName started on port $Port in CMD window" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Failed to start $ServiceName" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

# Wait between service starts
function Wait-ForService {
    param([int]$Seconds = 5)
    Write-Host "Waiting $Seconds seconds..." -ForegroundColor Cyan
    Start-Sleep -Seconds $Seconds
}

# First, start infrastructure
Write-Host "`nStarting Infrastructure First..." -ForegroundColor Cyan
Write-Host "This ensures databases and message brokers are ready before services start" -ForegroundColor Yellow

# Check if infrastructure is already running
Write-Host "`nChecking if infrastructure is running..." -ForegroundColor Yellow
try {
    $postgresTest = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet
    $redisTest = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet
    $mongodbTest = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet
    
    if ($postgresTest -and $redisTest -and $mongodbTest) {
        Write-Host "Infrastructure is already running!" -ForegroundColor Green
    } else {
        Write-Host "Infrastructure not running. Starting infrastructure..." -ForegroundColor Yellow
        Write-Host "Please run: docker-compose -f docker-compose-infrastructure.yml up -d" -ForegroundColor Cyan
        Write-Host "Then run this script again." -ForegroundColor Cyan
        Write-Host "`nPress any key to exit..." -ForegroundColor Gray
        Read-Host
        exit 1
    }
} catch {
    Write-Host "Could not check infrastructure status. Please ensure infrastructure is running." -ForegroundColor Red
    Write-Host "Run: docker-compose -f docker-compose-infrastructure.yml up -d" -ForegroundColor Cyan
    Write-Host "`nPress any key to exit..." -ForegroundColor Gray
    Read-Host
    exit 1
}

Write-Host "`nStarting Backend Services..." -ForegroundColor Cyan

# Start backend services
$services = @(
    @{ Name = "Officer Service (Identity)"; Path = "Backend\innkt.Officer"; Command = "dotnet run"; Port = 5001 },
    @{ Name = "Social Service (Posts & Groups)"; Path = "Backend\innkt.Social"; Command = "dotnet run"; Port = 8081 },
    @{ Name = "Groups Service (Group Management)"; Path = "Backend\innkt.Groups"; Command = "dotnet run"; Port = 5002 },
    @{ Name = "NeuroSpark Service (AI & Search)"; Path = "Backend\innkt.NeuroSpark\innkt.NeuroSpark"; Command = "dotnet run"; Port = 5003 },
    @{ Name = "Seer Service (Video Calls)"; Path = "Backend\innkt.Seer"; Command = "dotnet run"; Port = 5267 },
    @{ Name = "Frontier Service (API Gateway)"; Path = "Backend\innkt.Frontier"; Command = "dotnet run"; Port = 51303 }
)

$results = @()
foreach ($service in $services) {
    $result = Start-Service -ServiceName $service.Name -Path $service.Path -Command $service.Command -Port $service.Port
    $results += @{ Service = $service.Name; Success = $result }
    Wait-ForService 8
}

Write-Host "`nStarting Frontend Services in CMD Windows..." -ForegroundColor Cyan
$frontendResults = @()

$frontendResults += Start-Service-In-Cmd -ServiceName "Messaging Service (Chat)" -Path "Backend\innkt.Messaging" -Command "npm start" -Port 3000
Wait-ForService 3

$frontendResults += Start-Service-In-Cmd -ServiceName "React UI" -Path "Frontend\innkt.react" -Command "npm start" -Port 3001

# Wait for all services to start
Write-Host "`nWaiting for all services to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# Check final status
Write-Host "`nChecking service status..." -ForegroundColor Cyan
$allPorts = @(5001, 8081, 5002, 5003, 5267, 51303, 3000, 3001)
$allServices = @("Officer", "Social", "Groups", "NeuroSpark", "Seer", "Frontier", "Messaging", "React UI")
$runningCount = 0

for ($i = 0; $i -lt $allPorts.Count; $i++) {
    $port = $allPorts[$i]
    $service = $allServices[$i]
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $port)
        $tcpClient.Close()
        Write-Host "$service (port $port) - Running" -ForegroundColor Green
        $runningCount++
    } catch {
        Write-Host "$service (port $port) - Not running" -ForegroundColor Red
    }
}

Write-Host "`nAll Services Started!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "Running: $runningCount out of 8 services" -ForegroundColor Cyan
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "• Officer Service (Identity):     http://localhost:5001" -ForegroundColor White
Write-Host "• Social Service (Posts/Groups):  http://localhost:8081" -ForegroundColor White
Write-Host "• Groups Service (Group Mgmt):    http://localhost:5002" -ForegroundColor White
Write-Host "• NeuroSpark Service (AI):        http://localhost:5003" -ForegroundColor White
Write-Host "• Messaging Service (Chat):       http://localhost:3000" -ForegroundColor White
Write-Host "• Seer Service (Video Calls):     http://localhost:5267" -ForegroundColor White
Write-Host "• Frontier Service (API Gateway): http://localhost:51303" -ForegroundColor White
Write-Host "• React UI:                       http://localhost:3001" -ForegroundColor White
Write-Host "`nNote: Backend services run in background, Messaging and React UI run in CMD windows" -ForegroundColor Yellow
Write-Host "Check CMD windows for Messaging and React UI logs" -ForegroundColor Yellow
Write-Host "Check background windows for backend service logs" -ForegroundColor Yellow

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
Read-Host
