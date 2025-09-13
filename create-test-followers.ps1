# Create Test Followers Script
Write-Host "=== CREATING TEST FOLLOWERS ===" -ForegroundColor Cyan
Write-Host ""

# Test user credentials
$testUserEmail = "testuser20250912103730@example.com"
$testUserPassword = "TestPassword123!"

# Test followers data
$testFollowers = @(
    @{
        FirstName = "Alice"
        LastName = "Johnson"
        Email = "alice.johnson@example.com"
        Username = "alice_j"
        DisplayName = "Alice Johnson"
    },
    @{
        FirstName = "Bob"
        LastName = "Smith"
        Email = "bob.smith@example.com"
        Username = "bob_smith"
        DisplayName = "Bob Smith"
    },
    @{
        FirstName = "Carol"
        LastName = "Davis"
        Email = "carol.davis@example.com"
        Username = "carol_d"
        DisplayName = "Carol Davis"
    },
    @{
        FirstName = "David"
        LastName = "Wilson"
        Email = "david.wilson@example.com"
        Username = "david_w"
        DisplayName = "David Wilson"
    },
    @{
        FirstName = "Eva"
        LastName = "Brown"
        Email = "eva.brown@example.com"
        Username = "eva_brown"
        DisplayName = "Eva Brown"
    }
)

# Login to get token
Write-Host "Logging in as test user..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -ContentType "application/json" -Body (@{
        Email = $testUserEmail
        Password = $testUserPassword
    } | ConvertTo-Json)
    
    $token = $loginResponse.accessToken
    Write-Host "✓ Login successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create test followers
Write-Host ""
Write-Host "Creating test followers..." -ForegroundColor Yellow

foreach ($follower in $testFollowers) {
    try {
        Write-Host "Creating follower: $($follower.DisplayName)..." -ForegroundColor Yellow
        
        $registrationData = @{
            FirstName = $follower.FirstName
            LastName = $follower.LastName
            Email = $follower.Email
            Password = "TestPassword123!"
            BirthDate = "1990-01-01T00:00:00Z"
            Language = "en"
            Theme = "light"
            AcceptTerms = $true
            AcceptPrivacyPolicy = $true
            AcceptMarketing = $false
            AcceptCookies = $false
        }
        
        $response = Invoke-RestMethod -Uri "http://localhost:5001/api/auth/register" -Method POST -ContentType "application/json" -Body ($registrationData | ConvertTo-Json)
        Write-Host "✓ Created: $($follower.DisplayName)" -ForegroundColor Green
        
        # Follow the test user
        try {
            $followResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/users/$($follower.Email)/follow" -Method POST -Headers @{"Authorization" = "Bearer $token"}
            Write-Host "  → Following test user" -ForegroundColor Green
        } catch {
            Write-Host "  → Could not follow test user (API might not exist yet)" -ForegroundColor Yellow
        }
        
    } catch {
        if ($_.Exception.Message -like "*already exists*") {
            Write-Host "  → User already exists: $($follower.DisplayName)" -ForegroundColor Yellow
        } else {
            Write-Host "  ✗ Failed to create: $($follower.DisplayName) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=== TEST FOLLOWERS CREATION COMPLETE ===" -ForegroundColor Cyan
Write-Host "Test followers created for testing social features" -ForegroundColor Green
Write-Host ""
Write-Host "You can now test:" -ForegroundColor Yellow
Write-Host "- Following/Unfollowing users" -ForegroundColor White
Write-Host "- Messaging between users" -ForegroundColor White
Write-Host "- Social interactions (likes, comments, shares)" -ForegroundColor White
Write-Host "- Group invitations and management" -ForegroundColor White