Write-Host "Testing authentication flow..." -ForegroundColor Yellow

try {
    # Login
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body (@{
        Email = "testuser20250912103730@example.com"
        Password = "TestPassword123!"
    } | ConvertTo-Json)
    
    $token = $loginResponse.accessToken
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0,30))..." -ForegroundColor Cyan
    
    # Test posts API
    Write-Host ""
    Write-Host "Testing posts API..." -ForegroundColor Yellow
    $postsResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "✓ Posts API working" -ForegroundColor Green
    Write-Host "Posts count: $($postsResponse.Count)" -ForegroundColor Cyan
    
    # Test follow API
    Write-Host ""
    Write-Host "Testing follow API..." -ForegroundColor Yellow
    $followResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/follows/follow/test-user-id" -Method POST -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "✓ Follow API working" -ForegroundColor Green
    Write-Host "Response: $($followResponse.message)" -ForegroundColor Cyan
    
    # Test messaging API
    Write-Host ""
    Write-Host "Testing messaging API..." -ForegroundColor Yellow
    $messagingResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method GET -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "✓ Messaging API working" -ForegroundColor Green
    Write-Host "Conversations count: $($messagingResponse.Count)" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}
