# Fix Admin Roles Script
# Updates 'owner' roles to 'admin' in the Groups database

param(
    [string]$Database = "innkt_groups",
    [string]$User = "postgres",
    [string]$Password = "postgres",
    [string]$DbHost = "localhost",
    [string]$Port = "5433"
)

Write-Host "Fixing admin roles in Groups database..." -ForegroundColor Cyan

# Create connection string
$connectionString = "Host=$DbHost;Port=$Port;Database=$Database;Username=$User;Password=$Password;"

try {
    # Load Npgsql assembly
    Add-Type -Path "C:\Program Files\dotnet\shared\Microsoft.NETCore.App\9.0.0\System.Data.Common.dll" -ErrorAction SilentlyContinue
    Add-Type -Path "C:\Program Files\dotnet\shared\Microsoft.NETCore.App\9.0.0\System.Data.dll" -ErrorAction SilentlyContinue
    
    # Use psql command instead
    $env:PGPASSWORD = $Password
    
    Write-Host "Updating owner roles to admin..." -ForegroundColor Yellow
    $updateQuery = @"
UPDATE "GroupMembers" 
SET "Role" = 'admin' 
WHERE "Role" = 'owner';
"@
    
    $updateQuery | psql -h $DbHost -p $Port -U $User -d $Database
    
    Write-Host "Checking results..." -ForegroundColor Yellow
    $checkQuery = @"
SELECT 
    g."Name" as group_name,
    gm."Role",
    gm."UserId",
    gm."IsActive"
FROM "Groups" g
JOIN "GroupMembers" gm ON g."Id" = gm."GroupId"
WHERE g."Name" LIKE '%Scoala%' OR g."Name" LIKE '%Test%';
"@
    
    $checkQuery | psql -h $DbHost -p $Port -U $User -d $Database
    
    Write-Host "Admin roles fixed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Trying alternative approach..." -ForegroundColor Yellow
    
    # Alternative: Use docker exec if available
    $dockerQuery = @"
UPDATE "GroupMembers" 
SET "Role" = 'admin' 
WHERE "Role" = 'owner';
"@
    
    $dockerQuery | docker exec -i innkt-postgres psql -U postgres -d innkt_groups
    
    Write-Host "Alternative approach completed!" -ForegroundColor Green
}
