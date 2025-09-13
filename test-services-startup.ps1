# Test Services Startup Script
Write-Host "Testing Services Startup..." -ForegroundColor Green

# Function to test a service
function Test-ServiceStartup {
    param(
        [string]$ServiceName,
        [string]$Path,
        [string]$Command,
        [int]$Port,
        [int]$TimeoutSeconds = 30
    )
    
    Write-Host "`nTesting $ServiceName..." -ForegroundColor Yellow
    Write-Host "Path: $Path" -ForegroundColor Gray
    Write-Host "Command: $Command" -ForegroundColor Gray
    Write-Host "Expected Port: $Port" -ForegroundColor Gray
    
    # Check if directory exists
    if (-not (Test-Path $Path)) {
        Write-Host "Directory not found: $Path" -ForegroundColor Red
        return $false
    }
    
    # Change to directory
    Push-Location $Path
    
    try {
        Write-Host "Building $ServiceName..." -ForegroundColor Cyan
        $buildResult = & dotnet build 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Build failed for $ServiceName" -ForegroundColor Red
            Write-Host $buildResult -ForegroundColor Red
            return $false
        }
        Write-Host "Build successful" -ForegroundColor Green
        
        # Try to start the service
        Write-Host "Starting $ServiceName..." -ForegroundColor Cyan
        $process = Start-Process -FilePath "dotnet" -ArgumentList "run" -PassThru -WindowStyle Hidden
        
        # Wait for service to start
        $waited = 0
        $started = $false
        
        while ($waited -lt $TimeoutSeconds) {
            try {
                $tcpClient = New-Object System.Net.Sockets.TcpClient
                $tcpClient.Connect("localhost", $Port)
                $tcpClient.Close()
                $started = $true
                break
            }
            catch {
                Start-Sleep -Seconds 2
                $waited += 2
                Write-Host "." -NoNewline -ForegroundColor Yellow
            }
        }
        
        if ($started) {
            Write-Host "`n$ServiceName started successfully on port $Port" -ForegroundColor Green
            # Don't kill the process, let it run
            return $true
        } else {
            Write-Host "`n$ServiceName failed to start on port $Port within $TimeoutSeconds seconds" -ForegroundColor Red
            if (-not $process.HasExited) {
                $process.Kill()
            }
            return $false
        }
    }
    catch {
        Write-Host "`nError starting $ServiceName: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

# Test the missing services
$services = @(
    @{ Name = "Groups Service"; Path = "Backend\innkt.Groups"; Command = "dotnet run"; Port = 5002 },
    @{ Name = "NeuroSpark Service"; Path = "Backend\innkt.NeuroSpark\innkt.NeuroSpark"; Command = "dotnet run"; Port = 5003 },
    @{ Name = "Seer Service"; Path = "Backend\innkt.Seer"; Command = "dotnet run"; Port = 5267 },
    @{ Name = "Frontier Service"; Path = "Backend\innkt.Frontier"; Command = "dotnet run"; Port = 51303 }
)

$results = @()
foreach ($service in $services) {
    $result = Test-ServiceStartup -ServiceName $service.Name -Path $service.Path -Command $service.Command -Port $service.Port
    $results += @{ Service = $service.Name; Success = $result }
}

Write-Host "`n=== Test Results ===" -ForegroundColor Green
foreach ($result in $results) {
    if ($result.Success) {
        Write-Host "$($result.Service) - Started" -ForegroundColor Green
    } else {
        Write-Host "$($result.Service) - Failed" -ForegroundColor Red
    }
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
Read-Host
