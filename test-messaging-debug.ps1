Write-Host "Testing messaging API with detailed error handling..." -ForegroundColor Yellow

$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImYxMmU0Yjg2LWY2MmItNDYxZS1iYTE3LWZlMjI2MWM4MDljOSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6InRlc3R1c2VyMjAyNTA5MTIxNDQ4NDNAZXhhbXBsZS5jb20iLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiVGVzdCBVc2VyIiwiZmlyc3ROYW1lIjoiVGVzdCIsImxhc3ROYW1lIjoiVXNlciIsImlzSm9pbnRBY2NvdW50IjoiRmFsc2UiLCJsYW5ndWFnZSI6ImVuIiwidGhlbWUiOiJsaWdodCIsImV4cCI6MTc1NzY4MTMyNiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo1MDAxIiwiYXVkIjoiaW5ua3Qub2ZmaWNlci5hcGkifQ.RKwPHAdMZ23iYPn9d2_EWSNXI3uncM15sWRYhR1QAbQ"

try {
    Write-Host "Testing GET /api/conversations..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method GET -Headers @{"Authorization" = "Bearer $token"}
    Write-Host "✓ Conversations API working" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Conversations API Error:" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

try {
    Write-Host ""
    Write-Host "Testing POST /api/conversations..." -ForegroundColor Yellow
    $conversationData = @{
        type = "direct"
        participants = @("testuser20250912144843@example.com", "alice.johnson@example.com")
        name = "Test Conversation"
        description = "Test conversation for UI testing"
    }
    
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/conversations" -Method POST -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -Body ($conversationData | ConvertTo-Json)
    Write-Host "✓ Create conversation API working" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Create conversation API Error:" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}
