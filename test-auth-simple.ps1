Write-Host "Testing authentication with new user..." -ForegroundColor Yellow

$credentials = Get-Content "test-user-credentials.json" | ConvertFrom-Json
$email = $credentials.email
$password = $credentials.password
$token = $credentials.token

Write-Host "Using email: $email" -ForegroundColor Cyan

try {
    Write-Host "Testing posts API..." -ForegroundColor Yellow
    $postsResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "Posts API working" -ForegroundColor Green
    
    Write-Host "Testing follow API..." -ForegroundColor Yellow
    $followResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/follows/follow/test-user-id" -Method POST -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "Follow API working" -ForegroundColor Green
    
    Write-Host "Testing messaging API..." -ForegroundColor Yellow
    $messagingResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method GET -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "Messaging API working" -ForegroundColor Green
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
