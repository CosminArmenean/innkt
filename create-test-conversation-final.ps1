Write-Host "Creating test conversation..." -ForegroundColor Yellow

$userTokens = Get-Content "test-user-tokens.json" | ConvertFrom-Json
$testuser1Token = $userTokens."testuser1@example.com"
$aliceToken = $userTokens."alice.johnson@example.com"

Write-Host "Creating conversation between testuser1 and alice..." -ForegroundColor Cyan

try {
    $conversationData = @{
        type = "direct"
        participants = @("testuser1@example.com", "alice.johnson@example.com")
        name = "Test Conversation"
        description = "Test conversation for UI testing"
    }
    
    $conversationResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations/direct" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $testuser1Token"} -Body (@{userId = "7d7a5bfe-1936-42d7-b5b2-1bdd5f29a319"} | ConvertTo-Json)
    Write-Host "✓ Conversation created: $($conversationResponse.conversation.id)" -ForegroundColor Green
    
    # Send test messages
    $message1 = @{
        content = "Hi Alice! This is a test message from testuser1."
        type = "text"
    }
    
    $messageResponse1 = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations/$($conversationResponse.conversation.id)/messages" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $testuser1Token"} -Body ($message1 | ConvertTo-Json)
    Write-Host "✓ Message 1 sent" -ForegroundColor Green
    
    $message2 = @{
        content = "Hello testuser1! This is Alice responding to your message."
        type = "text"
    }
    
    $messageResponse2 = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations/$($conversationResponse.conversation.id)/messages" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $aliceToken"} -Body ($message2 | ConvertTo-Json)
    Write-Host "✓ Message 2 sent" -ForegroundColor Green
    
    Write-Host "✓ Test conversation created successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Failed to create conversation: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "Conversation creation complete!" -ForegroundColor Green
