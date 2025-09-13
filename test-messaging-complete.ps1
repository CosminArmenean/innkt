# Test Messaging System - Complete Test
Write-Host "=== Testing Messaging System ===" -ForegroundColor Green

# Configuration
$baseUrl = "http://localhost:5001"
$socialUrl = "http://localhost:8081"
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
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
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

# Step 2: Check current conversations
Write-Host "`n2. Checking current conversations..." -ForegroundColor Yellow
$conversations = Invoke-ApiRequest -Url "$messagingUrl/api/conversations" -Headers $headers

if ($conversations) {
    Write-Host "✅ Found $($conversations.Count) conversations" -ForegroundColor Green
    foreach ($conv in $conversations) {
        Write-Host "  - Conversation: $($conv.name) (ID: $($conv._id))" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  No conversations found or error occurred" -ForegroundColor Yellow
}

# Step 3: Check followers/following for conversation creation
Write-Host "`n3. Checking followers and following..." -ForegroundColor Yellow
$followers = Invoke-ApiRequest -Url "$socialUrl/api/follows/followers/$userId" -Headers $headers
$following = Invoke-ApiRequest -Url "$socialUrl/api/follows/following/$userId" -Headers $headers

if ($followers -and $followers.followers) {
    Write-Host "✅ Found $($followers.followers.Count) followers" -ForegroundColor Green
    foreach ($follower in $followers.followers) {
        $profile = $follower.followerProfile
        Write-Host "  - Follower: $($profile.displayName) (ID: $($profile.id))" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  No followers found" -ForegroundColor Yellow
}

if ($following -and $following.following) {
    Write-Host "✅ Found $($following.following.Count) following" -ForegroundColor Green
    foreach ($follow in $following.following) {
        $profile = $follow.followingProfile
        Write-Host "  - Following: $($profile.displayName) (ID: $($profile.id))" -ForegroundColor Cyan
    }
} else {
    Write-Host "⚠️  No following found" -ForegroundColor Yellow
}

# Step 4: Create test users if needed
Write-Host "`n4. Creating test users if needed..." -ForegroundColor Yellow

# Create test user 2
$testUser2 = @{
    email = "testuser2@example.com"
    password = "TestPassword123!"
    displayName = "Test User 2"
    username = "testuser2"
}

$registerData2 = $testUser2 | ConvertTo-Json
$registerResponse2 = Invoke-ApiRequest -Url "$baseUrl/api/auth/register" -Method "POST" -Body $registerData2

if ($registerResponse2) {
    Write-Host "✅ Test User 2 created/registered" -ForegroundColor Green
} else {
    Write-Host "⚠️  Test User 2 might already exist" -ForegroundColor Yellow
}

# Create test user 3
$testUser3 = @{
    email = "testuser3@example.com"
    password = "TestPassword123!"
    displayName = "Test User 3"
    username = "testuser3"
}

$registerData3 = $testUser3 | ConvertTo-Json
$registerResponse3 = Invoke-ApiRequest -Url "$baseUrl/api/auth/register" -Method "POST" -Body $registerData3

if ($registerResponse3) {
    Write-Host "✅ Test User 3 created/registered" -ForegroundColor Green
} else {
    Write-Host "⚠️  Test User 3 might already exist" -ForegroundColor Yellow
}

# Step 5: Create follow relationships
Write-Host "`n5. Creating follow relationships..." -ForegroundColor Yellow

# Get test user 2 ID
$loginData2 = @{
    email = "testuser2@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

$loginResponse2 = Invoke-ApiRequest -Url "$baseUrl/api/auth/login" -Method "POST" -Body $loginData2
if ($loginResponse2 -and $loginResponse2.user) {
    $userId2 = $loginResponse2.user.id
    Write-Host "✅ Got Test User 2 ID: $userId2" -ForegroundColor Green
    
    # Create follow relationship (testuser1 follows testuser2)
    $followData = @{
        followingId = $userId2
    } | ConvertTo-Json
    
    $followResponse = Invoke-ApiRequest -Url "$socialUrl/api/follows/follow" -Method "POST" -Headers $headers -Body $followData
    if ($followResponse) {
        Write-Host "✅ Test User 1 now follows Test User 2" -ForegroundColor Green
    }
}

# Get test user 3 ID
$loginData3 = @{
    email = "testuser3@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

$loginResponse3 = Invoke-ApiRequest -Url "$baseUrl/api/auth/login" -Method "POST" -Body $loginData3
if ($loginResponse3 -and $loginResponse3.user) {
    $userId3 = $loginResponse3.user.id
    Write-Host "✅ Got Test User 3 ID: $userId3" -ForegroundColor Green
    
    # Create follow relationship (testuser3 follows testuser1)
    $followData3 = @{
        followingId = $userId
    } | ConvertTo-Json
    
    $followResponse3 = Invoke-ApiRequest -Url "$socialUrl/api/follows/follow" -Method "POST" -Headers @{
        "Authorization" = "Bearer $($loginResponse3.token)"
        "Content-Type" = "application/json"
    } -Body $followData3
    if ($followResponse3) {
        Write-Host "✅ Test User 3 now follows Test User 1" -ForegroundColor Green
    }
}

# Step 6: Create test conversations
Write-Host "`n6. Creating test conversations..." -ForegroundColor Yellow

if ($userId2) {
    # Create conversation with testuser2
    $conversationData1 = @{
        userId = $userId2
    } | ConvertTo-Json
    
    $convResponse1 = Invoke-ApiRequest -Url "$messagingUrl/api/conversations/direct" -Method "POST" -Headers $headers -Body $conversationData1
    if ($convResponse1) {
        Write-Host "✅ Created conversation with Test User 2" -ForegroundColor Green
    }
}

if ($userId3) {
    # Create conversation with testuser3
    $conversationData2 = @{
        userId = $userId3
    } | ConvertTo-Json
    
    $convResponse2 = Invoke-ApiRequest -Url "$messagingUrl/api/conversations/direct" -Method "POST" -Headers $headers -Body $conversationData2
    if ($convResponse2) {
        Write-Host "✅ Created conversation with Test User 3" -ForegroundColor Green
    }
}

# Step 7: Send test messages
Write-Host "`n7. Sending test messages..." -ForegroundColor Yellow

# Get conversations again to get IDs
$conversations = Invoke-ApiRequest -Url "$messagingUrl/api/conversations" -Headers $headers

if ($conversations -and $conversations.Count -gt 0) {
    foreach ($conv in $conversations) {
        $messageData = @{
            content = "Hello! This is a test message from Test User 1."
            type = "text"
        } | ConvertTo-Json
        
        $messageResponse = Invoke-ApiRequest -Url "$messagingUrl/api/messages" -Method "POST" -Headers $headers -Body $messageData
        if ($messageResponse) {
            Write-Host "✅ Sent test message to conversation: $($conv.name)" -ForegroundColor Green
        }
    }
}

# Step 8: Final verification
Write-Host "`n8. Final verification..." -ForegroundColor Yellow
$finalConversations = Invoke-ApiRequest -Url "$messagingUrl/api/conversations" -Headers $headers

if ($finalConversations) {
    Write-Host "✅ Final conversation count: $($finalConversations.Count)" -ForegroundColor Green
    foreach ($conv in $finalConversations) {
        Write-Host "  - $($conv.name) (ID: $($conv._id))" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ No conversations found in final check" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
Write-Host "You can now test the messaging UI at: http://localhost:3001" -ForegroundColor Cyan
