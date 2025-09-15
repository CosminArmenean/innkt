# Test User Search Script
# This script tests the user search endpoint to see if Diana appears in results

$baseUrl = "http://localhost:8081"  # Social service URL

Write-Host "Testing user search endpoint..." -ForegroundColor Yellow

# First, let's try to get an auth token from the Officer service
Write-Host "Attempting to get authentication token..." -ForegroundColor Yellow

try {
    # Try to login to get a token
    $loginData = @{
        Email = "testuser1@example.com"
        Password = "TestPassword123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.accessToken
    
    Write-Host "✅ Got authentication token: $($token.Substring(0, 20))..." -ForegroundColor Green
    
    # Test search for "diana" with authentication
    $searchQuery = "diana"
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/follows/search?query=$searchQuery&page=1&limit=20" -Method GET -Headers $headers
    
    Write-Host "✅ Search successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3
    
    if ($response.users -and $response.users.Count -gt 0) {
        Write-Host "`nFound users:" -ForegroundColor Green
        foreach ($user in $response.users) {
            Write-Host "  - $($user.username) ($($user.displayName))" -ForegroundColor White
        }
    } else {
        Write-Host "`nNo users found for query: $searchQuery" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Search failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`nTest completed!" -ForegroundColor Green
