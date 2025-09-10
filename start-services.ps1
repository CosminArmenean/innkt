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

# Wait between service starts
function Wait-ForService {
    param([int]$Seconds = 5)
    Write-Host "Waiting $Seconds seconds..." -ForegroundColor Cyan
    Start-Sleep -Seconds $Seconds
}

Write-Host "`nStarting Backend Services..." -ForegroundColor Cyan

# Start backend services
Start-Service -ServiceName "Officer Service (Identity)" -Path "Backend\innkt.Officer" -Command "dotnet run" -Port 5001
Wait-ForService 8

Start-Service -ServiceName "Social Service (Posts & Groups)" -Path "Backend\innkt.Social" -Command "dotnet run" -Port 8081
Wait-ForService 8

Start-Service -ServiceName "NeuroSpark Service (AI & Search)" -Path "Backend\innkt.NeuroSpark\innkt.NeuroSpark" -Command "dotnet run" -Port 5003
Wait-ForService 8

Start-Service -ServiceName "Messaging Service (Chat)" -Path "Backend\innkt.Messaging" -Command "npm start" -Port 3000
Wait-ForService 8

Start-Service -ServiceName "Seer Service (Video Calls)" -Path "Backend\innkt.Seer" -Command "dotnet run" -Port 5267
Wait-ForService 8

Start-Service -ServiceName "Frontier Service (API Gateway)" -Path "Backend\innkt.Frontier" -Command "dotnet run" -Port 51303
Wait-ForService 8

Write-Host "`nStarting Frontend..." -ForegroundColor Cyan
Start-Service -ServiceName "React UI" -Path "Frontend\innkt.react" -Command "npm start" -Port 3001

Write-Host "`nAll Services Started!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "• Officer Service (Identity):     http://localhost:5001" -ForegroundColor White
Write-Host "• Social Service (Posts/Groups):  http://localhost:8081" -ForegroundColor White
Write-Host "• NeuroSpark Service (AI):        http://localhost:5003" -ForegroundColor White
Write-Host "• Messaging Service (Chat):       http://localhost:3000" -ForegroundColor White
Write-Host "• Seer Service (Video Calls):     http://localhost:5267" -ForegroundColor White
Write-Host "• Frontier Service (API Gateway): http://localhost:51303" -ForegroundColor White
Write-Host "• React UI:                       http://localhost:3001" -ForegroundColor White
Write-Host "`nNote: Services are running in background windows" -ForegroundColor Yellow
Write-Host "Check individual windows for any error messages" -ForegroundColor Yellow

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
