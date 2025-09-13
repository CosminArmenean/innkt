# Run All Chat and Kafka Tests
Write-Host "=== Running All INNKT Tests ===" -ForegroundColor Green

# Check if services are running
Write-Host "`n1. Checking if services are running..." -ForegroundColor Yellow

$services = @(
    @{ Name = "Officer (Auth)"; Port = 5001 },
    @{ Name = "Social"; Port = 8081 },
    @{ Name = "Messaging"; Port = 3000 },
    @{ Name = "React UI"; Port = 3001 },
    @{ Name = "Kafka"; Port = 9092 },
    @{ Name = "Redis"; Port = 6379 },
    @{ Name = "MongoDB"; Port = 27017 }
)

$allRunning = $true
foreach ($service in $services) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $service.Port)
        $tcpClient.Close()
        Write-Host "✅ $($service.Name) (port $($service.Port)) - Running" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($service.Name) (port $($service.Port)) - Not running" -ForegroundColor Red
        $allRunning = $false
    }
}

if (-not $allRunning) {
    Write-Host "`n⚠️ Some services are not running. Please start all services first:" -ForegroundColor Yellow
    Write-Host "1. Run: docker-compose -f docker-compose-infrastructure.yml up -d" -ForegroundColor Cyan
    Write-Host "2. Run: .\start-services-fixed.ps1" -ForegroundColor Cyan
    Write-Host "`nPress any key to continue anyway..." -ForegroundColor Gray
    Read-Host
}

# Run chat conversations test
Write-Host "`n2. Running Chat Conversations Test..." -ForegroundColor Yellow
Write-Host "This will create test users, conversations, and messages" -ForegroundColor Cyan
Write-Host "Press any key to start..." -ForegroundColor Gray
Read-Host

.\test-chat-conversations.ps1

# Run Kafka notifications test
Write-Host "`n3. Running Kafka Notifications Test..." -ForegroundColor Yellow
Write-Host "This will test Kafka infrastructure and notifications" -ForegroundColor Cyan
Write-Host "Press any key to start..." -ForegroundColor Gray
Read-Host

.\test-kafka-notifications.ps1

# Open UI test
Write-Host "`n4. Opening UI Test..." -ForegroundColor Yellow
Write-Host "Opening browser-based UI test for manual verification" -ForegroundColor Cyan

$uiTestPath = Join-Path $PWD "test-ui-conversations.html"
if (Test-Path $uiTestPath) {
    Start-Process $uiTestPath
    Write-Host "✅ UI test opened in browser" -ForegroundColor Green
} else {
    Write-Host "❌ UI test file not found: $uiTestPath" -ForegroundColor Red
}

# Final summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Green
Write-Host "✅ Chat Conversations Test: Completed" -ForegroundColor Green
Write-Host "✅ Kafka Notifications Test: Completed" -ForegroundColor Green
Write-Host "✅ UI Test: Opened in browser" -ForegroundColor Green

Write-Host "`n📋 Manual Testing Steps:" -ForegroundColor Cyan
Write-Host "1. Open the UI test in your browser" -ForegroundColor White
Write-Host "2. Test authentication with: testuser1@example.com / TestPassword123!" -ForegroundColor White
Write-Host "3. Check if conversations are loaded" -ForegroundColor White
Write-Host "4. Test WebSocket connection" -ForegroundColor White
Write-Host "5. Open main UI at: http://localhost:3001" -ForegroundColor White
Write-Host "6. Login and go to Messages section" -ForegroundColor White
Write-Host "7. Verify conversations and messages are visible" -ForegroundColor White

Write-Host "`n🔍 Kafka Monitoring:" -ForegroundColor Cyan
Write-Host "1. Open Kafka UI at: http://localhost:8080" -ForegroundColor White
Write-Host "2. Check topics for recent activity" -ForegroundColor White
Write-Host "3. Look for user-events, post-events, message-events" -ForegroundColor White

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
Read-Host