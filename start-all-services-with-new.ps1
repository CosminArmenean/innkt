# 🚀 **COMPREHENSIVE SERVICE STARTUP SCRIPT**
# Start all 10 microservices including new Kinder and Notifications services

Write-Host "🚀 STARTING ALL INNKT MICROSERVICES (10 TOTAL)" -ForegroundColor Green
Write-Host ""

# Function to start service in new window
function Start-ServiceInNewWindow {
    param(
        [string]$ServiceName,
        [string]$ServicePath,
        [string]$Port,
        [string]$Description
    )
    
    Write-Host "🎯 Starting $ServiceName ($Description) on port $Port..." -ForegroundColor Cyan
    
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = "powershell.exe"
    $startInfo.Arguments = "-NoExit -Command `"cd '$ServicePath'; Write-Host '🚀 $ServiceName Service Started' -ForegroundColor Green; dotnet run --urls=http://localhost:$Port`""
    $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
    
    try {
        [System.Diagnostics.Process]::Start($startInfo) | Out-Null
        Write-Host "   ✅ $ServiceName started successfully" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
    catch {
        Write-Host "   ❌ Failed to start $ServiceName" -ForegroundColor Red
    }
}

Write-Host "🛡️ STARTING CORE SERVICES..." -ForegroundColor Yellow
Write-Host ""

# 1. Officer Service (Identity)
Start-ServiceInNewWindow -ServiceName "Officer" -ServicePath "$PWD\Backend\innkt.Officer" -Port "5001" -Description "Identity & Authentication"

# 2. Social Service (Posts)
Start-ServiceInNewWindow -ServiceName "Social" -ServicePath "$PWD\Backend\innkt.Social" -Port "8081" -Description "Posts & Social Features"

# 3. NeuroSpark Service (AI)
Start-ServiceInNewWindow -ServiceName "NeuroSpark" -ServicePath "$PWD\Backend\innkt.NeuroSpark\innkt.NeuroSpark" -Port "5003" -Description "AI Processing"

Write-Host ""
Write-Host "🆕 STARTING NEW REVOLUTIONARY SERVICES..." -ForegroundColor Magenta
Write-Host ""

# 4. NEW: Kinder Service (Child Protection)
Start-ServiceInNewWindow -ServiceName "Kinder" -ServicePath "$PWD\Backend\innkt.Kinder" -Port "5004" -Description "🛡️ Revolutionary Child Protection"

# 5. NEW: Notifications Service (Kafka Messaging)
Start-ServiceInNewWindow -ServiceName "Notifications" -ServicePath "$PWD\Backend\innkt.Notifications" -Port "5006" -Description "🔔 Kafka-powered Messaging"

Write-Host ""
Write-Host "📊 STARTING ADDITIONAL SERVICES..." -ForegroundColor Blue
Write-Host ""

# 6. Groups Service
Start-ServiceInNewWindow -ServiceName "Groups" -ServicePath "$PWD\Backend\innkt.Groups" -Port "5002" -Description "Group Management"

# 7. Messaging Service (Node.js)
Write-Host "🎯 Starting Messaging Service (Node.js) on port 3000..." -ForegroundColor Cyan
$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = "powershell.exe"
$startInfo.Arguments = "-NoExit -Command `"cd '$PWD\Backend\innkt.Messaging'; Write-Host '💬 Messaging Service Started' -ForegroundColor Green; npm start`""
$startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
try {
    [System.Diagnostics.Process]::Start($startInfo) | Out-Null
    Write-Host "   ✅ Messaging started successfully" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Failed to start Messaging" -ForegroundColor Red
}

# 8. Seer Service (Video)
Start-ServiceInNewWindow -ServiceName "Seer" -ServicePath "$PWD\Backend\innkt.Seer" -Port "5267" -Description "Video Calls"

# 9. Frontier Gateway (API Gateway)
Start-ServiceInNewWindow -ServiceName "Frontier" -ServicePath "$PWD\Backend\innkt.Frontier" -Port "51303" -Description "API Gateway"

Write-Host ""
Write-Host "🌐 STARTING FRONTEND..." -ForegroundColor Green
Write-Host ""

# 10. React Frontend
Write-Host "🎯 Starting React Frontend on port 3001..." -ForegroundColor Cyan
$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = "powershell.exe"
$startInfo.Arguments = "-NoExit -Command `"cd '$PWD\Frontend\innkt.react'; Write-Host '⚛️ React Frontend Started' -ForegroundColor Green; npm start`""
$startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
try {
    [System.Diagnostics.Process]::Start($startInfo) | Out-Null
    Write-Host "   ✅ React Frontend started successfully" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Failed to start React Frontend" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 ALL SERVICES STARTUP INITIATED!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 SERVICE OVERVIEW:" -ForegroundColor Yellow
Write-Host "✅ Officer (Identity):       http://localhost:5001" -ForegroundColor White
Write-Host "✅ Social (Posts):           http://localhost:8081" -ForegroundColor White
Write-Host "✅ NeuroSpark (AI):          http://localhost:5003" -ForegroundColor White
Write-Host "🆕 Kinder (Child Safety):    http://localhost:5004" -ForegroundColor Magenta
Write-Host "✅ Groups:                   http://localhost:5002" -ForegroundColor White
Write-Host "🆕 Notifications (Kafka):    http://localhost:5006" -ForegroundColor Magenta
Write-Host "✅ Messaging:                http://localhost:3000" -ForegroundColor White
Write-Host "✅ Seer (Video):             http://localhost:5267" -ForegroundColor White
Write-Host "✅ Frontier (Gateway):       http://localhost:51303" -ForegroundColor White
Write-Host "✅ React Frontend:           http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "🛡️ REVOLUTIONARY CHILD PROTECTION: ACTIVE" -ForegroundColor Magenta
Write-Host "🔔 KAFKA-POWERED NOTIFICATIONS: ACTIVE" -ForegroundColor Magenta
Write-Host ""
Write-Host "⏰ Services will take 30-60 seconds to fully start..." -ForegroundColor Yellow
Write-Host "🌐 Access the platform at: http://localhost:3001" -ForegroundColor Green

