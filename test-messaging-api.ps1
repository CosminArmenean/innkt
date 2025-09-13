# Test Messaging API
Write-Host "Testing Messaging API..." -ForegroundColor Green

# Get the test token
$token = Get-Content -Path "test-token.txt" -ErrorAction SilentlyContinue
if (-not $token) {
    Write-Host "No test token found. Please login first." -ForegroundColor Red
    exit 1
}

Write-Host "Using token: $($token.Substring(0, 20))..." -ForegroundColor Yellow

# Test conversations endpoint
Write-Host "`n1. Testing conversations endpoint..." -ForegroundColor Cyan
try {
    $conversationsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "✅ Conversations API working!" -ForegroundColor Green
    Write-Host "Found $($conversationsResponse.conversations.Count) conversations" -ForegroundColor Yellow
    
    if ($conversationsResponse.conversations.Count -gt 0) {
        Write-Host "`nSample conversation:" -ForegroundColor Cyan
        $conversation = $conversationsResponse.conversations[0]
        Write-Host "  ID: $($conversation.id)"
        Write-Host "  Type: $($conversation.type)"
        Write-Host "  Participants: $($conversation.participants.Count)"
        Write-Host "  Unread Count: $($conversation.unreadCount)"
        if ($conversation.lastMessage) {
            Write-Host "  Last Message: $($conversation.lastMessage.content)"
        }
    }
} catch {
    Write-Host "❌ Conversations API failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

# Test creating a direct conversation
Write-Host "`n2. Testing direct conversation creation..." -ForegroundColor Cyan
try {
    $testUserId = "4f8c8759-dfdc-423e-878e-c68036140114" # Test user ID
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations/direct" -Method POST -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } -Body (@{
        userId = $testUserId
    } | ConvertTo-Json)
    
    Write-Host "✅ Direct conversation creation working!" -ForegroundColor Green
    Write-Host "Created conversation ID: $($createResponse.conversation.id)" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Direct conversation creation failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}

# Test sending a message
Write-Host "`n3. Testing message sending..." -ForegroundColor Cyan
try {
    # First get a conversation ID
    $conversationsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    if ($conversationsResponse.conversations.Count -gt 0) {
        $conversationId = $conversationsResponse.conversations[0].id
        Write-Host "Using conversation ID: $conversationId" -ForegroundColor Yellow
        
        $messageResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/messages" -Method POST -Headers @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        } -Body (@{
            conversationId = $conversationId
            content = "Test message from PowerShell script"
            type = "text"
        } | ConvertTo-Json)
        
        Write-Host "✅ Message sending working!" -ForegroundColor Green
        Write-Host "Message ID: $($messageResponse.message.id)" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️ No conversations found to test message sending" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Message sending failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`nMessaging API test completed!" -ForegroundColor Green
