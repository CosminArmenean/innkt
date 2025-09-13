Write-Host "Creating test conversation..." -ForegroundColor Yellow

$testUserEmail = "testuser20250912103730@example.com"
$testUserPassword = "TestPassword123!"

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body (@{
        Email = $testUserEmail
        Password = $testUserPassword
    } | ConvertTo-Json)
    
    $token = $loginResponse.accessToken
    Write-Host "Login successful" -ForegroundColor Green
    
    $conversationData = @{
        type = "direct"
        participants = @("testuser20250912103730@example.com", "alice.johnson@example.com")
        name = "Test Conversation"
        description = "Test conversation for UI testing"
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -Body ($conversationData | ConvertTo-Json)
    Write-Host "Conversation created successfully" -ForegroundColor Green
    Write-Host "Conversation ID: $($response.id)" -ForegroundColor Cyan
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
