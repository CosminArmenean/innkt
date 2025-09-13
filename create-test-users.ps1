Write-Host "Creating test users for comprehensive testing..." -ForegroundColor Yellow

# Test users data
$testUsers = @(
    @{
        email = "testuser1@example.com"
        password = "TestPassword123!"
        firstName = "Test"
        lastName = "User1"
    },
    @{
        email = "alice.johnson@example.com"
        password = "TestPassword123!"
        firstName = "Alice"
        lastName = "Johnson"
    },
    @{
        email = "bob.smith@example.com"
        password = "TestPassword123!"
        firstName = "Bob"
        lastName = "Smith"
    }
)

$userTokens = @{}

foreach ($user in $testUsers) {
    Write-Host "Creating user: $($user.email)" -ForegroundColor Cyan
    
    try {
        $registerResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method POST -ContentType "application/json" -Body (@{
            Email = $user.email
            Password = $user.password
            FirstName = $user.firstName
            LastName = $user.lastName
            BirthDate = "1990-01-01T00:00:00Z"
            AcceptTerms = $true
            AcceptPrivacyPolicy = $true
            Language = "en"
            Theme = "light"
        } | ConvertTo-Json)
        
        $userTokens[$user.email] = $registerResponse.accessToken
        Write-Host "✓ User $($user.email) created successfully" -ForegroundColor Green
        
    } catch {
        Write-Host "⚠ User $($user.email) might already exist or failed: $($_.Exception.Message)" -ForegroundColor Yellow
        
        # Try to login if registration failed
        try {
            $loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body (@{
                Email = $user.email
                Password = $user.password
            } | ConvertTo-Json)
            
            $userTokens[$user.email] = $loginResponse.accessToken
            Write-Host "✓ User $($user.email) logged in successfully" -ForegroundColor Green
        } catch {
            Write-Host "✗ Failed to login user $($user.email)" -ForegroundColor Red
        }
    }
}

# Save tokens for later use
$userTokens | ConvertTo-Json | Out-File -FilePath "test-user-tokens.json" -Encoding UTF8
Write-Host "✓ User tokens saved to test-user-tokens.json" -ForegroundColor Green

Write-Host ""
Write-Host "Created users:" -ForegroundColor Cyan
foreach ($email in $userTokens.Keys) {
    Write-Host "  - $email" -ForegroundColor White
}

Write-Host ""
Write-Host "=== USER CREATION COMPLETE ===" -ForegroundColor Cyan