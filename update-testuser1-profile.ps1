# Update TestUser1 Profile Script
# This script updates the testuser1@example.com profile with complete details

$baseUrl = "http://localhost:5001"  # Officer service URL

# First, let's get the current user profile to get the User ID
Write-Host "Getting current user profile for testuser1@example.com..." -ForegroundColor Yellow

try {
    # Get user by email to find the User ID
    $userResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/by-email/testuser1@example.com" -Method GET
    $userId = $userResponse.id
    
    Write-Host "Found User ID: $userId" -ForegroundColor Green
    
    # Update profile with complete details
    $profileUpdate = @{
        FirstName = "Test"
        LastName = "User"
        Bio = "Welcome to my profile! I'm a test user for the innkt platform."
        Location = "San Francisco, CA"
        Website = "https://testuser1.example.com"
        BirthDate = "1990-01-15"
        Gender = "Other"
        City = "San Francisco"
        State = "CA"
        Country = "United States"
        CountryCode = "US"
        PostalCode = "94102"
        PhoneNumber = "+1-555-0123"
        Address = "123 Test Street, San Francisco, CA 94102"
    } | ConvertTo-Json

    Write-Host "Updating profile for testuser1@example.com..." -ForegroundColor Yellow
    
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/$userId/profile" -Method PUT -Body $profileUpdate -ContentType "application/json"
    
    Write-Host "✅ Successfully updated profile for testuser1@example.com" -ForegroundColor Green
    Write-Host "   Display Name: $($updateResponse.firstName) $($updateResponse.lastName)" -ForegroundColor Cyan
    Write-Host "   Bio: $($updateResponse.bio)" -ForegroundColor Cyan
    Write-Host "   Location: $($updateResponse.location)" -ForegroundColor Cyan
    Write-Host "   Website: $($updateResponse.website)" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Failed to update profile for testuser1@example.com" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # If the API endpoint doesn't exist, let's try a different approach
    Write-Host "`nTrying alternative approach..." -ForegroundColor Yellow
    
    try {
        # Try to get all users and find testuser1
        $allUsersResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method GET
        $testUser = $allUsersResponse | Where-Object { $_.email -eq "testuser1@example.com" }
        
        if ($testUser) {
            Write-Host "Found testuser1 in users list:" -ForegroundColor Green
            Write-Host "   User ID: $($testUser.id)" -ForegroundColor Cyan
            Write-Host "   Email: $($testUser.email)" -ForegroundColor Cyan
            Write-Host "   First Name: $($testUser.firstName)" -ForegroundColor Cyan
            Write-Host "   Last Name: $($testUser.lastName)" -ForegroundColor Cyan
        } else {
            Write-Host "Could not find testuser1@example.com in users list" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Failed to get users list: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nProfile update attempt completed!" -ForegroundColor Green
