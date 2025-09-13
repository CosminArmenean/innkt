Write-Host "Creating test chat conversations..." -ForegroundColor Yellow

# Load user tokens
$userTokens = Get-Content "test-user-tokens.json" | ConvertFrom-Json

$testuser1Token = $userTokens."testuser1@example.com"
$aliceToken = $userTokens."alice.johnson@example.com"
$bobToken = $userTokens."bob.smith@example.com"

Write-Host "Creating conversations..." -ForegroundColor Cyan

# Create conversation between testuser1 and alice
try {
    Write-Host "Creating conversation between testuser1 and alice..." -ForegroundColor Yellow
    
    $conversationData = @{
        type = "direct"
        participants = @("testuser1@example.com", "alice.johnson@example.com")
        name = "Test User 1 & Alice"
        description = "Test conversation between testuser1 and alice"
    }
    
    $conversationResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $testuser1Token"} -Body ($conversationData | ConvertTo-Json)
    Write-Host "✓ Conversation created: $($conversationResponse.conversation.id)" -ForegroundColor Green
    
    # Send messages in the conversation
    $messages = @(
        @{ content = "Hi Alice! How are you doing?", sender = $testuser1Token },
        @{ content = "Hello! I'm doing great, thanks for asking! How about you?", sender = $aliceToken },
        @{ content = "I'm working on some cool features for our platform. It's going really well!", sender = $testuser1Token },
        @{ content = "That sounds amazing! I'd love to hear more about it sometime.", sender = $aliceToken },
        @{ content = "Absolutely! We should schedule a call to discuss it.", sender = $testuser1Token }
    )
    
    foreach ($message in $messages) {
        try {
            $messageData = @{
                content = $message.content
                type = "text"
            }
            
            $messageResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations/$($conversationResponse.conversation.id)/messages" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $($message.sender)"} -Body ($messageData | ConvertTo-Json)
            Write-Host "✓ Message sent: $($message.content.Substring(0, [Math]::Min(30, $message.content.Length)))..." -ForegroundColor Green
        } catch {
            Write-Host "✗ Failed to send message: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "✗ Failed to create conversation: $($_.Exception.Message)" -ForegroundColor Red
}

# Create conversation between testuser1 and bob
try {
    Write-Host "Creating conversation between testuser1 and bob..." -ForegroundColor Yellow
    
    $conversationData = @{
        type = "direct"
        participants = @("testuser1@example.com", "bob.smith@example.com")
        name = "Test User 1 & Bob"
        description = "Test conversation between testuser1 and bob"
    }
    
    $conversationResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $testuser1Token"} -Body ($conversationData | ConvertTo-Json)
    Write-Host "✓ Conversation created: $($conversationResponse.conversation.id)" -ForegroundColor Green
    
    # Send messages in the conversation
    $messages = @(
        @{ content = "Hey Bob! How's the development going?", sender = $testuser1Token },
        @{ content = "Hey! It's going really well. Just finished implementing the new messaging features!", sender = $bobToken },
        @{ content = "That's awesome! The real-time messaging is working perfectly.", sender = $testuser1Token },
        @{ content = "Thanks! I'm really proud of how it turned out. The WebSocket integration was tricky but worth it.", sender = $bobToken }
    )
    
    foreach ($message in $messages) {
        try {
            $messageData = @{
                content = $message.content
                type = "text"
            }
            
            $messageResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations/$($conversationResponse.conversation.id)/messages" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $($message.sender)"} -Body ($messageData | ConvertTo-Json)
            Write-Host "✓ Message sent: $($message.content.Substring(0, [Math]::Min(30, $message.content.Length)))..." -ForegroundColor Green
        } catch {
            Write-Host "✗ Failed to send message: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "✗ Failed to create conversation: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Chat conversations creation complete!" -ForegroundColor Green
