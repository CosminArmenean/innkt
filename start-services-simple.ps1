# Simple Services Startup Script
Write-Host "Starting innkt Platform Services..." -ForegroundColor Cyan

# Start Infrastructure Services
Write-Host "1. Starting PostgreSQL..." -ForegroundColor Yellow
Start-Process -FilePath "docker" -ArgumentList "run", "-d", "--name", "innkt-postgres", "-e", "POSTGRES_PASSWORD=TestPassword123!", "-e", "POSTGRES_DB=innkt_officer", "-p", "5432:5432", "postgres:15" -NoNewWindow

Write-Host "2. Starting Redis..." -ForegroundColor Yellow
Start-Process -FilePath "docker" -ArgumentList "run", "-d", "--name", "innkt-redis", "-p", "6379:6379", "redis:7-alpine" -NoNewWindow

Write-Host "3. Starting MongoDB..." -ForegroundColor Yellow
Start-Process -FilePath "docker" -ArgumentList "run", "-d", "--name", "innkt-mongodb", "-e", "MONGO_INITDB_ROOT_USERNAME=admin", "-e", "MONGO_INITDB_ROOT_PASSWORD=TestPassword123!", "-p", "27017:27017", "mongo:7" -NoNewWindow

# Wait for infrastructure services to start
Write-Host "Waiting for infrastructure services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start Backend Services
Write-Host "4. Starting Officer Service..." -ForegroundColor Yellow
Start-Process -FilePath "dotnet" -ArgumentList "run", "--project", "Backend/innkt.Officer/innkt.Officer/innkt.Officer.csproj" -NoNewWindow

Write-Host "5. Starting Social Service..." -ForegroundColor Yellow
Start-Process -FilePath "dotnet" -ArgumentList "run", "--project", "Backend/innkt.Social/innkt.Social.csproj" -NoNewWindow

Write-Host "6. Starting NeuroSpark Service..." -ForegroundColor Yellow
Start-Process -FilePath "dotnet" -ArgumentList "run", "--project", "Backend/innkt.NeuroSpark/innkt.NeuroSpark/innkt.NeuroSpark.csproj" -NoNewWindow

Write-Host "7. Starting Messaging Service..." -ForegroundColor Yellow
Set-Location "Backend/innkt.Messaging"
Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow
Set-Location "..\..\"

Write-Host "8. Starting Seer Service..." -ForegroundColor Yellow
Start-Process -FilePath "dotnet" -ArgumentList "run", "--project", "Backend/innkt.Seer/innkt.Seer.csproj" -NoNewWindow

Write-Host "9. Starting Frontier Service..." -ForegroundColor Yellow
Start-Process -FilePath "dotnet" -ArgumentList "run", "--project", "Backend/innkt.Frontier/innkt.Frontier.csproj" -NoNewWindow

# Wait for backend services to start
Write-Host "Waiting for backend services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Start React UI
Write-Host "10. Starting React UI..." -ForegroundColor Yellow
Set-Location "Frontend/innkt.react"
Start-Process -FilePath "npm" -ArgumentList "start" -NoNewWindow
Set-Location "..\..\"

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host "Services available at:" -ForegroundColor Cyan
Write-Host "• Officer Service:     http://localhost:5001" -ForegroundColor White
Write-Host "• Social Service:      http://localhost:8081" -ForegroundColor White
Write-Host "• NeuroSpark Service:  http://localhost:5003" -ForegroundColor White
Write-Host "• Messaging Service:   http://localhost:3000" -ForegroundColor White
Write-Host "• Seer Service:        http://localhost:5267" -ForegroundColor White
Write-Host "• Frontier Gateway:    http://localhost:51303" -ForegroundColor White
Write-Host "• React UI:            http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to continue..." -ForegroundColor Gray
Read-Host
