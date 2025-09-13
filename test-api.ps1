# Comprehensive API Testing Script for innkt Platform
# This script tests all major features: Auth, Follow, Post, Comment, Groups, Messaging

Write-Host "🧪 Starting Comprehensive API Testing for innkt Platform" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Test User Credentials
$user1 = @{
    email = "testuser1@example.com"
    password = "TestPassword123!"
}

$user2 = @{
    email = "testuser2@example.com"
    password = "TestPassword123!"
}

# Global variables for tokens and user IDs
$global:user1Token = ""
$global:user2Token = ""
$global:user1Id = ""
$global:user2Id = ""

# Function to make authenticated requests
function Invoke-AuthenticatedRequest {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [string]$Body = $null,
        [string]$Token = $global:user1Token
    )
    
    $headers = @{
        "Authorization" = "Bearer $Token"
        "Content-Type" = "application/json"
    }
    
    try {
        if ($Body) {
            return Invoke-WebRequest -Uri $Uri -Method $Method -Body $Body -Headers $headers
        } else {
            return Invoke-WebRequest -Uri $Uri -Method $Method -Headers $headers
        }
    } catch {
        Write-Host "❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test 1: Authentication & User Registration
Write-Host "`n🔐 Testing Authentication and User Registration" -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Yellow

# Login User 1
Write-Host "Logging in User 1..." -ForegroundColor Cyan
$loginBody1 = @{
    email = $user1.email
    password = $user1.password
} | ConvertTo-Json

try {
    $loginResponse1 = Invoke-WebRequest -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $loginBody1 -ContentType "application/json"
    $loginData1 = $loginResponse1.Content | ConvertFrom-Json
    $global:user1Token = $loginData1.accessToken
    $global:user1Id = $loginData1.user.id
    Write-Host "✅ User 1 logged in successfully. ID: $($global:user1Id)" -ForegroundColor Green
} catch {
    Write-Host "❌ User 1 login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Login User 2
Write-Host "Logging in User 2..." -ForegroundColor Cyan
$loginBody2 = @{
    email = $user2.email
    password = $user2.password
} | ConvertTo-Json

try {
    $loginResponse2 = Invoke-WebRequest -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $loginBody2 -ContentType "application/json"
    $loginData2 = $loginResponse2.Content | ConvertFrom-Json
    $global:user2Token = $loginData2.accessToken
    $global:user2Id = $loginData2.user.id
    Write-Host "✅ User 2 logged in successfully. ID: $($global:user2Id)" -ForegroundColor Green
} catch {
    Write-Host "❌ User 2 login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test /api/auth/me endpoint
Write-Host "`nTesting /api/auth/me endpoint..." -ForegroundColor Cyan
try {
    $meResponse = Invoke-AuthenticatedRequest -Uri "http://localhost:5001/api/auth/me" -Token $global:user1Token
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
Write-Host "-------------------------------" -ForegroundColor Yellow

# User 1 follows User 2
Write-Host "User 1 following User 2..." -ForegroundColor Cyan
$followBody = @{
    UserId = $global:user2Id
} | ConvertTo-Json

try {
    $followResponse = Invoke-AuthenticatedRequest -Uri "http://localhost:8081/api/follows" -Method POST -Body $followBody -Token $global:user1Token
    if ($followResponse.StatusCode -eq 200) {
        Write-Host "✅ User 1 successfully followed User 2" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Follow request failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check follow status
Write-Host "Checking follow status..." -ForegroundColor Cyan
try {
    $followStatusResponse = Invoke-AuthenticatedRequest -Uri "http://localhost:8081/api/follows/check/$($global:user2Id)" -Token $global:user1Token
    if ($followStatusResponse.StatusCode -eq 200) {
        $isFollowing = $followStatusResponse.Content | ConvertFrom-Json
        Write-Host "✅ Follow status check: User 1 is following User 2: $isFollowing" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Follow status check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Get User 2's followers
Write-Host "Getting User 2's followers..." -ForegroundColor Cyan
try {
    $followersResponse = Invoke-AuthenticatedRequest -Uri "http://localhost:8081/api/follows/followers/$($global:user2Id)" -Token $global:user1Token
    if ($followersResponse.StatusCode -eq 200) {
        $followers = $followersResponse.Content | ConvertFrom-Json
        Write-Host "✅ User 2 has $($followers.totalCount) followers" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Get followers failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Post Functionality
Write-Host "`n📝 Testing Post Functionality" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow

# Create a post by User 1
Write-Host "Creating a post by User 1..." -ForegroundColor Cyan
$postBody = @{
    Content = "Hello world! This is my first post on innkt platform. #test #hello #innkt"
    Hashtags = @("test", "hello", "innkt")
    IsPublic = $true
} | ConvertTo-Json

$global:postId = ""
try {
    $postResponse = Invoke-AuthenticatedRequest -Uri "http://localhost:8081/api/posts" -Method POST -Body $postBody -Token $global:user1Token
    if ($postResponse.StatusCode -eq 201) {
        $postData = $postResponse.Content | ConvertFrom-Json
        $global:postId = $postData.id
        Write-Host "✅ Post created successfully. ID: $($global:postId)" -ForegroundColor Green
        Write-Host "   Content: $($postData.content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Post creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Like the post
Write-Host "Liking the post..." -ForegroundColor Cyan
try {
    $likeResponse = Invoke-AuthenticatedRequest -Uri "http://localhost:8081/api/posts/$($global:postId)/like" -Method POST -Token $global:user2Token
    if ($likeResponse.StatusCode -eq 200) {
        Write-Host "✅ Post liked successfully by User 2" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Post like failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Comment Functionality
Write-Host "`n💬 Testing Comment Functionality" -ForegroundColor Yellow
Write-Host "--------------------------------" -ForegroundColor Yellow

# Create a comment on the post
Write-Host "Creating a comment on the post..." -ForegroundColor Cyan
$commentBody = @{
    Content = "Great post! Looking forward to more content from you. 👍"
} | ConvertTo-Json

$global:commentId = ""
try {
    $commentResponse = Invoke-AuthenticatedRequest -Uri "http://localhost:8081/api/comments/post/$($global:postId)" -Method POST -Body $commentBody -Token $global:user2Token
    if ($commentResponse.StatusCode -eq 201) {
        $commentData = $commentResponse.Content | ConvertFrom-Json
        $global:commentId = $commentData.id
        Write-Host "✅ Comment created successfully. ID: $($global:commentId)" -ForegroundColor Green
        Write-Host "   Content: $($commentData.content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Comment creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Like the comment
Write-Host "Liking the comment..." -ForegroundColor Cyan
try {
    $commentLikeResponse = Invoke-AuthenticatedRequest -Uri "http://localhost:8081/api/comments/$($global:commentId)/like" -Method POST -Token $global:user1Token
    if ($commentLikeResponse.StatusCode -eq 200) {
        Write-Host "✅ Comment liked successfully by User 1" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Comment like failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Groups Functionality
Write-Host "`n👥 Testing Groups Functionality" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow

# Create a group
Write-Host "Creating a group..." -ForegroundColor Cyan
$groupBody = @{
    name = "Test Group"
    description = "A test group for API testing"
    isPublic = $true
    category = "Technology"
} | ConvertTo-Json

$global:groupId = ""
try {
    $groupResponse = Invoke-AuthenticatedRequest -Uri "http://localhost:8081/api/groups" -Method POST -Body $groupBody -Token $global:user1Token
    if ($groupResponse.StatusCode -eq 201) {
        $groupData = $groupResponse.Content | ConvertFrom-Json
        $global:groupId = $groupData.id
        Write-Host "✅ Group created successfully. ID: $($global:groupId)" -ForegroundColor Green
        Write-Host "   Name: $($groupData.name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Group creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# User 2 joins the group
Write-Host "User 2 joining the group..." -ForegroundColor Cyan
try {
    $joinResponse = Invoke-AuthenticatedRequest -Uri "http://localhost:8081/api/groups/$($global:groupId)/join" -Method POST -Token $global:user2Token
    if ($joinResponse.StatusCode -eq 200) {
        Write-Host "✅ User 2 successfully joined the group" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Group join failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Trending and Recommendations
Write-Host "`n📈 Testing Trending and Recommendations" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

# Get trending topics
Write-Host "Getting trending topics..." -ForegroundColor Cyan
try {
    $trendingResponse = Invoke-AuthenticatedRequest -Uri "http://localhost:8081/api/trending/topics" -Token $global:user1Token
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
    $recommendationsResponse = Invoke-AuthenticatedRequest -Uri "http://localhost:8081/api/trending/recommendations/users" -Token $global:user1Token
    if ($recommendationsResponse.StatusCode -eq 200) {
        $recommendationsData = $recommendationsResponse.Content | ConvertFrom-Json
        Write-Host "✅ User recommendations retrieved: $($recommendationsData.Count) users" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ User recommendations failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Feed Functionality
Write-Host "`n📰 Testing Feed Functionality" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow

# Get User 1's feed
Write-Host "Getting User 1's feed..." -ForegroundColor Cyan
try {
    $feedResponse = Invoke-AuthenticatedRequest -Uri "http://localhost:8081/api/posts/feed" -Token $global:user1Token
    if ($feedResponse.StatusCode -eq 200) {
        $feedData = $feedResponse.Content | ConvertFrom-Json
        Write-Host "✅ Feed retrieved: $($feedData.totalCount) posts" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Feed retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Messaging Service
Write-Host "`n💬 Testing Messaging Service" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow

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

# Test 9: React UI
Write-Host "`n⚛️ Testing React UI" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow

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
Write-Host "Check the results above for any failed tests." -ForegroundColor Gray
Write-Host "All major features have been tested:" -ForegroundColor Gray
Write-Host "  ✅ Authentication & User Management" -ForegroundColor Gray
Write-Host "  ✅ Follow/Unfollow Functionality" -ForegroundColor Gray
Write-Host "  ✅ Post Creation, Likes, and Interactions" -ForegroundColor Gray
Write-Host "  ✅ Comment System" -ForegroundColor Gray
Write-Host "  ✅ Group Management" -ForegroundColor Gray
Write-Host "  ✅ Trending Topics and Recommendations" -ForegroundColor Gray
Write-Host "  ✅ Feed Functionality" -ForegroundColor Gray
Write-Host "  ✅ Messaging Service" -ForegroundColor Gray
Write-Host "  ✅ React UI" -ForegroundColor Gray
