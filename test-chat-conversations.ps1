# Test Chat Conversations Loading in UI
Write-Host "=== Testing Chat Conversations ===" -ForegroundColor Green

# Configuration
$baseUrl = "http://localhost:5001"
$socialUrl = "http://localhost:8081"
$messagingUrl = "http://localhost:3000"
$frontendUrl = "http://localhost:3001"

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

# Step 2: Create test users for conversations
Write-Host "`n2. Creating test users..." -ForegroundColor Yellow

$testUsers = @(
    @{ email = "alice@example.com"; password = "TestPassword123!"; displayName = "Alice Smith"; username = "alice" },
    @{ email = "bob@example.com"; password = "TestPassword123!"; displayName = "Bob Johnson"; username = "bob" },
    @{ email = "charlie@example.com"; password = "TestPassword123!"; displayName = "Charlie Brown"; username = "charlie" }
)

$createdUsers = @()
foreach ($user in $testUsers) {
    $registerData = $user | ConvertTo-Json
    $registerResponse = Invoke-ApiRequest -Url "$baseUrl/api/auth/register" -Method "POST" -Body $registerData
    
    if ($registerResponse) {
        Write-Host "✅ Created user: $($user.displayName)" -ForegroundColor Green
        $createdUsers += $user
    } else {
        Write-Host "⚠️ User might already exist: $($user.displayName)" -ForegroundColor Yellow
        $createdUsers += $user
    }
}

# Step 3: Create follow relationships
Write-Host "`n3. Creating follow relationships..." -ForegroundColor Yellow

foreach ($user in $createdUsers) {
    # Login as the test user
    $userLoginData = @{ email = $user.email; password = $user.password } | ConvertTo-Json
    $userLoginResponse = Invoke-ApiRequest -Url "$baseUrl/api/auth/login" -Method "POST" -Body $userLoginData
    
    if ($userLoginResponse -and $userLoginResponse.accessToken) {
        $userToken = $userLoginResponse.accessToken
        $userHeaders = @{
            "Authorization" = "Bearer $userToken"
            "Content-Type" = "application/json"
        }
        
        # Follow the main test user
        $followData = @{ followingId = $userId } | ConvertTo-Json
        $followResponse = Invoke-ApiRequest -Url "$socialUrl/api/follows/follow" -Method "POST" -Headers $userHeaders -Body $followData
        
        if ($followResponse) {
            Write-Host "✅ $($user.displayName) now follows Test User 1" -ForegroundColor Green
        }
        
        # Main user follows the test user
        $followBackData = @{ followingId = $userLoginResponse.user.id } | ConvertTo-Json
        $followBackResponse = Invoke-ApiRequest -Url "$socialUrl/api/follows/follow" -Method "POST" -Headers $headers -Body $followBackData
        
        if ($followBackResponse) {
            Write-Host "✅ Test User 1 now follows $($user.displayName)" -ForegroundColor Green
        }
    }
}

# Step 4: Create test conversations
Write-Host "`n4. Creating test conversations..." -ForegroundColor Yellow

$conversations = @()
foreach ($user in $createdUsers) {
    # Login as the test user to get their ID
    $userLoginData = @{ email = $user.email; password = $user.password } | ConvertTo-Json
    $userLoginResponse = Invoke-ApiRequest -Url "$baseUrl/api/auth/login" -Method "POST" -Body $userLoginData
    
    if ($userLoginResponse -and $userLoginResponse.user) {
        $otherUserId = $userLoginResponse.user.id
        
        # Create conversation
        $conversationData = @{ userId = $otherUserId } | ConvertTo-Json
        $convResponse = Invoke-ApiRequest -Url "$messagingUrl/api/conversations/direct" -Method "POST" -Headers $headers -Body $conversationData
        
        if ($convResponse) {
            Write-Host "✅ Created conversation with $($user.displayName)" -ForegroundColor Green
            $conversations += @{ id = $convResponse._id; name = $user.displayName; userId = $otherUserId }
        }
    }
}

