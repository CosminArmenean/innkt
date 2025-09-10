# INNKT Platform - Complete Infrastructure & Services Startup Script
# This script starts all infrastructure components and services in the correct order

Write-Host "🚀 Starting INNKT Platform - Complete Infrastructure & Services" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# Function to check if a port is available
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Function to wait for a service to be ready
function Wait-ForService {
    param(
        [string]$ServiceName,
        [int]$Port,
        [int]$MaxWaitSeconds = 30
    )
    
    Write-Host "Waiting for $ServiceName to be ready on port $Port..." -ForegroundColor Yellow
    $waited = 0
    
    while ($waited -lt $MaxWaitSeconds) {
        if (Test-Port -Port $Port) {
            Write-Host "✅ $ServiceName is ready!" -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 2
        $waited += 2
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
    
    Write-Host "`n❌ $ServiceName failed to start within $MaxWaitSeconds seconds" -ForegroundColor Red
    return $false
}

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
        } elseif ($Command -like "*node*") {
            Start-Process -FilePath "node" -ArgumentList $Command.Split(' ')[1..($Command.Split(' ').Length-1)] -WindowStyle Minimized
        }
        
        Write-Host "✅ $ServiceName started on port $Port" -ForegroundColor Green
        
        if ($WaitForReady) {
            Wait-ForService -ServiceName $ServiceName -Port $Port
        }
    }
    catch {
        Write-Host "❌ Failed to start $ServiceName" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}

Write-Host "`n🗄️  Starting Infrastructure Components..." -ForegroundColor Cyan

# 1. Start PostgreSQL (if not already running)
Write-Host "`nChecking PostgreSQL..." -ForegroundColor Yellow
if (-not (Test-Port -Port 5432)) {
    Write-Host "Starting PostgreSQL..." -ForegroundColor Yellow
    # Try to start PostgreSQL service
    try {
        Start-Service -Name "postgresql-x64-14" -ErrorAction SilentlyContinue
        Wait-ForService -ServiceName "PostgreSQL" -Port 5432 -MaxWaitSeconds 15
    }
    catch {
        Write-Host "⚠️  PostgreSQL might not be installed or running. Please start it manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ PostgreSQL is already running" -ForegroundColor Green
}

# 2. Start MongoDB (if not already running)
Write-Host "`nChecking MongoDB..." -ForegroundColor Yellow
if (-not (Test-Port -Port 27017)) {
    Write-Host "Starting MongoDB..." -ForegroundColor Yellow
    try {
        Start-Service -Name "MongoDB" -ErrorAction SilentlyContinue
        Wait-ForService -ServiceName "MongoDB" -Port 27017 -MaxWaitSeconds 15
    }
    catch {
        Write-Host "⚠️  MongoDB might not be installed or running. Please start it manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ MongoDB is already running" -ForegroundColor Green
}

# 3. Start Redis (if not already running)
Write-Host "`nChecking Redis..." -ForegroundColor Yellow
if (-not (Test-Port -Port 6379)) {
    Write-Host "Starting Redis..." -ForegroundColor Yellow
    try {
        # Try to start Redis server
        Start-Process -FilePath "redis-server" -WindowStyle Minimized -ErrorAction SilentlyContinue
        Wait-ForService -ServiceName "Redis" -Port 6379 -MaxWaitSeconds 10
    }
    catch {
        Write-Host "⚠️  Redis might not be installed or running. Please start it manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Redis is already running" -ForegroundColor Green
}

Write-Host "`n📦 Starting Backend Services..." -ForegroundColor Cyan

# 4. Officer Service (Identity & Authentication) - Port 8080
Start-Service -ServiceName "Officer Service (Identity)" -Path "Backend\innkt.Officer" -Command "dotnet run" -Port 8080 -WaitForReady $true

# 5. Social Service (Posts, Comments, Likes, Groups, Follows) - Port 8081
Start-Service -ServiceName "Social Service (Posts & Groups)" -Path "Backend\innkt.Social" -Command "dotnet run" -Port 8081 -WaitForReady $true

# 6. NeuroSpark Service (AI & Search) - Port 5003
Start-Service -ServiceName "NeuroSpark Service (AI & Search)" -Path "Backend\innkt.NeuroSpark\innkt.NeuroSpark" -Command "dotnet run" -Port 5003 -WaitForReady $true

# 7. Messaging Service (Real-time Chat) - Port 3000
Start-Service -ServiceName "Messaging Service (Chat)" -Path "Backend\innkt.Messaging" -Command "npm start" -Port 3000 -WaitForReady $true

# 8. Seer Service (Video Calls & WebRTC) - Port 5267
Start-Service -ServiceName "Seer Service (Video Calls)" -Path "Backend\innkt.Seer" -Command "dotnet run" -Port 5267 -WaitForReady $true

# 9. Frontier Service (API Gateway) - Port 51303
Start-Service -ServiceName "Frontier Service (API Gateway)" -Path "Backend\innkt.Frontier" -Command "dotnet run" -Port 51303 -WaitForReady $true

Write-Host "`n🌐 Starting Frontend..." -ForegroundColor Cyan

# 10. React UI - Port 3001 (to avoid conflict with Messaging on 3000)
Start-Service -ServiceName "React UI" -Path "Frontend\innkt.react" -Command "npm start" -Port 3001 -WaitForReady $true

Write-Host "`n🎉 Complete INNKT Platform Started!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "Infrastructure:" -ForegroundColor Cyan
Write-Host "• PostgreSQL Database:     localhost:5432" -ForegroundColor White
Write-Host "• MongoDB Database:        localhost:27017" -ForegroundColor White
Write-Host "• Redis Cache:             localhost:6379" -ForegroundColor White
Write-Host "`nBackend Services:" -ForegroundColor Cyan
Write-Host "• Officer Service (Identity):     http://localhost:8080" -ForegroundColor White
Write-Host "• Social Service (Posts/Groups):  http://localhost:8081" -ForegroundColor White
Write-Host "• NeuroSpark Service (AI):        http://localhost:5003" -ForegroundColor White
Write-Host "• Messaging Service (Chat):       http://localhost:3000" -ForegroundColor White
Write-Host "• Seer Service (Video Calls):     http://localhost:5267" -ForegroundColor White
Write-Host "• Frontier Service (API Gateway): http://localhost:51303" -ForegroundColor White
Write-Host "`nFrontend:" -ForegroundColor Cyan
Write-Host "• React UI:                       http://localhost:3001" -ForegroundColor White
Write-Host "`n🔗 API Gateway Routes:" -ForegroundColor Cyan
Write-Host "• All services accessible through: http://localhost:51303" -ForegroundColor White
Write-Host "`n💡 Note: Services are running in background windows" -ForegroundColor Yellow
Write-Host "💡 Check individual windows for any error messages" -ForegroundColor Yellow
Write-Host "Use the API Gateway for end-to-end testing" -ForegroundColor Yellow
Write-Host "Press any key to continue..." -ForegroundColor Gray
Read-Host
