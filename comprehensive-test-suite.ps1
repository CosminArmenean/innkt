# Comprehensive Test Suite for innkt Platform
# Tests all services and their integration

Write-Host "=== COMPREHENSIVE INNKT PLATFORM TEST SUITE ===" -ForegroundColor Cyan
Write-Host "Testing all services and their integration..." -ForegroundColor White
Write-Host ""

# Test Results
$testResults = @()

function Test-Service {
    param(
        [string]$ServiceName,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $Body -ContentType "application/json"
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers
        }
        
        Write-Host "✅ $ServiceName - SUCCESS" -ForegroundColor Green
        return @{ Success = $true; Response = $response }
    }
    catch {
        Write-Host "❌ $ServiceName - FAILED: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# Step 1: Test Infrastructure Services
Write-Host "1. TESTING INFRASTRUCTURE SERVICES" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

$testResults += Test-Service "PostgreSQL" "http://localhost:5432" "GET"
$testResults += Test-Service "Redis" "http://localhost:6379" "GET"
$testResults += Test-Service "MongoDB" "http://localhost:27017" "GET"
$testResults += Test-Service "Kafka" "http://localhost:9092" "GET"

Write-Host ""

# Step 2: Test Backend Services Health
Write-Host "2. TESTING BACKEND SERVICES HEALTH" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Yellow

$testResults += Test-Service "Officer Service" "http://localhost:5001/health" "GET"
$testResults += Test-Service "Social Service" "http://localhost:8081/health" "GET"
$testResults += Test-Service "NeuroSpark Service" "http://localhost:5003/health" "GET"
$testResults += Test-Service "Messaging Service" "http://localhost:3000/health" "GET"
$testResults += Test-Service "Seer Service" "http://localhost:5267/health" "GET"
$testResults += Test-Service "Frontier Service" "http://localhost:51303/health" "GET"

Write-Host ""

# Step 3: Test Authentication Flow
Write-Host "3. TESTING AUTHENTICATION FLOW" -ForegroundColor Yellow
Write-Host "===============================" -ForegroundColor Yellow

# Register a test user
$registerData = @{
    email = "testuser@example.com"
    password = "TestPassword123!"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

$registerResult = Test-Service "User Registration" "http://localhost:5001/api/auth/register" "POST" @{} $registerData

if ($registerResult.Success) {
    Write-Host "✅ User Registration - SUCCESS" -ForegroundColor Green
} else {
    Write-Host "⚠️ User Registration - FAILED (user might already exist)" -ForegroundColor Yellow
}

# Login
$loginData = @{
    email = "testuser@example.com"
    password = "TestPassword123!"
} | ConvertTo-Json

$loginResult = Test-Service "User Login" "http://localhost:5001/api/auth/login" "POST" @{} $loginData

if ($loginResult.Success) {
    $token = $loginResult.Response.accessToken
    $headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
    Write-Host "✅ User Login - SUCCESS" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} else {
    Write-Host "❌ User Login - FAILED" -ForegroundColor Red
    $token = $null
    $headers = @{}
}

Write-Host ""

# Step 4: Test Social Features
Write-Host "4. TESTING SOCIAL FEATURES" -ForegroundColor Yellow
Write-Host "===========================" -ForegroundColor Yellow

if ($token) {
    # Create a post
    $postData = @{
        content = "Test post from comprehensive test suite"
        visibility = "public"
    } | ConvertTo-Json
    
    $postResult = Test-Service "Create Post" "http://localhost:8081/api/posts" "POST" $headers $postData
    
    if ($postResult.Success) {
        $postId = $postResult.Response.id
        Write-Host "✅ Create Post - SUCCESS (ID: $postId)" -ForegroundColor Green
        
        # Test feed
        $feedResult = Test-Service "Get Feed" "http://localhost:8081/api/posts/feed" "GET" $headers
        if ($feedResult.Success) {
            Write-Host "✅ Get Feed - SUCCESS ($($feedResult.Response.totalCount) posts)" -ForegroundColor Green
        }
        
        # Test likes
        $likeResult = Test-Service "Like Post" "http://localhost:8081/api/posts/$postId/like" "POST" $headers
        if ($likeResult.Success) {
            Write-Host "✅ Like Post - SUCCESS" -ForegroundColor Green
        }
    }
} else {
    Write-Host "⚠️ Skipping Social Features - No authentication token" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Test NeuroSpark Features
Write-Host "5. TESTING NEUROSPARK FEATURES" -ForegroundColor Yellow
Write-Host "===============================" -ForegroundColor Yellow

if ($token) {
    $searchData = @{
        query = "test search"
        type = "all"
        page = 1
        pageSize = 10
    } | ConvertTo-Json
    
    $searchResult = Test-Service "AI Search" "http://localhost:5003/api/search/search" "POST" $headers $searchData
    if ($searchResult.Success) {
        Write-Host "✅ AI Search - SUCCESS ($($searchResult.Response.totalCount) results)" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️ Skipping NeuroSpark Features - No authentication token" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Test Messaging Features
Write-Host "6. TESTING MESSAGING FEATURES" -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow

if ($token) {
    $conversationData = @{
        participantIds = @("7d7a5bfe-1936-42d7-b5b2-1bdd5f29a319")
    } | ConvertTo-Json
    
    $conversationResult = Test-Service "Create Conversation" "http://localhost:3000/api/conversations" "POST" $headers $conversationData
    if ($conversationResult.Success) {
        Write-Host "✅ Create Conversation - SUCCESS" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️ Skipping Messaging Features - No authentication token" -ForegroundColor Yellow
}

Write-Host ""

# Step 7: Test API Gateway (Direct Service Access)
Write-Host "7. TESTING API GATEWAY" -ForegroundColor Yellow
Write-Host "=======================" -ForegroundColor Yellow

# Test API Gateway health
$gatewayHealthResult = Test-Service "API Gateway Health" "http://localhost:51303/health" "GET"

# Test API Gateway login
$gatewayLoginResult = Test-Service "API Gateway Login" "http://localhost:51303/api/identity/auth/login" "POST" @{} $loginData

if ($gatewayLoginResult.Success) {
    $gatewayToken = $gatewayLoginResult.Response.accessToken
    $gatewayHeaders = @{ "Authorization" = "Bearer $gatewayToken"; "Content-Type" = "application/json" }
    Write-Host "✅ API Gateway Login - SUCCESS" -ForegroundColor Green
    
    # Test API Gateway routing to Social service
    $gatewayPostResult = Test-Service "API Gateway Social Post" "http://localhost:51303/api/social/posts" "POST" $gatewayHeaders $postData
    if ($gatewayPostResult.Success) {
        Write-Host "✅ API Gateway Social Routing - SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "❌ API Gateway Social Routing - FAILED" -ForegroundColor Red
    }
} else {
    Write-Host "❌ API Gateway Login - FAILED" -ForegroundColor Red
}

Write-Host ""

# Step 8: Test React UI
Write-Host "8. TESTING REACT UI" -ForegroundColor Yellow
Write-Host "===================" -ForegroundColor Yellow

$uiResult = Test-Service "React UI" "http://localhost:3001" "GET"
if ($uiResult.Success) {
    Write-Host "✅ React UI - SUCCESS" -ForegroundColor Green
} else {
    Write-Host "❌ React UI - FAILED" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "=== TEST SUMMARY ===" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

$successCount = ($testResults | Where-Object { $_.Success -eq $true }).Count
$totalCount = $testResults.Count
$failureCount = $totalCount - $successCount

Write-Host "Total Tests: $totalCount" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failureCount" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($successCount / $totalCount) * 100, 2))%" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== DETAILED RESULTS ===" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$testResults | ForEach-Object {
    if ($_.Success) {
        Write-Host "✅ $($_.Service) - SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "❌ $($_.Service) - FAILED: $($_.Error)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== RECOMMENDATIONS ===" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

if ($failureCount -eq 0) {
    Write-Host "🎉 All tests passed! The platform is working perfectly." -ForegroundColor Green
} elseif ($failureCount -le 2) {
    Write-Host "✅ Most tests passed! Minor issues to address." -ForegroundColor Yellow
} else {
    Write-Host "⚠️ Several tests failed. Review the issues above." -ForegroundColor Red
}

Write-Host ""
Write-Host "Test completed at: $(Get-Date)" -ForegroundColor Gray
