# Create Test Accounts Script
# This script creates 4 test accounts with proper usernames and details

$baseUrl = "https://localhost:7001"  # Officer service URL
$accounts = @(
    @{
        Email = "bob.smith@example.com"
        Password = "TestPassword123!"
        FirstName = "Bob"
        LastName = "Smith"
        Username = "bob.smith"
        DisplayName = "Bob Smith"
    },
    @{
        Email = "alice.johnson@example.com"
        Password = "TestPassword123!"
        FirstName = "Alice"
        LastName = "Johnson"
        Username = "alice.johnson"
        DisplayName = "Alice Johnson"
    },
    @{
        Email = "charlie.brown@example.com"
        Password = "TestPassword123!"
        FirstName = "Charlie"
        LastName = "Brown"
        Username = "charlie.brown"
        DisplayName = "Charlie Brown"
    },
    @{
        Email = "diana.wilson@example.com"
        Password = "TestPassword123!"
        FirstName = "Diana"
        LastName = "Wilson"
        Username = "diana.wilson"
        DisplayName = "Diana Wilson"
    }
)

Write-Host "Creating test accounts..." -ForegroundColor Green

foreach ($account in $accounts) {
    try {
        $body = @{
            Email = $account.Email
            Password = $account.Password
            FirstName = $account.FirstName
            LastName = $account.LastName
            CountryCode = "US"
            BirthDate = "1990-01-01T00:00:00Z"
            Gender = "Other"
            Language = "en"
            Theme = "light"
            IsJointAccount = $false
            AcceptTerms = $true
            AcceptPrivacyPolicy = $true
            AcceptMarketing = $false
            AcceptCookies = $false
        } | ConvertTo-Json

        Write-Host "Creating account for $($account.Email)..." -ForegroundColor Yellow
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $body -ContentType "application/json" -SkipCertificateCheck
        
        Write-Host "✅ Successfully created account for $($account.Email)" -ForegroundColor Green
        Write-Host "   User ID: $($response.UserId)" -ForegroundColor Cyan
        Write-Host "   Username: $($account.Username)" -ForegroundColor Cyan
        Write-Host "   Display Name: $($account.DisplayName)" -ForegroundColor Cyan
        Write-Host ""
    }
    catch {
        Write-Host "❌ Failed to create account for $($account.Email)" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "Test account creation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Test accounts created:" -ForegroundColor Cyan
Write-Host "1. @bob.smith (Bob Smith) - bob.smith@example.com" -ForegroundColor White
Write-Host "2. @alice.johnson (Alice Johnson) - alice.johnson@example.com" -ForegroundColor White
Write-Host "3. @charlie.brown (Charlie Brown) - charlie.brown@example.com" -ForegroundColor White
Write-Host "4. @diana.wilson (Diana Wilson) - diana.wilson@example.com" -ForegroundColor White
Write-Host ""
Write-Host "You can now test the search functionality with these usernames!" -ForegroundColor Green
