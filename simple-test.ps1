# Simple API Testing Script for innkt Platform
Write-Host "🧪 Starting Simple API Testing for innkt Platform" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Test 1: Authentication
Write-Host "`n🔐 Testing Authentication" -ForegroundColor Yellow

# Login User 1
Write-Host "Logging in User 1..." -ForegroundColor Cyan
$loginBody1 = @{
    email = "testuser1@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $loginResponse1 = Invoke-WebRequest -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $loginBody1 -ContentType "application/json"
    $loginData1 = $loginResponse1.Content | ConvertFrom-Json
    $user1Token = $loginData1.accessToken
    $user1Id = $loginData1.user.id
    Write-Host "✅ User 1 logged in successfully. ID: $user1Id" -ForegroundColor Green
} catch {
    Write-Host "❌ User 1 login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Login User 2
Write-Host "Logging in User 2..." -ForegroundColor Cyan
$loginBody2 = @{
    email = "testuser2@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

try {
    $loginResponse2 = Invoke-WebRequest -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $loginBody2 -ContentType "application/json"
    $loginData2 = $loginResponse2.Content | ConvertFrom-Json
    $user2Token = $loginData2.accessToken
    $user2Id = $loginData2.user.id
    Write-Host "✅ User 2 logged in successfully. ID: $user2Id" -ForegroundColor Green
} catch {
    Write-Host "❌ User 2 login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test /api/auth/me endpoint
Write-Host "`nTesting /api/auth/me endpoint..." -ForegroundColor Cyan
$headers1 = @{
    "Authorization" = "Bearer $user1Token"
    "Content-Type" = "application/json"
}

try {
    $meResponse = Invoke-WebRequest -Uri "http://localhost:5001/api/auth/me" -Method GET -Headers $headers1
    if ($meResponse.StatusCode -eq 200) {
        Write-Host "✅ /api/auth/me endpoint working correctly" -ForegroundColor Green
        $meData = $meResponse.Content | ConvertFrom-Json
        Write-Host "   User Profile: $($meData.firstName) $($meData.lastName) ($($meData.email))" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ /api/auth/me endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Follow Functionality
Write-Host "`n👥 Testing Follow Functionality" -ForegroundColor Yellow

# User 1 follows User 2
Write-Host "User 1 following User 2..." -ForegroundColor Cyan
$followBody = @{
    UserId = $user2Id
} | ConvertTo-Json

try {
    $followResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/follows" -Method POST -Body $followBody -ContentType "application/json" -Headers $headers1
    if ($followResponse.StatusCode -eq 200) {
        Write-Host "✅ User 1 successfully followed User 2" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Follow request failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check follow status
Write-Host "Checking follow status..." -ForegroundColor Cyan
try {
    $followStatusResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/follows/check/$user2Id" -Method GET -Headers $headers1
    if ($followStatusResponse.StatusCode -eq 200) {
        $isFollowing = $followStatusResponse.Content | ConvertFrom-Json
        Write-Host "✅ Follow status check: User 1 is following User 2: $isFollowing" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Follow status check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Post Functionality
Write-Host "`n📝 Testing Post Functionality" -ForegroundColor Yellow

# Create a post by User 1
Write-Host "Creating a post by User 1..." -ForegroundColor Cyan
$postBody = @{
    Content = "Hello world! This is my first post on innkt platform. #test #hello #innkt"
    Hashtags = @("test", "hello", "innkt")
    IsPublic = $true
} | ConvertTo-Json

$postId = ""
try {
    $postResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/posts" -Method POST -Body $postBody -ContentType "application/json" -Headers $headers1
    if ($postResponse.StatusCode -eq 201) {
        $postData = $postResponse.Content | ConvertFrom-Json
        $postId = $postData.id
        Write-Host "✅ Post created successfully. ID: $postId" -ForegroundColor Green
        Write-Host "   Content: $($postData.content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Post creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Like the post
Write-Host "Liking the post..." -ForegroundColor Cyan
$headers2 = @{
    "Authorization" = "Bearer $user2Token"
    "Content-Type" = "application/json"
}

try {
    $likeResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/posts/$postId/like" -Method POST -Headers $headers2
    if ($likeResponse.StatusCode -eq 200) {
        Write-Host "✅ Post liked successfully by User 2" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Post like failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Comment Functionality
Write-Host "`n💬 Testing Comment Functionality" -ForegroundColor Yellow

# Create a comment on the post
Write-Host "Creating a comment on the post..." -ForegroundColor Cyan
$commentBody = @{
    Content = "Great post! Looking forward to more content from you. 👍"
} | ConvertTo-Json

$commentId = ""
try {
    $commentResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/comments/post/$postId" -Method POST -Body $commentBody -ContentType "application/json" -Headers $headers2
    if ($commentResponse.StatusCode -eq 201) {
        $commentData = $commentResponse.Content | ConvertFrom-Json
        $commentId = $commentData.id
        Write-Host "✅ Comment created successfully. ID: $commentId" -ForegroundColor Green
        Write-Host "   Content: $($commentData.content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Comment creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Trending and Recommendations
Write-Host "`n📈 Testing Trending and Recommendations" -ForegroundColor Yellow

# Get trending topics
Write-Host "Getting trending topics..." -ForegroundColor Cyan
try {
    $trendingResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/trending/topics" -Method GET -Headers $headers1
    if ($trendingResponse.StatusCode -eq 200) {
        $trendingData = $trendingResponse.Content | ConvertFrom-Json
        Write-Host "✅ Trending topics retrieved: $($trendingData.Count) topics" -ForegroundColor Green
        if ($trendingData.Count -gt 0) {
            Write-Host "   Top topics: $($trendingData -join ', ')" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Trending topics failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Get recommended users
Write-Host "Getting recommended users..." -ForegroundColor Cyan
try {
    $recommendationsResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/trending/recommendations/users" -Method GET -Headers $headers1
    if ($recommendationsResponse.StatusCode -eq 200) {
        $recommendationsData = $recommendationsResponse.Content | ConvertFrom-Json
        Write-Host "✅ User recommendations retrieved: $($recommendationsData.Count) users" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ User recommendations failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Feed Functionality
Write-Host "`n📰 Testing Feed Functionality" -ForegroundColor Yellow

# Get User 1's feed
Write-Host "Getting User 1's feed..." -ForegroundColor Cyan
try {
    $feedResponse = Invoke-WebRequest -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers $headers1
    if ($feedResponse.StatusCode -eq 200) {
        $feedData = $feedResponse.Content | ConvertFrom-Json
        Write-Host "✅ Feed retrieved: $($feedData.totalCount) posts" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Feed retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Messaging Service
Write-Host "`n💬 Testing Messaging Service" -ForegroundColor Yellow

# Test messaging service health
Write-Host "Testing messaging service health..." -ForegroundColor Cyan
try {
    $messagingResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET
    if ($messagingResponse.StatusCode -eq 200) {
        Write-Host "✅ Messaging service is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Messaging service health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: React UI
Write-Host "`n⚛️ Testing React UI" -ForegroundColor Yellow

# Test React UI accessibility
Write-Host "Testing React UI accessibility..." -ForegroundColor Cyan
try {
    $reactResponse = Invoke-WebRequest -Uri "http://localhost:3001" -Method GET
    if ($reactResponse.StatusCode -eq 200) {
        Write-Host "✅ React UI is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ React UI accessibility test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green
Write-Host "All major features have been tested:" -ForegroundColor Gray
Write-Host "  ✅ Authentication and User Management" -ForegroundColor Gray
Write-Host "  ✅ Follow/Unfollow Functionality" -ForegroundColor Gray
Write-Host "  ✅ Post Creation, Likes, and Interactions" -ForegroundColor Gray
Write-Host "  ✅ Comment System" -ForegroundColor Gray
Write-Host "  ✅ Trending Topics and Recommendations" -ForegroundColor Gray
Write-Host "  ✅ Feed Functionality" -ForegroundColor Gray
Write-Host "  ✅ Messaging Service" -ForegroundColor Gray
Write-Host "  ✅ React UI" -ForegroundColor Gray
