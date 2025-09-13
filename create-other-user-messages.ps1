# Create Test Messages from Other Users
Write-Host "=== Creating Test Messages from Other Users ===" -ForegroundColor Cyan

# Step 1: Login as testuser1
Write-Host "`n1. Authenticating as testuser1..." -ForegroundColor Yellow
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

# Step 2: Get conversations
Write-Host "`n2. Getting conversations..." -ForegroundColor Yellow
try {
    $conversationsResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method GET -Headers $headers
    if ($conversationsResponse.conversations) {
        Write-Host "✅ Found $($conversationsResponse.conversations.Count) conversations" -ForegroundColor Green
    } else {
        Write-Host "❌ No conversations found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to get conversations: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Create messages from other users (simulate different senders)
Write-Host "`n3. Creating messages from other users..." -ForegroundColor Yellow

$otherUserMessages = @(
    "Hey! How are you doing?",
    "I saw your post about the new project, looks interesting!",
    "Are you free for a call later today?",
    "Thanks for the help yesterday, really appreciate it!",
    "What do you think about the new features?",
    "I'm working on something similar, maybe we can collaborate?",
    "The weather is great today, isn't it?",
    "Did you see the latest news about the tech industry?",
    "I'm excited about the upcoming conference!",
    "Let me know if you need any assistance with that task."
)

$conversationCount = 0
foreach ($conv in $conversationsResponse.conversations) {
    if ($conversationCount -ge 3) { break } # Limit to first 3 conversations
    
    Write-Host "`nCreating messages for conversation: $($conv._id)" -ForegroundColor Cyan
    
    # Create 2-3 messages per conversation
    $messageCount = Get-Random -Minimum 2 -Maximum 4
    for ($i = 0; $i -lt $messageCount; $i++) {
        $messageText = $otherUserMessages | Get-Random
        $messageData = @{
            conversationId = $conv._id
            content = $messageText
            type = "text"
            senderId = "other-user-$($conversationCount + 1)" # Simulate different sender
        } | ConvertTo-Json
        
        try {
            # Create message directly in database (simulating other user)
            $messageResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/messages" -Method POST -Headers $headers -Body $messageData
            
            if ($messageResponse) {
                Write-Host "  ✅ Created message: $($messageText.Substring(0, [Math]::Min(30, $messageText.Length)))..." -ForegroundColor Green
            } else {
                Write-Host "  ❌ Failed to create message" -ForegroundColor Red
            }
        } catch {
            Write-Host "  ❌ Error creating message: $($_.Exception.Message)" -ForegroundColor Red
            # Try to get more details about the error
            if ($_.Exception.Response) {
                $errorStream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorStream)
                $errorBody = $reader.ReadToEnd()
                Write-Host "  Error details: $errorBody" -ForegroundColor Red
            }
        }
        
        Start-Sleep -Milliseconds 500 # Small delay between messages
    }
    
    $conversationCount++
}

# Step 4: Verify messages were created
Write-Host "`n4. Verifying messages..." -ForegroundColor Yellow
foreach ($conv in $conversationsResponse.conversations[0..2]) {
    try {
        $messagesResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/messages?conversationId=$($conv._id)&limit=10" -Method GET -Headers $headers
        if ($messagesResponse.messages) {
            Write-Host "  ✅ Conversation $($conv._id): $($messagesResponse.messages.Count) messages" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Conversation $($conv._id): No messages found" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Error checking messages for $($conv._id): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Messages Creation Complete ===" -ForegroundColor Cyan
Write-Host "`n🌐 Test the UI:" -ForegroundColor Yellow
Write-Host "1. Open: http://localhost:3001" -ForegroundColor White
Write-Host "2. Login and go to Messages" -ForegroundColor White
Write-Host "3. Click on conversations to see messages from other users" -ForegroundColor White
Write-Host "4. Send a message and check if it appears immediately" -ForegroundColor White
Write-Host "5. Check if your messages appear on the right (blue) and others on the left (white)" -ForegroundColor White

Read-Host "`nPress Enter to continue..."
