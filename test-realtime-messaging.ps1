# Test Real-time Messaging Functionality
Write-Host "=== Testing Real-time Messaging ===" -ForegroundColor Cyan

# Test 1: Check if messaging service is running
Write-Host "`n1. Checking messaging service status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Messaging service is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Messaging service is not running: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Starting messaging service..." -ForegroundColor Yellow
    Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory "Backend\innkt.Messaging" -WindowStyle Hidden
    Start-Sleep -Seconds 5
}

# Test 2: Login and get token
Write-Host "`n2. Authenticating user..." -ForegroundColor Yellow
$loginData = @{
    email = "testuser1@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.accessToken
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Login successful! User ID: $($loginResponse.userId)" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Get conversations
Write-Host "`n3. Getting conversations..." -ForegroundColor Yellow
try {
    $conversationsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method GET -Headers $headers
    if ($conversationsResponse.conversations) {
        Write-Host "✅ Found $($conversationsResponse.conversations.Count) conversations" -ForegroundColor Green
        $conversationId = $conversationsResponse.conversations[0]._id
        Write-Host "  Using conversation: $conversationId" -ForegroundColor Cyan
    } else {
        Write-Host "❌ No conversations found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to get conversations: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Send a test message
Write-Host "`n4. Sending test message..." -ForegroundColor Yellow
$messageData = @{
    conversationId = $conversationId
    content = "Test real-time message at $(Get-Date -Format 'HH:mm:ss')"
    type = "text"
} | ConvertTo-Json

try {
    $messageResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/messages" -Method POST -Headers $headers -Body $messageData
    Write-Host "✅ Message sent successfully" -ForegroundColor Green
    Write-Host "  Message ID: $($messageResponse._id)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to send message: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Get messages to verify
Write-Host "`n5. Verifying message was saved..." -ForegroundColor Yellow
try {
    $messagesResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/messages?conversationId=$conversationId&limit=10" -Method GET -Headers $headers
    if ($messagesResponse.messages) {
        Write-Host "✅ Found $($messagesResponse.messages.Count) messages" -ForegroundColor Green
        $latestMessage = $messagesResponse.messages[0]
        Write-Host "  Latest: $($latestMessage.content) (from: $($latestMessage.senderId))" -ForegroundColor Cyan
    } else {
        Write-Host "❌ No messages found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to get messages: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Real-time Messaging Test Complete ===" -ForegroundColor Cyan
Write-Host "`n🌐 Test the UI:" -ForegroundColor Yellow
Write-Host "1. Open: http://localhost:3001" -ForegroundColor White
Write-Host "2. Login and go to Messages" -ForegroundColor White
Write-Host "3. Click on a conversation to see messages" -ForegroundColor White
Write-Host "4. Send a message and check if it appears immediately" -ForegroundColor White
Write-Host "5. Check if your messages appear on the right (blue) and others on the left (white)" -ForegroundColor White

Read-Host "`nPress Enter to continue..."
