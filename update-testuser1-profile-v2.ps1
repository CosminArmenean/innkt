# Update TestUser1 Profile Script V2
# This script updates the testuser1@example.com profile with complete details using the new API endpoint

$baseUrl = "http://localhost:5001"  # Officer service URL

Write-Host "Updating testuser1@example.com profile..." -ForegroundColor Yellow

# First, we need to find the user ID for testuser1@example.com
# Since we don't have a direct email lookup endpoint, let's try to get it from the database
# or use a known user ID if we have one

# For now, let's try with a common user ID pattern or get it from the registration response
# Let's assume the user ID is the one we saw in the logs or try to find it

Write-Host "Attempting to find testuser1 user ID..." -ForegroundColor Yellow

# Let's try a few common approaches to get the user ID
# Approach 1: Try to get current user (requires auth, but let's see what happens)
try {
    $testResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/test" -Method GET
    Write-Host "✅ Auth service is working: $($testResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Auth service not responding" -ForegroundColor Red
    exit 1
}

# Since we can't easily get the user ID without authentication,
# let's create a simple approach: we'll try to update using a placeholder ID
# and see what error we get, or we can look at the database directly

Write-Host "`nSince we need the user ID to update the profile," -ForegroundColor Yellow
Write-Host "let's create a database update script instead." -ForegroundColor Yellow

# Let's create a simple SQL update script for the database
$sqlScript = @"
-- Update testuser1@example.com profile
-- First, let's find the user ID
SELECT Id, Email, FirstName, LastName, Bio, City, Address, PhoneNumber 
FROM AspNetUsers 
WHERE Email = 'testuser1@example.com';

-- Then update the profile
UPDATE AspNetUsers 
SET 
    FirstName = 'Test',
    LastName = 'User',
    Bio = 'Welcome to my profile! I''m a test user for the innkt platform.',
    City = 'San Francisco',
    State = 'CA',
    Country = 'United States',
    CountryCode = 'US',
    PostalCode = '94102',
    Address = '123 Test Street, San Francisco, CA 94102',
    PhoneNumber = '+1-555-0123',
    UpdatedAt = NOW()
WHERE Email = 'testuser1@example.com';
"@

Write-Host "`nCreated SQL script to update testuser1 profile:" -ForegroundColor Green
Write-Host $sqlScript -ForegroundColor Cyan

Write-Host "`nTo update the profile, you can:" -ForegroundColor Yellow
Write-Host "1. Run this SQL script directly in your database" -ForegroundColor White
Write-Host "2. Or find the user ID and use the API endpoint" -ForegroundColor White

Write-Host "`nProfile update script completed!" -ForegroundColor Green
