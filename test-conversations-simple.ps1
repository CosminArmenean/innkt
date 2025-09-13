# Simple Conversation Test
Write-Host "=== Testing Conversations ===" -ForegroundColor Green

# Login
$loginData = @{email="testuser1@example.com"; password="TestPassword123!"} | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"

if ($loginResponse -and $loginResponse.accessToken) {
    $token = $loginResponse.accessToken
    $userId = $loginResponse.user.id
    Write-Host "✅ Login successful! User ID: $userId" -ForegroundColor Green
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Test conversations endpoint
    Write-Host "`nTesting conversations endpoint..." -ForegroundColor Yellow
    try {
        $conversations = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method GET -Headers $headers
        Write-Host "✅ Conversations API working!" -ForegroundColor Green
        Write-Host "Found $($conversations.Count) conversations" -ForegroundColor Cyan
        
        foreach ($conv in $conversations) {
            Write-Host "  - $($conv.name) (ID: $($conv._id))" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "❌ Conversations API error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test messages endpoint
    Write-Host "`nTesting messages endpoint..." -ForegroundColor Yellow
    try {
        $messages = Invoke-RestMethod -Uri "http://localhost:3000/api/messages" -Method GET -Headers $headers
        Write-Host "✅ Messages API working!" -ForegroundColor Green
        Write-Host "Found $($messages.Count) messages" -ForegroundColor Cyan
    }
    catch {
        Write-Host "❌ Messages API error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test social service
    Write-Host "`nTesting social service..." -ForegroundColor Yellow
    try {
        $followers = Invoke-RestMethod -Uri "http://localhost:8081/api/follows/followers/$userId" -Method GET -Headers $headers
        Write-Host "✅ Social API working!" -ForegroundColor Green
        Write-Host "Found $($followers.followers.Count) followers" -ForegroundColor Cyan
    }
    catch {
        Write-Host "❌ Social API error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ Login failed!" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
Write-Host "React UI should be available at: http://localhost:3001" -ForegroundColor Cyan
