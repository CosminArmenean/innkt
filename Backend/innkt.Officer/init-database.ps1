# INNKT Database Initialization PowerShell Script
# This script helps initialize the MySQL database for the INNKT application

Write-Host "INNKT Database Initialization" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Check if MySQL is accessible
Write-Host "Checking MySQL connection..." -ForegroundColor Yellow

try {
    # Try to connect to MySQL using .NET
    $connectionString = "Server=127.0.0.1;Port=3306;User=admin_officer;Password=@CAvp57rt26;"
    
    # Create a simple connection test
    $connection = New-Object System.Data.Odbc.OdbcConnection
    $connection.ConnectionString = "Driver={MySQL ODBC 8.0 Driver};Server=127.0.0.1;Port=3306;Database=mysql;User=admin_officer;Password=@CAvp57rt26;"
    
    Write-Host "Attempting to connect to MySQL..." -ForegroundColor Yellow
    $connection.Open()
    Write-Host "MySQL connection successful!" -ForegroundColor Green
    $connection.Close()
}
catch {
    Write-Host "MySQL connection failed. Please ensure:" -ForegroundColor Red
    Write-Host "1. MySQL server is running on 127.0.0.1:3306" -ForegroundColor Red
    Write-Host "2. User 'admin_officer' exists with password '@CAvp57rt26'" -ForegroundColor Red
    Write-Host "3. MySQL ODBC driver is installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Run the init-database.sql script manually in MySQL Workbench or command line" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run the init-database.sql script in MySQL Workbench or command line" -ForegroundColor Cyan
Write-Host "2. Or use: mysql -h 127.0.0.1 -P 3306 -u admin_officer -p < init-database.sql" -ForegroundColor Cyan
Write-Host "3. Then run: dotnet ef database update --context ApplicationDbContext" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")