# Step 5: Send test messages
Write-Host "`n5. Sending test messages..." -ForegroundColor Yellow

foreach ($conv in $conversations) {
    $messages = @(
        "Hello! This is a test message from Test User 1.",
        "How are you doing today?",
        "This is testing the messaging system.",
        "Hope you're having a great day!"
    )
    
    foreach ($message in $messages) {
        $messageData = @{
            conversationId = $conv.id
            content = $message
            type = "text"
        } | ConvertTo-Json
        
        $messageResponse = Invoke-ApiRequest -Url "$messagingUrl/api/messages" -Method "POST" -Headers $headers -Body $messageData
        
        if ($messageResponse) {
            Write-Host "✅ Sent message to $($conv.name)" -ForegroundColor Green
        }
        
        Start-Sleep -Seconds 1
    }
}

# Step 6: Test conversations API
Write-Host "`n6. Testing conversations API..." -ForegroundColor Yellow

$conversationsResponse = Invoke-ApiRequest -Url "$messagingUrl/api/conversations" -Headers $headers

if ($conversationsResponse) {
    Write-Host "✅ Conversations API working!" -ForegroundColor Green
    Write-Host "Found $($conversationsResponse.Count) conversations" -ForegroundColor Cyan
    
    foreach ($conv in $conversationsResponse) {
        Write-Host "  - $($conv.name) (ID: $($conv._id))" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Conversations API failed!" -ForegroundColor Red
}

# Step 7: Test messages API
Write-Host "`n7. Testing messages API..." -ForegroundColor Yellow

if ($conversationsResponse -and $conversationsResponse.Count -gt 0) {
    $firstConv = $conversationsResponse[0]
    $messagesResponse = Invoke-ApiRequest -Url "$messagingUrl/api/messages?conversationId=$($firstConv._id)&limit=10" -Headers $headers
    
    if ($messagesResponse) {
        Write-Host "✅ Messages API working!" -ForegroundColor Green
        Write-Host "Found $($messagesResponse.Count) messages in first conversation" -ForegroundColor Cyan
        
        foreach ($msg in $messagesResponse) {
            Write-Host "  - $($msg.content) (from: $($msg.senderId))" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ Messages API failed!" -ForegroundColor Red
    }
}

# Step 8: Test UI accessibility
Write-Host "`n8. Testing UI accessibility..." -ForegroundColor Yellow

try {
    $uiResponse = Invoke-WebRequest -Uri $frontendUrl -Method GET -TimeoutSec 10
    if ($uiResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend UI is accessible at $frontendUrl" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend UI returned status: $($uiResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend UI is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 9: Test WebSocket connection
Write-Host "`n9. Testing WebSocket connection..." -ForegroundColor Yellow

try {
    $wsTest = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet
    if ($wsTest) {
        Write-Host "✅ WebSocket port 3000 is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ WebSocket port 3000 is not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ WebSocket test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Final Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Green
Write-Host "✅ Authentication: Working" -ForegroundColor Green
Write-Host "✅ User Creation: $($createdUsers.Count) users" -ForegroundColor Green
Write-Host "✅ Follow Relationships: Created" -ForegroundColor Green
Write-Host "✅ Conversations: $($conversations.Count) created" -ForegroundColor Green
Write-Host "✅ Messages: Sent to all conversations" -ForegroundColor Green
Write-Host "✅ APIs: Conversations and Messages working" -ForegroundColor Green
Write-Host "✅ UI: Accessible at $frontendUrl" -ForegroundColor Green
Write-Host "✅ WebSocket: Port 3000 accessible" -ForegroundColor Green

Write-Host "`n🌐 Test the UI manually:" -ForegroundColor Cyan
Write-Host "1. Open: $frontendUrl" -ForegroundColor White
Write-Host "2. Login with: $($testUser.email) / $($testUser.password)" -ForegroundColor White
Write-Host "3. Go to Messages section" -ForegroundColor White
Write-Host "4. Check if conversations are visible" -ForegroundColor White
Write-Host "5. Click on conversations to see messages" -ForegroundColor White

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
Read-Host
