# INNKT Platform - Start All Services Script
# This script starts all backend services and the React UI

Write-Host "🚀 Starting INNKT Platform - All Services" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Function to start a service in background
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$Path,
        [string]$Command,
        [int]$Port
    )
    
    Write-Host "Starting $ServiceName..." -ForegroundColor Yellow
    
    # Change to service directory
    Push-Location $Path
    
    try {
        # Start the service in background
        if ($Command -like "*dotnet*") {
            Start-Process -FilePath "dotnet" -ArgumentList "run" -WindowStyle Minimized
        } elseif ($Command -like "*npm*") {
            Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Minimized
        } elseif ($Command -like "*node*") {
            Start-Process -FilePath "node" -ArgumentList $Command.Split(' ')[1..($Command.Split(' ').Length-1)] -WindowStyle Minimized
        }
        
        Write-Host "✅ $ServiceName started on port $Port" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to start $ServiceName" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}

# Wait a moment between service starts
function Wait-ForService {
    param([int]$Seconds = 3)
    Write-Host "Waiting $Seconds seconds..." -ForegroundColor Cyan
    Start-Sleep -Seconds $Seconds
}

# Start all services
Write-Host "`n📦 Starting Backend Services..." -ForegroundColor Cyan

# 1. Officer Service (Identity & Authentication) - Port 8080
Start-Service -ServiceName "Officer Service (Identity)" -Path "Backend\innkt.Officer" -Command "dotnet run" -Port 8080
Wait-ForService 5

# 2. Social Service (Posts, Comments, Likes, Groups, Follows) - Port 8081
Start-Service -ServiceName "Social Service (Posts & Groups)" -Path "Backend\innkt.Social" -Command "dotnet run" -Port 8081
Wait-ForService 5

# 3. NeuroSpark Service (AI & Search) - Port 5003
Start-Service -ServiceName "NeuroSpark Service (AI & Search)" -Path "Backend\innkt.NeuroSpark\innkt.NeuroSpark" -Command "dotnet run" -Port 5003
Wait-ForService 5

# 4. Messaging Service (Real-time Chat) - Port 3000
Start-Service -ServiceName "Messaging Service (Chat)" -Path "Backend\innkt.Messaging" -Command "npm start" -Port 3000
Wait-ForService 5

# 5. Seer Service (Video Calls & WebRTC) - Port 5267
Start-Service -ServiceName "Seer Service (Video Calls)" -Path "Backend\innkt.Seer" -Command "dotnet run" -Port 5267
Wait-ForService 5

# 6. Frontier Service (API Gateway) - Port 51303
Start-Service -ServiceName "Frontier Service (API Gateway)" -Path "Backend\innkt.Frontier" -Command "dotnet run" -Port 51303
Wait-ForService 5

Write-Host "`n🌐 Starting Frontend..." -ForegroundColor Cyan

# 7. React UI - Port 3000 (will conflict with Messaging, so we'll use 3001)
Start-Service -ServiceName "React UI" -Path "Frontend\innkt.react" -Command "npm start" -Port 3001

Write-Host "`n🎉 All services started!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "• Officer Service (Identity):     http://localhost:8080" -ForegroundColor White
Write-Host "• Social Service (Posts/Groups):  http://localhost:8081" -ForegroundColor White
Write-Host "• NeuroSpark Service (AI):        http://localhost:5003" -ForegroundColor White
Write-Host "• Messaging Service (Chat):       http://localhost:3000" -ForegroundColor White
Write-Host "• Seer Service (Video Calls):     http://localhost:5267" -ForegroundColor White
Write-Host "• Frontier Service (API Gateway): http://localhost:51303" -ForegroundColor White
Write-Host "• React UI:                       http://localhost:3001" -ForegroundColor White
Write-Host "`n💡 Note: Services are running in background windows" -ForegroundColor Yellow
Write-Host "💡 Check individual windows for any error messages" -ForegroundColor Yellow
Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
