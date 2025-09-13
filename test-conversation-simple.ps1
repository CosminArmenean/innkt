Write-Host "Testing messaging API..." -ForegroundColor Yellow

# First, let's try to login and get a token
try {
    $loginData = @{
        Email = "testuser1@example.com"
        Password = "Test123!"
    }
    
    Write-Host "Attempting login..." -ForegroundColor Cyan
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body ($loginData | ConvertTo-Json)
    $token = $loginResponse.accessToken
    Write-Host "✓ Login successful, token obtained" -ForegroundColor Green
    
    # Test getting conversations
    Write-Host "Testing conversations API..." -ForegroundColor Cyan
    $conversationsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method GET -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "✓ Conversations API working" -ForegroundColor Green
    Write-Host "Conversations found: $($conversationsResponse.conversations.Count)" -ForegroundColor Yellow
    
    if ($conversationsResponse.conversations.Count -eq 0) {
        Write-Host "No conversations found. Creating a test conversation..." -ForegroundColor Yellow
        
        # Create a test conversation
        $conversationData = @{
            type = "direct"
            participants = @("4f8c8759-dfdc-423e-878e-c68036140114", "7d7a5bfe-1936-42d7-b5b2-1bdd5f29a319")
            name = "Test Conversation"
        }
        
        $createResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations/direct" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -Body ($conversationData | ConvertTo-Json)
        Write-Host "✓ Test conversation created: $($createResponse.conversation.id)" -ForegroundColor Green
        
        # Send a test message
        $messageData = @{
            content = "Hello! This is a test message."
            type = "text"
        }
        
        $messageResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations/$($createResponse.conversation.id)/messages" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -Body ($messageData | ConvertTo-Json)
        Write-Host "✓ Test message sent" -ForegroundColor Green
    }
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}

Write-Host "Test complete!" -ForegroundColor Green
