# Simple Services Test
Write-Host "Testing Services Startup..." -ForegroundColor Green

# Test Groups Service
Write-Host "`nTesting Groups Service..." -ForegroundColor Yellow
cd "Backend\innkt.Groups"
Write-Host "Building Groups Service..." -ForegroundColor Cyan
$buildResult = & dotnet build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful" -ForegroundColor Green
    Write-Host "Starting Groups Service..." -ForegroundColor Cyan
    Start-Process -FilePath "dotnet" -ArgumentList "run" -WindowStyle Minimized
    Write-Host "Groups Service started in background" -ForegroundColor Green
} else {
    Write-Host "Build failed" -ForegroundColor Red
    Write-Host $buildResult -ForegroundColor Red
}

cd ..\..\..
Start-Sleep -Seconds 5

# Test NeuroSpark Service
Write-Host "`nTesting NeuroSpark Service..." -ForegroundColor Yellow
cd "Backend\innkt.NeuroSpark\innkt.NeuroSpark"
Write-Host "Building NeuroSpark Service..." -ForegroundColor Cyan
$buildResult = & dotnet build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful" -ForegroundColor Green
    Write-Host "Starting NeuroSpark Service..." -ForegroundColor Cyan
    Start-Process -FilePath "dotnet" -ArgumentList "run" -WindowStyle Minimized
    Write-Host "NeuroSpark Service started in background" -ForegroundColor Green
} else {
    Write-Host "Build failed" -ForegroundColor Red
    Write-Host $buildResult -ForegroundColor Red
}

cd ..\..\..\..
Start-Sleep -Seconds 5

# Test Seer Service
Write-Host "`nTesting Seer Service..." -ForegroundColor Yellow
cd "Backend\innkt.Seer"
Write-Host "Building Seer Service..." -ForegroundColor Cyan
$buildResult = & dotnet build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful" -ForegroundColor Green
    Write-Host "Starting Seer Service..." -ForegroundColor Cyan
    Start-Process -FilePath "dotnet" -ArgumentList "run" -WindowStyle Minimized
    Write-Host "Seer Service started in background" -ForegroundColor Green
} else {
    Write-Host "Build failed" -ForegroundColor Red
    Write-Host $buildResult -ForegroundColor Red
}

cd ..\..\..
Start-Sleep -Seconds 5

# Test Frontier Service
Write-Host "`nTesting Frontier Service..." -ForegroundColor Yellow
cd "Backend\innkt.Frontier"
Write-Host "Building Frontier Service..." -ForegroundColor Cyan
$buildResult = & dotnet build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful" -ForegroundColor Green
    Write-Host "Starting Frontier Service..." -ForegroundColor Cyan
    Start-Process -FilePath "dotnet" -ArgumentList "run" -WindowStyle Minimized
    Write-Host "Frontier Service started in background" -ForegroundColor Green
} else {
    Write-Host "Build failed" -ForegroundColor Red
    Write-Host $buildResult -ForegroundColor Red
}

cd ..\..\..
Start-Sleep -Seconds 10

# Check what's running
Write-Host "`nChecking running services..." -ForegroundColor Cyan
Write-Host "Port 5002 (Groups):" -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 5002)
    $tcpClient.Close()
    Write-Host "Groups Service is running" -ForegroundColor Green
} catch {
    Write-Host "Groups Service is not running" -ForegroundColor Red
}

Write-Host "Port 5003 (NeuroSpark):" -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 5003)
    $tcpClient.Close()
    Write-Host "NeuroSpark Service is running" -ForegroundColor Green
} catch {
    Write-Host "NeuroSpark Service is not running" -ForegroundColor Red
}

Write-Host "Port 5267 (Seer):" -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 5267)
    $tcpClient.Close()
    Write-Host "Seer Service is running" -ForegroundColor Green
} catch {
    Write-Host "Seer Service is not running" -ForegroundColor Red
}

Write-Host "Port 51303 (Frontier):" -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 51303)
    $tcpClient.Close()
    Write-Host "Frontier Service is running" -ForegroundColor Green
} catch {
    Write-Host "Frontier Service is not running" -ForegroundColor Red
}

Write-Host "`nTest complete!" -ForegroundColor Green
