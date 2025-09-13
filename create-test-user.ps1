Write-Host "Creating new test user..." -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testEmail = "testuser$timestamp@example.com"
$testPassword = "TestPassword123!"

Write-Host "Email: $testEmail" -ForegroundColor Cyan

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method POST -ContentType "application/json" -Body (@{
        Email = $testEmail
        Password = $testPassword
        FirstName = "Test"
        LastName = "User"
        BirthDate = "1990-01-01T00:00:00Z"
        AcceptTerms = $true
        AcceptPrivacyPolicy = $true
        Language = "en"
        Theme = "light"
    } | ConvertTo-Json)
    
    Write-Host "✓ Registration successful" -ForegroundColor Green
    Write-Host "User ID: $($registerResponse.user.id)" -ForegroundColor Cyan
    
    # Save credentials for later use
    $credentials = @{
        email = $testEmail
        password = $testPassword
        userId = $registerResponse.user.id
        token = $registerResponse.accessToken
    }
    
    $credentials | ConvertTo-Json | Out-File -FilePath "test-user-credentials.json" -Encoding UTF8
    Write-Host "✓ Credentials saved to test-user-credentials.json" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}
