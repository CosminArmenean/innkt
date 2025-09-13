# Create Test Conversation Script
Write-Host "=== CREATING TEST CONVERSATION ===" -ForegroundColor Cyan
Write-Host ""

# Test user credentials
$testUserEmail = "testuser20250912103730@example.com"
$testUserPassword = "TestPassword123!"

# Login to get token
Write-Host "Logging in as test user..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body (@{
        Email = $testUserEmail
        Password = $testUserPassword
    } | ConvertTo-Json)
    
    $token = $loginResponse.accessToken
    Write-Host "✓ Login successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create test conversation
Write-Host ""
Write-Host "Creating test conversation..." -ForegroundColor Yellow

try {
    $conversationData = @{
        type = "direct"
        participants = @("testuser20250912103730@example.com", "alice.johnson@example.com")
        name = "Test Conversation"
        description = "Test conversation for UI testing"
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -Body ($conversationData | ConvertTo-Json)
    Write-Host "✓ Conversation created successfully" -ForegroundColor Green
    Write-Host "Conversation ID: $($response.id)" -ForegroundColor Cyan
    
    # Send a test message
    Write-Host ""
    Write-Host "Sending test message..." -ForegroundColor Yellow
    
    $messageData = @{
        content = "Hello! This is a test message."
        type = "text"
    }
    
    $messageResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations/$($response.id)/messages" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -Body ($messageData | ConvertTo-Json)
    Write-Host "✓ Test message sent" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Failed to create conversation: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== TEST CONVERSATION CREATION COMPLETE ===" -ForegroundColor Cyan