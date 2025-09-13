# Complete INNKT Platform Startup Script
Write-Host "🚀 Starting Complete INNKT Platform" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Step 1: Start Infrastructure
Write-Host "`n📦 Step 1: Starting Infrastructure..." -ForegroundColor Cyan
Write-Host "Starting PostgreSQL, Redis, MongoDB, Kafka..." -ForegroundColor Yellow

# Stop existing containers
docker-compose down 2>$null

# Start infrastructure
docker-compose up -d

# Wait for infrastructure
Write-Host "⏳ Waiting for infrastructure to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check infrastructure
Write-Host "`n🔍 Checking Infrastructure Status:" -ForegroundColor Cyan
$infraPorts = @(5432, 6379, 27017, 9092, 2181)
$infraServices = @("PostgreSQL", "Redis", "MongoDB", "Kafka", "Zookeeper")
$infraReady = $true

for ($i = 0; $i -lt $infraPorts.Count; $i++) {
    $port = $infraPorts[$i]
    $service = $infraServices[$i]
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $port)
        $tcpClient.Close()
        Write-Host "✅ $service (port $port)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $service (port $port)" -ForegroundColor Red
        $infraReady = $false
    }
}

if (-not $infraReady) {
    Write-Host "`n⚠️ Some infrastructure services failed to start!" -ForegroundColor Red
    Write-Host "Please check Docker and try again." -ForegroundColor Yellow
    exit 1
}

# Step 2: Start Backend Services
Write-Host "`n🔧 Step 2: Starting Backend Services..." -ForegroundColor Cyan

# Start Officer Service (Auth)
Write-Host "Starting Officer Service (Authentication)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\cosmi\source\repos\innkt\Backend\innkt.Officer'; dotnet run" -WindowStyle Minimized

# Start Social Service
Write-Host "Starting Social Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\cosmi\source\repos\innkt\Backend\innkt.Social'; dotnet run" -WindowStyle Minimized

# Start Messaging Service
Write-Host "Starting Messaging Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\cosmi\source\repos\innkt\Backend\innkt.Messaging'; npm start" -WindowStyle Minimized

# Wait for backend services
Write-Host "`n⏳ Waiting for backend services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Check backend services
Write-Host "`n🔍 Checking Backend Services:" -ForegroundColor Cyan
$backendPorts = @(5001, 8081, 3000)
$backendServices = @("Officer (Auth)", "Social", "Messaging")
$backendReady = $true

for ($i = 0; $i -lt $backendPorts.Count; $i++) {
    $port = $backendPorts[$i]
    $service = $backendServices[$i]
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $port)
        $tcpClient.Close()
        Write-Host "✅ $service (port $port)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $service (port $port)" -ForegroundColor Red
        $backendReady = $false
    }
}

# Step 3: Start Frontend
Write-Host "`n🎨 Step 3: Starting Frontend..." -ForegroundColor Cyan
Write-Host "Starting React Application..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\cosmi\source\repos\innkt\Frontend\innkt.react'; npm start" -WindowStyle Minimized

# Wait for frontend
Write-Host "`n⏳ Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check frontend
Write-Host "`n🔍 Checking Frontend:" -ForegroundColor Cyan
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 3001)
    $tcpClient.Close()
    Write-Host "✅ React Frontend (port 3001)" -ForegroundColor Green
} catch {
    Write-Host "❌ React Frontend (port 3001)" -ForegroundColor Red
    $backendReady = $false
}

# Final Status
Write-Host "`n🎉 Platform Startup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

if ($infraReady -and $backendReady) {
    Write-Host "✅ All services are running!" -ForegroundColor Green
    Write-Host "`n🌐 Access URLs:" -ForegroundColor Cyan
    Write-Host "• Frontend:        http://localhost:3001" -ForegroundColor White
    Write-Host "• Auth API:        http://localhost:5001" -ForegroundColor White
    Write-Host "• Social API:      http://localhost:8081" -ForegroundColor White
    Write-Host "• Messaging API:   http://localhost:3000" -ForegroundColor White
    Write-Host "• Kafka UI:        http://localhost:8080" -ForegroundColor White
    Write-Host "`nTest the messaging system by logging in and going to Messages!" -ForegroundColor Yellow
} else {
    Write-Host "Some services may not be running properly." -ForegroundColor Yellow
    Write-Host "Check the individual service windows for errors." -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
Read-Host "Press Enter to continue"
