Write-Host "Creating test chat conversations..." -ForegroundColor Yellow

$userTokens = Get-Content "test-user-tokens.json" | ConvertFrom-Json
$testuser1Token = $userTokens."testuser1@example.com"
$aliceToken = $userTokens."alice.johnson@example.com"

Write-Host "Creating conversation between testuser1 and alice..." -ForegroundColor Cyan

try {
    $conversationData = @{
        type = "direct"
        participants = @("testuser1@example.com", "alice.johnson@example.com")
        name = "Test User 1 & Alice"
        description = "Test conversation"
    }
    
    $conversationResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $testuser1Token"} -Body ($conversationData | ConvertTo-Json)
    Write-Host "Conversation created: $($conversationResponse.conversation.id)" -ForegroundColor Green
    
    # Send test messages
    $message1 = @{
        content = "Hi Alice! How are you doing?"
        type = "text"
    }
    
    $messageResponse1 = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations/$($conversationResponse.conversation.id)/messages" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $testuser1Token"} -Body ($message1 | ConvertTo-Json)
    Write-Host "Message 1 sent" -ForegroundColor Green
    
    $message2 = @{
        content = "Hello! I'm doing great, thanks for asking!"
        type = "text"
    }
    
    $messageResponse2 = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations/$($conversationResponse.conversation.id)/messages" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $aliceToken"} -Body ($message2 | ConvertTo-Json)
    Write-Host "Message 2 sent" -ForegroundColor Green
    
} catch {
    Write-Host "Failed to create conversation: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Chat creation complete!" -ForegroundColor Green
