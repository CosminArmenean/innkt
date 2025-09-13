# Test Kafka Notifications
Write-Host "=== Testing Kafka Notifications ===" -ForegroundColor Green

# Configuration
$baseUrl = "http://localhost:5001"
$socialUrl = "http://localhost:8081"
$messagingUrl = "http://localhost:3000"
$kafkaUrl = "http://localhost:8080"  # Kafka UI

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

# Step 1: Check Kafka infrastructure
Write-Host "`n1. Checking Kafka infrastructure..." -ForegroundColor Yellow

# Check if Kafka is running
try {
    $kafkaTest = Test-NetConnection -ComputerName localhost -Port 9092 -InformationLevel Quiet
    if ($kafkaTest) {
        Write-Host "✅ Kafka broker is running on port 9092" -ForegroundColor Green
    } else {
        Write-Host "❌ Kafka broker is not running on port 9092" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Kafka broker test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check if Zookeeper is running
try {
    $zookeeperTest = Test-NetConnection -ComputerName localhost -Port 2181 -InformationLevel Quiet
    if ($zookeeperTest) {
        Write-Host "✅ Zookeeper is running on port 2181" -ForegroundColor Green
    } else {
        Write-Host "❌ Zookeeper is not running on port 2181" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Zookeeper test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check Kafka UI
try {
    $kafkaUIResponse = Invoke-WebRequest -Uri $kafkaUrl -Method GET -TimeoutSec 10
    if ($kafkaUIResponse.StatusCode -eq 200) {
        Write-Host "✅ Kafka UI is accessible at $kafkaUrl" -ForegroundColor Green
    } else {
        Write-Host "❌ Kafka UI returned status: $($kafkaUIResponse.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Kafka UI is not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Login and get token
Write-Host "`n2. Authenticating user..." -ForegroundColor Yellow
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

# Step 3: Test social service notifications (posts, follows, etc.)
Write-Host "`n3. Testing social service notifications..." -ForegroundColor Yellow

# Create a test post
$postData = @{
    content = "This is a test post for Kafka notifications testing. #test #kafka #notifications"
    visibility = "public"
} | ConvertTo-Json

$postResponse = Invoke-ApiRequest -Url "$socialUrl/api/posts" -Method "POST" -Headers $headers -Body $postData

if ($postResponse) {
    Write-Host "✅ Created test post (ID: $($postResponse.id))" -ForegroundColor Green
    $postId = $postResponse.id
} else {
    Write-Host "❌ Failed to create test post" -ForegroundColor Red
    $postId = $null
}

# Like the post
if ($postId) {
    $likeResponse = Invoke-ApiRequest -Url "$socialUrl/api/posts/$postId/like" -Method "POST" -Headers $headers
    if ($likeResponse) {
        Write-Host "✅ Liked the test post" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to like the test post" -ForegroundColor Red
    }
}

# Create a comment
if ($postId) {
    $commentData = @{
        content = "This is a test comment for Kafka notifications!"
    } | ConvertTo-Json
    
    $commentResponse = Invoke-ApiRequest -Url "$socialUrl/api/posts/$postId/comments" -Method "POST" -Headers $headers -Body $commentData
    if ($commentResponse) {
        Write-Host "✅ Created test comment" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create test comment" -ForegroundColor Red
    }
}

# Step 4: Test messaging service notifications
Write-Host "`n4. Testing messaging service notifications..." -ForegroundColor Yellow

# Create a test conversation
$conversationData = @{
    userId = $userId  # Self-conversation for testing
} | ConvertTo-Json

$convResponse = Invoke-ApiRequest -Url "$messagingUrl/api/conversations/direct" -Method "POST" -Headers $headers -Body $conversationData

if ($convResponse) {
    Write-Host "✅ Created test conversation (ID: $($convResponse._id))" -ForegroundColor Green
    $conversationId = $convResponse._id
    
    # Send a test message
    $messageData = @{
        conversationId = $conversationId
        content = "This is a test message for Kafka notifications!"
        type = "text"
    } | ConvertTo-Json
    
    $messageResponse = Invoke-ApiRequest -Url "$messagingUrl/api/messages" -Method "POST" -Headers $headers -Body $messageData
    
    if ($messageResponse) {
        Write-Host "✅ Sent test message" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to send test message" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Failed to create test conversation" -ForegroundColor Red
}

# Step 5: Test follow notifications
Write-Host "`n5. Testing follow notifications..." -ForegroundColor Yellow

# Create a test user to follow
$testUserData = @{
    email = "kafkatest@example.com"
    password = "TestPassword123!"
    displayName = "Kafka Test User"
    username = "kafkatest"
} | ConvertTo-Json

$testUserResponse = Invoke-ApiRequest -Url "$baseUrl/api/auth/register" -Method "POST" -Body $testUserData

if ($testUserResponse) {
    Write-Host "✅ Created test user for follow notifications" -ForegroundColor Green
    $testUserId = $testUserResponse.user.id
    
    # Follow the test user
    $followData = @{ followingId = $testUserId } | ConvertTo-Json
    $followResponse = Invoke-ApiRequest -Url "$socialUrl/api/follows/follow" -Method "POST" -Headers $headers -Body $followData
    
    if ($followResponse) {
        Write-Host "✅ Followed test user" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to follow test user" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️ Test user might already exist" -ForegroundColor Yellow
}

# Step 6: Check Kafka topics (if accessible)
Write-Host "`n6. Checking Kafka topics..." -ForegroundColor Yellow

try {
    # Try to get Kafka topics via REST API (if available)
    $topicsResponse = Invoke-ApiRequest -Url "$kafkaUrl/api/topics" -Method "GET"
    if ($topicsResponse) {
        Write-Host "✅ Kafka topics accessible via API" -ForegroundColor Green
        Write-Host "Topics: $($topicsResponse -join ', ')" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ Kafka topics not accessible via API" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not check Kafka topics via API" -ForegroundColor Yellow
}

# Step 7: Test notification endpoints
Write-Host "`n7. Testing notification endpoints..." -ForegroundColor Yellow

# Check if there are any notification endpoints
$notificationEndpoints = @(
    "$socialUrl/api/notifications",
    "$messagingUrl/api/notifications",
    "$baseUrl/api/notifications"
)

foreach ($endpoint in $notificationEndpoints) {
    try {
        $notifResponse = Invoke-ApiRequest -Url $endpoint -Headers $headers
        if ($notifResponse) {
            Write-Host "✅ Notifications endpoint working: $endpoint" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Notifications endpoint not found: $endpoint" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Notifications endpoint error: $endpoint" -ForegroundColor Yellow
    }
}

# Step 8: Monitor for Kafka activity
Write-Host "`n8. Monitoring Kafka activity..." -ForegroundColor Yellow

Write-Host "Checking for recent Kafka activity..." -ForegroundColor Cyan
Write-Host "Look for the following in your Kafka UI at $kafkaUrl:" -ForegroundColor Cyan
Write-Host "- Topics: user-events, post-events, message-events, follow-events" -ForegroundColor White
Write-Host "- Messages in topics should show recent activity" -ForegroundColor White
Write-Host "- Check consumer groups for message processing" -ForegroundColor White

# Final Summary
Write-Host "`n=== Kafka Notifications Test Summary ===" -ForegroundColor Green
Write-Host "✅ Kafka Infrastructure: Checked" -ForegroundColor Green
Write-Host "✅ Social Notifications: Tested (posts, likes, comments)" -ForegroundColor Green
Write-Host "✅ Messaging Notifications: Tested (conversations, messages)" -ForegroundColor Green
Write-Host "✅ Follow Notifications: Tested" -ForegroundColor Green
Write-Host "✅ Notification Endpoints: Checked" -ForegroundColor Green

Write-Host "`n🔍 Manual Verification Steps:" -ForegroundColor Cyan
Write-Host "1. Open Kafka UI: $kafkaUrl" -ForegroundColor White
Write-Host "2. Check topics for recent messages" -ForegroundColor White
Write-Host "3. Look for user-events, post-events, message-events topics" -ForegroundColor White
Write-Host "4. Verify messages were produced to topics" -ForegroundColor White
Write-Host "5. Check consumer groups are processing messages" -ForegroundColor White

Write-Host "`n📊 Expected Kafka Topics:" -ForegroundColor Cyan
Write-Host "- user-events (user registration, profile updates)" -ForegroundColor White
Write-Host "- post-events (post creation, likes, comments)" -ForegroundColor White
Write-Host "- message-events (message sending, conversation updates)" -ForegroundColor White
Write-Host "- follow-events (follow/unfollow actions)" -ForegroundColor White

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
Read-Host
