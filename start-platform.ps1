# INNKT Platform Startup Script
Write-Host "Starting INNKT Platform..." -ForegroundColor Green

# Start Infrastructure
Write-Host "Starting infrastructure..." -ForegroundColor Yellow
docker-compose down 2>$null
docker-compose up -d

Write-Host "Waiting for infrastructure..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check infrastructure
Write-Host "Checking infrastructure..." -ForegroundColor Cyan
$ports = @(5432, 6379, 27017, 9092, 2181)
$services = @("PostgreSQL", "Redis", "MongoDB", "Kafka", "Zookeeper")

for ($i = 0; $i -lt $ports.Count; $i++) {
    $port = $ports[$i]
    $service = $services[$i]
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $port)
        $tcpClient.Close()
        Write-Host "$service (port $port) - Ready" -ForegroundColor Green
    } catch {
        Write-Host "$service (port $port) - Not ready" -ForegroundColor Red
    }
}

# Start Backend Services
Write-Host "Starting backend services..." -ForegroundColor Yellow

# Officer Service
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\cosmi\source\repos\innkt\Backend\innkt.Officer'; dotnet run" -WindowStyle Minimized

# Social Service  
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\cosmi\source\repos\innkt\Backend\innkt.Social'; dotnet run" -WindowStyle Minimized

# Messaging Service
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\cosmi\source\repos\innkt\Backend\innkt.Messaging'; npm start" -WindowStyle Minimized

Write-Host "Waiting for backend services..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Check backend services
Write-Host "Checking backend services..." -ForegroundColor Cyan
$backendPorts = @(5001, 8081, 3000)
$backendServices = @("Officer", "Social", "Messaging")

for ($i = 0; $i -lt $backendPorts.Count; $i++) {
    $port = $backendPorts[$i]
    $service = $backendServices[$i]
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $port)
        $tcpClient.Close()
        Write-Host "$service (port $port) - Ready" -ForegroundColor Green
    } catch {
        Write-Host "$service (port $port) - Not ready" -ForegroundColor Red
    }
}

# Start Frontend
Write-Host "Starting frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\cosmi\source\repos\innkt\Frontend\innkt.react'; npm start" -WindowStyle Minimized

Write-Host "Waiting for frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check frontend
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 3001)
    $tcpClient.Close()
    Write-Host "Frontend (port 3001) - Ready" -ForegroundColor Green
} catch {
    Write-Host "Frontend (port 3001) - Not ready" -ForegroundColor Red
}

Write-Host "Platform startup complete!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Test messaging by logging in and going to Messages!" -ForegroundColor Yellow
