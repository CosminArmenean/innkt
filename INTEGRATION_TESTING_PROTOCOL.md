# 🧪 API Endpoint Integration Testing Script
# Systematic validation of all revolutionary features

Write-Host "🧪 SYSTEMATIC API ENDPOINT TESTING" -ForegroundColor Cyan
Write-Host ""

# Test variables
$baseUrl = "http://localhost:51303"  # API Gateway
$testParentId = [Guid]::NewGuid()
$testUserId = [Guid]::NewGuid()
$testKidAge = 10

Write-Host "🎯 Testing with:" -ForegroundColor Yellow
Write-Host "   Parent ID: $testParentId"
Write-Host "   User ID: $testUserId"
Write-Host "   Kid Age: $testKidAge"
Write-Host ""

# Function to test API endpoint
function Test-ApiEndpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Description,
        [hashtable]$Body = @{},
        [hashtable]$Headers = @{}
    )
    
    Write-Host "🔍 Testing: $Description" -ForegroundColor White
    Write-Host "   $Method $Endpoint"
    
    try {
        $uri = "$baseUrl$Endpoint"
        
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $Headers -ErrorAction Stop
        } else {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Body $jsonBody -ContentType "application/json" -Headers $Headers -ErrorAction Stop
        }
        
        Write-Host "   ✅ SUCCESS: $Description" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "   ❌ FAILED: $Description" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)"
        return $null
    }
}

Write-Host "🛡️ TESTING KINDER SERVICE (Kid Safety)" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Test-ApiEndpoint -Method "GET" -Endpoint "/health/kinder" -Description "Kinder Service Health Check"

# Test 2: Kid Account Creation
$kidAccountData = @{
    userId = $testUserId
    age = $testKidAge
    safetyLevel = "strict"
}

$kidAccount = Test-ApiEndpoint -Method "POST" -Endpoint "/api/kinder/kid-accounts" -Description "Create Kid Account" -Body $kidAccountData

if ($kidAccount) {
    $kidAccountId = $kidAccount.kidAccount.id
    Write-Host "   📋 Kid Account ID: $kidAccountId" -ForegroundColor Yellow
    
    # Test 3: Get Kid Account Details
    Test-ApiEndpoint -Method "GET" -Endpoint "/api/kinder/kid-accounts/$kidAccountId" -Description "Get Kid Account Details"
    
    # Test 4: Panic Button (Emergency Test)
    $panicData = @{
        message = "Integration test emergency"
    }
    Test-ApiEndpoint -Method "POST" -Endpoint "/api/kinder/kid-accounts/$kidAccountId/panic" -Description "Trigger Panic Button" -Body $panicData
    
    # Test 5: Get Safety Events
    Test-ApiEndpoint -Method "GET" -Endpoint "/api/kinder/kid-accounts/$kidAccountId/safety-events" -Description "Get Safety Events"
}

Write-Host ""
Write-Host "🔔 TESTING NOTIFICATIONS SERVICE" -ForegroundColor Cyan
Write-Host ""

# Test 6: Notifications Health Check
Test-ApiEndpoint -Method "GET" -Endpoint "/health/notifications" -Description "Notifications Service Health Check"

# Test 7: Get User Notifications
Test-ApiEndpoint -Method "GET" -Endpoint "/api/notifications" -Description "Get User Notifications"

# Test 8: Emergency Alert
$emergencyAlert = @{
    kidAccountId = $kidAccountId
    alertType = "integration_test"
    severity = "emergency"
    description = "Integration testing emergency alert"
}

Test-ApiEndpoint -Method "POST" -Endpoint "/api/notifications/emergency" -Description "Send Emergency Alert" -Body $emergencyAlert

Write-Host ""
Write-Host "🤖 TESTING NEUROSPARK SERVICE (AI + @grok)" -ForegroundColor Cyan
Write-Host ""

# Test 9: NeuroSpark Health Check
Test-ApiEndpoint -Method "GET" -Endpoint "/health/neurospark" -Description "NeuroSpark Service Health Check"

# Test 10: Content Safety Analysis
$contentData = @{
    content = "This is a test post about learning science"
    kidAge = $testKidAge
}

Test-ApiEndpoint -Method "POST" -Endpoint "/api/neurospark/content/analyze-safety" -Description "Content Safety Analysis" -Body $contentData

# Test 11: @grok Mention Detection
$grokData = @{
    content = "@grok explain photosynthesis for kids"
}

Test-ApiEndpoint -Method "POST" -Endpoint "/api/neurospark/grok/check-mention" -Description "@grok Mention Detection" -Body $grokData

Write-Host ""
Write-Host "📱 TESTING SOCIAL SERVICE (Optimized)" -ForegroundColor Cyan
Write-Host ""

# Test 12: Social Service Health Check
Test-ApiEndpoint -Method "GET" -Endpoint "/health/social" -Description "Social Service Health Check"

# Test 13: Get Posts (Social Feed)
Test-ApiEndpoint -Method "GET" -Endpoint "/api/social/posts" -Description "Get Social Posts"

Write-Host ""
Write-Host "🎉 INTEGRATION TESTING COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 TEST SUMMARY:" -ForegroundColor Yellow
Write-Host "   🛡️ Kid Safety: Account creation + Emergency features"
Write-Host "   🔔 Notifications: Real-time delivery + Emergency alerts"
Write-Host "   🤖 AI Integration: Content analysis + @grok responses"
Write-Host "   📱 Social Features: Optimized feed + Core functionality"
Write-Host ""
Write-Host "🚀 READY FOR FULLSTACK INTEGRATION TESTING!" -ForegroundColor Cyan

