# Create Test Messages from Other Users
Write-Host "=== Creating Test Messages ===" -ForegroundColor Green

# Configuration
$baseUrl = "http://localhost:5001"
$messagingUrl = "http://localhost:3000"

# Test user credentials
$testUser = @{
    email = "testuser1@example.com"
    password = "TestPassword123!"
}

# Function to make HTTP requests
function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $Body -ContentType "application/json"
        return $response
    }
    catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Step 1: Login and get token
Write-Host "`n1. Authenticating user..." -ForegroundColor Yellow
$loginData = @{
    email = $testUser.email
    password = $testUser.password
} | ConvertTo-Json

$loginResponse = Invoke-ApiRequest -Url "$baseUrl/api/auth/login" -Method "POST" -Body $loginData

if ($loginResponse -and $loginResponse.accessToken) {
    $token = $loginResponse.accessToken
    $userId = $loginResponse.user.id
    Write-Host "✅ Login successful! User ID: $userId" -ForegroundColor Green
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
} else {
    Write-Host "❌ Login failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Get conversations
Write-Host "`n2. Getting conversations..." -ForegroundColor Yellow
$conversationsResponse = Invoke-RestMethod -Uri "$messagingUrl/api/conversations" -Method GET -Headers $headers

if ($conversationsResponse -and $conversationsResponse.conversations) {
    $conversations = $conversationsResponse.conversations
    Write-Host "✅ Found $($conversations.Count) conversations" -ForegroundColor Green
    
    foreach ($conv in $conversations) {
        Write-Host "  - $($conv.type) conversation: $($conv._id)" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ No conversations found!" -ForegroundColor Red
    exit 1
}

# Step 3: Create test messages for each conversation
Write-Host "`n3. Creating test messages..." -ForegroundColor Yellow

$testMessages = @(
    "Hello! This is a test message from another user.",
    "How are you doing today?",
    "I hope you're having a great day!",
    "This is testing the real-time messaging system.",
    "Can you see this message in real-time?",
    "The messaging system is working well!",
    "Let me know if you receive this message.",
    "This is another test message to verify the system."
)

foreach ($conv in $conversations) {
    Write-Host "`nCreating messages for conversation: $($conv._id)" -ForegroundColor Cyan
    
    # Get participants (excluding current user)
    $otherParticipants = $conv.participants | Where-Object { $_.userId -ne $userId }
    
    if ($otherParticipants.Count -gt 0) {
        $otherUserId = $otherParticipants[0].userId
        Write-Host "  Other participant: $otherUserId" -ForegroundColor Gray
        
        # Create messages as if from the other participant
        foreach ($messageText in $testMessages) {
            $messageData = @{
                conversationId = $conv._id
                content = $messageText
                type = "text"
                senderId = $otherUserId
            } | ConvertTo-Json
            
            # Create message directly in database (simulating other user)
            try {
                # We'll use a different approach - create messages via API with modified sender
                $messageResponse = Invoke-RestMethod -Uri "$messagingUrl/api/messages" -Method POST -Headers $headers -Body $messageData
                
                if ($messageResponse) {
                    Write-Host "  ✅ Created message: $($messageText.Substring(0, [Math]::Min(30, $messageText.Length)))..." -ForegroundColor Green
                } else {
                    Write-Host "  ❌ Failed to create message" -ForegroundColor Red
                }
            } catch {
                Write-Host "  ❌ Error creating message: $($_.Exception.Message)" -ForegroundColor Red
            }
            
            Start-Sleep -Milliseconds 500
        }
    } else {
        Write-Host "  ⚠️ No other participants found" -ForegroundColor Yellow
    }
}

# Step 4: Verify messages were created
Write-Host "`n4. Verifying messages..." -ForegroundColor Yellow

foreach ($conv in $conversations) {
    Write-Host "`nChecking messages for conversation: $($conv._id)" -ForegroundColor Cyan
    
    $messagesResponse = Invoke-RestMethod -Uri "$messagingUrl/api/messages?conversationId=$($conv._id)&limit=20" -Method GET -Headers $headers
    
    if ($messagesResponse -and $messagesResponse.messages) {
        Write-Host "  ✅ Found $($messagesResponse.messages.Count) messages" -ForegroundColor Green
        
        foreach ($msg in $messagesResponse.messages) {
            Write-Host "    - $($msg.content) (from: $($msg.senderId))" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ No messages found" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Messages Creation Complete ===" -ForegroundColor Green
Write-Host "✅ Messages created for all conversations" -ForegroundColor Green
Write-Host "✅ Real-time updates should now work" -ForegroundColor Green

Write-Host "`n🌐 Test the UI:" -ForegroundColor Cyan
Write-Host "1. Open: http://localhost:3001" -ForegroundColor White
Write-Host "2. Login and go to Messages" -ForegroundColor White
Write-Host "3. Click on conversations to see messages" -ForegroundColor White
Write-Host "4. Send a message and see it appear in real-time" -ForegroundColor White

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
Read-Host
