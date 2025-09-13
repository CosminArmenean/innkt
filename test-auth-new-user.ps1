Write-Host "Testing authentication with new user..." -ForegroundColor Yellow

# Read credentials from file
$credentials = Get-Content "test-user-credentials.json" | ConvertFrom-Json
$email = $credentials.email
$password = $credentials.password
$token = $credentials.token

Write-Host "Using email: $email" -ForegroundColor Cyan
Write-Host "Token: $($token.Substring(0,30))..." -ForegroundColor Cyan

try {
    # Test posts API
    Write-Host ""
    Write-Host "Testing posts API..." -ForegroundColor Yellow
    $postsResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "✓ Posts API working" -ForegroundColor Green
    Write-Host "Posts response: $($postsResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
    
    # Test follow API
    Write-Host ""
    Write-Host "Testing follow API..." -ForegroundColor Yellow
    $followResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/follows/follow/test-user-id" -Method POST -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "✓ Follow API working" -ForegroundColor Green
    Write-Host "Follow response: $($followResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
    
    # Test messaging API
    Write-Host ""
    Write-Host "Testing messaging API..." -ForegroundColor Yellow
    $messagingResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method GET -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "✓ Messaging API working" -ForegroundColor Green
    Write-Host "Messaging response: $($messagingResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}
