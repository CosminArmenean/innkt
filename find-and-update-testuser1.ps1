# Find and Update TestUser1 Profile Script
# This script finds the testuser1@example.com user ID and updates the profile

$baseUrl = "http://localhost:5001"  # Officer service URL

Write-Host "Finding and updating testuser1@example.com profile..." -ForegroundColor Yellow

# First, let's test the auth service
try {
    $testResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/test" -Method GET
    Write-Host "✅ Auth service is working: $($testResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Auth service not responding" -ForegroundColor Red
    exit 1
}

# Since we don't have a direct email lookup endpoint, let's try a different approach
# We can try to get the user ID by looking at the database or by trying common patterns

Write-Host "`nAttempting to find testuser1 user ID..." -ForegroundColor Yellow

# Let's try to get the user ID by looking at the database
# We'll create a simple database query to find the user ID

$dbQuery = @"
-- Find testuser1@example.com user ID
SELECT Id, Email, FirstName, LastName, UserName, CreatedAt 
FROM AspNetUsers 
WHERE Email = 'testuser1@example.com' 
ORDER BY CreatedAt DESC 
LIMIT 1;
"@

Write-Host "Database query to find user ID:" -ForegroundColor Cyan
Write-Host $dbQuery -ForegroundColor White

# For now, let's try to update using a placeholder approach
# We'll create a script that can be run after we get the user ID

$updateScript = @"
# Once you have the user ID, run this script to update the profile
`$userId = "REPLACE_WITH_ACTUAL_USER_ID"  # Replace with actual user ID from database query
`$baseUrl = "http://localhost:5001"

`$profileUpdate = @{
    FirstName = "Test"
    LastName = "User"
    Bio = "Welcome to my profile! I'm a test user for the innkt platform."
    Location = "San Francisco, CA"
    Website = "https://testuser1.example.com"
    DateOfBirth = "1990-01-15"
    PhoneNumber = "+1-555-0123"
    Address = "123 Test Street, San Francisco, CA 94102"
    City = "San Francisco"
    State = "CA"
    Country = "United States"
    PostalCode = "94102"
} | ConvertTo-Json

Write-Host "Updating profile for user ID: `$userId" -ForegroundColor Yellow

try {
    `$updateResponse = Invoke-RestMethod -Uri "`$baseUrl/api/users/`$userId" -Method PUT -Body `$profileUpdate -ContentType "application/json"
    Write-Host "✅ Successfully updated profile!" -ForegroundColor Green
    Write-Host "   Display Name: `$(`$updateResponse.firstName) `$(`$updateResponse.lastName)" -ForegroundColor Cyan
    Write-Host "   Bio: `$(`$updateResponse.bio)" -ForegroundColor Cyan
    Write-Host "   Location: `$(`$updateResponse.location)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to update profile" -ForegroundColor Red
    Write-Host "   Error: `$(`$_.Exception.Message)" -ForegroundColor Red
}
"@

Write-Host "`nUpdate script (to run after getting user ID):" -ForegroundColor Green
Write-Host $updateScript -ForegroundColor Cyan

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run the database query to find the user ID" -ForegroundColor White
Write-Host "2. Replace 'REPLACE_WITH_ACTUAL_USER_ID' in the update script with the actual user ID" -ForegroundColor White
Write-Host "3. Run the update script" -ForegroundColor White

Write-Host "`nScript completed!" -ForegroundColor Green
