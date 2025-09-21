# 🚀 START ALL REVOLUTIONARY SERVICES
# Systematic startup script for complete platform

Write-Host "🚀 STARTING REVOLUTIONARY PLATFORM SERVICES" -ForegroundColor Cyan
Write-Host ""

# Function to start service in background
function Start-ServiceInBackground {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [int]$Port,
        [string]$Description
    )
    
    Write-Host "🔄 Starting $ServiceName..." -ForegroundColor Yellow
    Write-Host "   📂 Path: $ServicePath"
    Write-Host "   🌐 Port: $Port"
    Write-Host "   📋 Description: $Description"
    
    try {
        # Start service in new PowerShell window
        $scriptBlock = "cd '$ServicePath'; dotnet run --urls=http://localhost:$Port"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $scriptBlock
        
        Write-Host "   ✅ $ServiceName: STARTED (Port $Port)" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
    catch {
        Write-Host "   ❌ $ServiceName: FAILED TO START" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)"
    }
    Write-Host ""
}

# Get base directory
$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "📂 Base Directory: $baseDir" -ForegroundColor Gray
Write-Host ""

# Start all services systematically
Write-Host "🎯 STARTING BACKEND SERVICES..." -ForegroundColor Cyan
Write-Host ""

# 1. Officer Service (Identity & Authentication)
Start-ServiceInBackground -ServiceName "Officer Service" -ServicePath "$baseDir\Backend\innkt.Officer" -Port 5001 -Description "Identity & Authentication"

# 2. Social Service (Optimized Core Social Features)
Start-ServiceInBackground -ServiceName "Social Service" -ServicePath "$baseDir\Backend\innkt.Social" -Port 8081 -Description "Core Social Features (Optimized)"

# 3. NeuroSpark Service (AI + Content Filtering + @grok)
Start-ServiceInBackground -ServiceName "NeuroSpark Service" -ServicePath "$baseDir\Backend\innkt.NeuroSpark\innkt.NeuroSpark" -Port 5005 -Description "AI Content Filtering + @grok Integration"

# 4. Kinder Service (Revolutionary Child Protection)
Start-ServiceInBackground -ServiceName "Kinder Service" -ServicePath "$baseDir\Backend\innkt.Kinder" -Port 5004 -Description "Revolutionary Child Protection"

# 5. Notifications Service (Kafka-Powered Messaging)
Start-ServiceInBackground -ServiceName "Notifications Service" -ServicePath "$baseDir\Backend\innkt.Notifications" -Port 5006 -Description "Kafka-Powered Notifications"

# 6. API Gateway (Frontier)
Start-ServiceInBackground -ServiceName "API Gateway" -ServicePath "$baseDir\Backend\innkt.Frontier" -Port 51303 -Description "API Gateway & Routing"

Write-Host "🎯 STARTING FRONTEND SERVICES..." -ForegroundColor Cyan
Write-Host ""

# 7. React Frontend
Write-Host "🔄 Starting React Frontend..." -ForegroundColor Yellow
Write-Host "   📂 Path: $baseDir\Frontend\innkt.react"
Write-Host "   🌐 Port: 3001"
Write-Host "   📋 Description: Revolutionary Social Media Frontend"

try {
    $reactPath = "$baseDir\Frontend\innkt.react"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$reactPath'; npm start"
    Write-Host "   ✅ React Frontend: STARTED (Port 3001)" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ React Frontend: FAILED TO START" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 ALL REVOLUTIONARY SERVICES STARTING!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 SERVICE SUMMARY:" -ForegroundColor Yellow
Write-Host "   🔐 Officer (Port 5001): Identity & Authentication"
Write-Host "   📱 Social (Port 8081): Core Social Features (Optimized)"
Write-Host "   🤖 NeuroSpark (Port 5005): AI + Content Filtering + @grok"
Write-Host "   🛡️ Kinder (Port 5004): Revolutionary Child Protection"
Write-Host "   🔔 Notifications (Port 5006): Kafka-Powered Messaging"
Write-Host "   🌐 API Gateway (Port 51303): Routing & Load Balancing"
Write-Host "   ⚛️ React Frontend (Port 3001): Revolutionary UI"
Write-Host ""
Write-Host "⏱️ WAITING 30 SECONDS FOR SERVICES TO INITIALIZE..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "🧪 READY FOR INTEGRATION TESTING!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 NEXT STEPS:"
Write-Host "   1. Wait for all services to fully start (2-3 minutes)"
Write-Host "   2. Run integration tests: .\INTEGRATION_TESTING_PROTOCOL.md"
Write-Host "   3. Validate revolutionary features work end-to-end"
Write-Host "   4. Proceed to mobile development or production deployment"
Write-Host ""
Write-Host "🚀 REVOLUTIONARY PLATFORM IS LAUNCHING!" -ForegroundColor Cyan

