Write-Host "Testing APIs directly..." -ForegroundColor Yellow

# Use the token from the registration output
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImYxMmU0Yjg2LWY2MmItNDYxZS1iYTE3LWZlMjI2MWM4MDljOSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InRlc3R1c2VyMjAyNTA5MTIxNDQ4NDNAZXhhbXBsZS5jb20iLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiVGVzdCBVc2VyIiwiZmlyc3ROYW1lIjoiVGVzdCIsImxhc3ROYW1lIjoiVXNlciIsImlzSm9pbnRBY2NvdW50IjoiRmFsc2UiLCJsYW5ndWFnZSI6ImVuIiwidGhlbWUiOiJsaWdodCIsImV4cCI6MTc1NzY4MTMyNiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo1MDAxIiwiYXVkIjoiaW5ua3Qub2ZmaWNlci5hcGkifQ.RKwPHAdMZ23iYPn9d2_EWSNXI3uncM15sWRYhR1QAbQ"

Write-Host "Token: $($token.Substring(0,30))..." -ForegroundColor Cyan

try {
    Write-Host "Testing posts API..." -ForegroundColor Yellow
    $postsResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/posts/feed" -Method GET -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "Posts API working - Response: $($postsResponse | ConvertTo-Json -Depth 1)" -ForegroundColor Green
    
} catch {
    Write-Host "Posts API Error: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "Testing follow API..." -ForegroundColor Yellow
    $followResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/follows/follow/test-user-id" -Method POST -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "Follow API working - Response: $($followResponse | ConvertTo-Json -Depth 1)" -ForegroundColor Green
    
} catch {
    Write-Host "Follow API Error: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    Write-Host "Testing messaging API..." -ForegroundColor Yellow
    $messagingResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method GET -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "Messaging API working - Response: $($messagingResponse | ConvertTo-Json -Depth 1)" -ForegroundColor Green
    
} catch {
    Write-Host "Messaging API Error: $($_.Exception.Message)" -ForegroundColor Red
}
