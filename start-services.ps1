# INNKT Platform - Start All Services Script
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
    }
    catch {
        Write-Host "Failed to start $ServiceName" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
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
    
    # Change to service directory
    Push-Location $Path
    
    try {
        # Start the service in a new cmd window
        if ($Command -like "*dotnet*") {
            Start-Process -FilePath "cmd" -ArgumentList "/c", "dotnet run && pause" -WindowStyle Normal
        } elseif ($Command -like "*npm*") {
            Start-Process -FilePath "cmd" -ArgumentList "/c", "npm start && pause" -WindowStyle Normal
        }
        
        Write-Host "$ServiceName started on port $Port in CMD window" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to start $ServiceName" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
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
Write-Host "`n🏗️  Starting Infrastructure First..." -ForegroundColor Cyan
Write-Host "This ensures databases and message brokers are ready before services start" -ForegroundColor Yellow

# Check if infrastructure is already running
Write-Host "`nChecking if infrastructure is running..." -ForegroundColor Yellow
try {
    $postgresTest = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet
    $redisTest = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet
    $mongodbTest = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet
    
    if ($postgresTest -and $redisTest -and $mongodbTest) {
        Write-Host "✅ Infrastructure is already running!" -ForegroundColor Green
    } else {
        Write-Host "❌ Infrastructure not running. Starting infrastructure..." -ForegroundColor Yellow
        Write-Host "Please run: .\start-infrastructure.ps1" -ForegroundColor Cyan
        Write-Host "Then run this script again." -ForegroundColor Cyan
        Write-Host "`nPress any key to exit..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
} catch {
    Write-Host "❌ Could not check infrastructure status. Please ensure infrastructure is running." -ForegroundColor Red
    Write-Host "Run: .\start-infrastructure.ps1" -ForegroundColor Cyan
    Write-Host "`nPress any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "`nStarting Backend Services..." -ForegroundColor Cyan

# Start backend services
Start-Service -ServiceName "Officer Service (Identity)" -Path "Backend\innkt.Officer" -Command "dotnet run" -Port 5001
Wait-ForService 8

Start-Service -ServiceName "Social Service (Posts & Groups)" -Path "Backend\innkt.Social" -Command "dotnet run" -Port 8081
Wait-ForService 8

Start-Service -ServiceName "Groups Service (Group Management)" -Path "Backend\innkt.Groups" -Command "dotnet run" -Port 5002
Wait-ForService 8

Start-Service -ServiceName "NeuroSpark Service (AI & Search)" -Path "Backend\innkt.NeuroSpark\innkt.NeuroSpark" -Command "dotnet run" -Port 5003
Wait-ForService 8

Start-Service -ServiceName "Seer Service (Video Calls)" -Path "Backend\innkt.Seer" -Command "dotnet run" -Port 5267
Wait-ForService 8

Start-Service -ServiceName "Frontier Service (API Gateway)" -Path "Backend\innkt.Frontier" -Command "dotnet run" -Port 51303
Wait-ForService 8

Write-Host "`nStarting Frontend Services in CMD Windows..." -ForegroundColor Cyan
Start-Service-In-Cmd -ServiceName "Messaging Service (Chat)" -Path "Backend\innkt.Messaging" -Command "npm start" -Port 3000
Wait-ForService 3

Start-Service-In-Cmd -ServiceName "React UI" -Path "Frontend\innkt.react" -Command "npm start" -Port 3001

Write-Host "`nAll Services Started!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
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
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
